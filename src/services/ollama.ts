import { Platform } from 'react-native';
import { OllamaModel, OllamaModelsResponse, GenerateRequest, GenerateChunk } from '../types/ollama';
import { parseNDJSONStream } from '../utils/streamParser';
import { OLLAMA_BASE_URL as DEFAULT_BASE_URL } from '../constants/ollama';

const OLLAMA_BASE_URL = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL || DEFAULT_BASE_URL;
const OLLAMA_API_KEY = process.env.EXPO_PUBLIC_OLLAMA_API_KEY || '';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
  }
  return headers;
}

export async function fetchModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data: OllamaModelsResponse = await response.json();
  return data.models ?? [];
}

export async function* generateStream(
  request: GenerateRequest
): AsyncGenerator<GenerateChunk> {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  const body = JSON.stringify({ ...request, stream: true });
  const headers = getHeaders();

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
            // The last item might be a partial line, but in status 3 we check for full JSON later
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
            // Check if buffer is valid JSON
            const parsed = JSON.parse(buffer);
            yield parsed;
            buffer = ''; // Reset buffer on success
          } catch (e) {
            // Buffer is incomplete JSON, keep it and append next line
            // or if it's multiple JSONs joined, this logic needs adjustment
            // but Ollama usually sends one JSON per line.
          }
        }
        
        if (isDone && queue.length === 0) break;
      }
    })();
  }
}