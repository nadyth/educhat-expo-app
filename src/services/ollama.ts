import { Platform } from 'react-native';
import { OllamaModel, OllamaModelsResponse, GenerateRequest, GenerateChunk } from '../types/ollama';
import { parseNDJSONStream } from '../utils/streamParser';
import { API_ENDPOINTS } from '../constants/api';
import { apiGet, getAccessTokenSync, getApiUrl } from './api';

export async function fetchModels(): Promise<OllamaModel[]> {
  const data = await apiGet<OllamaModelsResponse>(API_ENDPOINTS.OLLAMA_MODELS);
  return data.models ?? [];
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

  console.log('Generating stream from URL:', url);

  if (Platform.OS === 'web') {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama generate failed: ${response.status} - ${errorText}`);
    }

    yield* parseNDJSONStream(response);
  } else {
    // --- Native: Robust XMLHttpRequest-based streaming ---
    yield* (async function* () {
      let seenBytes = 0;
      let isDone = false;
      let error: any = null;
      const queue: string[] = [];
      let resolveNext: ((value: void) => void) | null = null;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      for (const [key, value] of Object.entries(headers)) {
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
      while (!isDone || queue.length > 0 || buffer.length > 0) {
        if (queue.length === 0 && !isDone) {
          await new Promise<void>(resolve => { resolveNext = resolve; });
        }

        if (error) throw error;

        while (queue.length > 0) {
          const line = queue.shift()!;
          buffer += line;

          try {
            const parsed = JSON.parse(buffer);
            yield parsed;
            buffer = '';
          } catch (e) {
            // Buffer is incomplete JSON, keep accumulating
          }
        }

        if (isDone && queue.length === 0) break;
      }
    })();
  }
}