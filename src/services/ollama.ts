import { Platform } from 'react-native';
import { OllamaModel, OllamaModelsResponse, GenerateRequest, GenerateChunk } from '../types/ollama';
import { parseNDJSONStream } from '../utils/streamParser';
import { API_ENDPOINTS } from '../constants/api';
import { apiGet, getAccessTokenSync, getApiUrl, refreshAndRetry } from './api';

export async function fetchModels(): Promise<OllamaModel[]> {
  const data = await apiGet<OllamaModelsResponse>(API_ENDPOINTS.OLLAMA_MODELS);
  const models = data.models ?? [];
  return models.sort((a, b) => new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime());
}

export async function* generateStream(
  request: GenerateRequest
): AsyncGenerator<GenerateChunk> {
  const url = getApiUrl(API_ENDPOINTS.OLLAMA_GENERATE);
  const token = getAccessTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const body = JSON.stringify({ ...request, stream: true });

  if (Platform.OS === 'web') {
    let response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    // If 401, try refreshing the token and retry once
    if (response.status === 401 && token) {
      const newToken = await refreshAndRetry();
      if (newToken) {
        response = await fetch(url, {
          method: 'POST',
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          body,
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama generate failed: ${response.status} - ${errorText}`);
    }

    yield* parseNDJSONStream(response);
  } else {
    // --- Native: Robust XMLHttpRequest-based streaming ---
    // We need to handle 401 with retry for native too.
    // First, try a lightweight HEAD/POST to check auth — but XHR streaming
    // doesn't let us easily retry the body. Instead, we preflight the token
    // and refresh if needed before starting the stream.
    let currentToken = token;
    let currentHeaders = { ...headers };

    // Check if token might be expired by doing a quick authenticated request
    // We'll rely on the 401-detection approach: start the request, and if
    // we get a 401 status, abort, refresh, and retry.
    yield* (async function* () {
      for (let attempt = 0; attempt < 2; attempt++) {
        let seenBytes = 0;
        let isDone = false;
        let error: any = null;
        let got401 = false;
        const queue: string[] = [];
        let resolveNext: ((value: void) => void) | null = null;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);

        for (const [key, value] of Object.entries(currentHeaders)) {
          xhr.setRequestHeader(key, value);
        }

        const processResponse = () => {
          const text = xhr.responseText;
          if (text.length > seenBytes) {
            const newData = text.substring(seenBytes);
            seenBytes = text.length;

            const lines = newData.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].trim()) {
                queue.push(lines[i]);
              }
            }
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        };

        xhr.onprogress = processResponse;

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 2) {
            // Headers received — check for 401 before streaming data
            if (xhr.status === 401) {
              got401 = true;
              isDone = true;
              if (resolveNext) {
                resolveNext();
                resolveNext = null;
              }
            }
          }
          if (xhr.readyState === 3 || xhr.readyState === 4) {
            processResponse();
          }
          if (xhr.readyState === 4) {
            isDone = true;
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        };

        xhr.onerror = () => {
          error = new Error('Network request failed');
          if (resolveNext) resolveNext();
        };

        xhr.send(body);

        let buffer = '';
        let yieldedAny = false;
        while (!isDone || queue.length > 0 || buffer.length > 0) {
          if (queue.length === 0 && !isDone) {
            await new Promise<void>(resolve => { resolveNext = resolve; });
          }

          if (error) throw error;

          if (got401) break; // Don't process 401 response body

          while (queue.length > 0) {
            const line = queue.shift()!;
            buffer += line;

            try {
              const parsed = JSON.parse(buffer);
              yield parsed;
              yieldedAny = true;
              buffer = '';
            } catch (e) {
              // Buffer is incomplete JSON, keep accumulating
            }
          }

          if (isDone && queue.length === 0) break;
        }

        // If we got a 401 on the first attempt, refresh and retry
        if (got401 && attempt === 0) {
          const newToken = await refreshAndRetry();
          if (!newToken) {
            throw new Error('Session expired. Please sign in again.');
          }
          currentToken = newToken;
          currentHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          };
          continue; // retry
        }

        // If second attempt also 401, or non-401 completion, we're done
        if (got401 && attempt === 1) {
          throw new Error('Session expired. Please sign in again.');
        }

        break; // successful completion
      }
    })();
  }
}