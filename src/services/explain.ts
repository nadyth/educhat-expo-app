import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../constants/api';
import { getAccessTokenSync, getApiUrl, refreshAndRetry } from './api';
import type { SourcePage } from '../types/chat';

export interface ExplainStepEvent {
  type: 'step';
  step: string;
  label: string;
}

export interface ExplainSourcesEvent {
  type: 'sources';
  pages: SourcePage[];
}

export interface ExplainTokenEvent {
  type: 'token';
  text: string;
}

export interface ExplainDoneEvent {
  type: 'done';
}

export type ExplainEvent =
  | ExplainStepEvent
  | ExplainSourcesEvent
  | ExplainTokenEvent
  | ExplainDoneEvent;

/**
 * Parse an SSE stream from the explain endpoint.
 * SSE format: "event: <type>\ndata: <json>\n\n"
 */
function parseSSEChunk(chunk: string): ExplainEvent[] {
  const events: ExplainEvent[] = [];
  const parts = chunk.split('\n\n');

  for (const part of parts) {
    if (!part.trim()) continue;

    let eventType = '';
    let dataStr = '';

    for (const line of part.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6);
      }
    }

    if (!eventType || !dataStr) continue;

    try {
      const data = JSON.parse(dataStr);

      switch (eventType) {
        case 'step':
          events.push({ type: 'step', step: data.step, label: data.label });
          break;
        case 'sources':
          events.push({ type: 'sources', pages: data.pages });
          break;
        case 'token':
          events.push({ type: 'token', text: data.text });
          break;
        case 'done':
          events.push({ type: 'done' });
          break;
      }
    } catch {
      // Skip unparseable events
    }
  }

  return events;
}

/**
 * Stream explain-concept response from the backend.
 * Calls POST /files/{fileId}/explain with { question } body.
 * Yields SSE events as they arrive.
 */
export async function* explainStream(
  fileId: string,
  question: string,
): AsyncGenerator<ExplainEvent> {
  const url = getApiUrl(API_ENDPOINTS.FILE_EXPLAIN(fileId));
  const token = getAccessTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const body = JSON.stringify({ question });

  if (Platform.OS === 'web') {
    let response = await fetch(url, { method: 'POST', headers, body });

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
      throw new Error(`Explain failed: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');

      // Keep the last (potentially incomplete) part in the buffer
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;
        const events = parseSSEChunk(part + '\n\n');
        for (const event of events) {
          yield event;
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const events = parseSSEChunk(buffer + '\n\n');
      for (const event of events) {
        yield event;
      }
    }
  } else {
    // --- Native: XMLHttpRequest-based SSE streaming ---
    yield* (async function* () {
      for (let attempt = 0; attempt < 2; attempt++) {
        let currentHeaders = { ...headers };
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
            queue.push(newData);
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        };

        xhr.onprogress = processResponse;

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 2) {
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

        let sseBuffer = '';

        while (!isDone || queue.length > 0 || sseBuffer.length > 0) {
          if (queue.length === 0 && !isDone) {
            await new Promise<void>(resolve => { resolveNext = resolve; });
          }

          if (error) throw error;
          if (got401) break;

          while (queue.length > 0) {
            sseBuffer += queue.shift()!;

            // Try to extract complete SSE events from the buffer
            const parts = sseBuffer.split('\n\n');
            // Keep the last (potentially incomplete) part
            sseBuffer = parts.pop() || '';

            for (const part of parts) {
              if (!part.trim()) continue;
              const events = parseSSEChunk(part + '\n\n');
              for (const event of events) {
                yield event;
              }
            }
          }

          if (isDone && queue.length === 0) {
            // Process remaining buffer
            if (sseBuffer.trim()) {
              const events = parseSSEChunk(sseBuffer + '\n\n');
              for (const event of events) {
                yield event;
              }
            }
            break;
          }
        }

        if (got401 && attempt === 0) {
          const newToken = await refreshAndRetry();
          if (!newToken) {
            throw new Error('Session expired. Please sign in again.');
          }
          currentHeaders = {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${newToken}`,
          };
          continue;
        }

        if (got401 && attempt === 1) {
          throw new Error('Session expired. Please sign in again.');
        }

        break;
      }
    })();
  }
}