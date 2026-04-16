import { GenerateChunk } from '../types/ollama';

export async function* parseNDJSONStream(
  response: Response
): AsyncGenerator<GenerateChunk> {
  // This is only used on Web where response.body exists
  if (!response.body) return;
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            yield JSON.parse(trimmed);
          } catch (e) {
            console.warn('parseNDJSONStream: Failed to parse line', e);
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer.trim());
      } catch (e) {
        console.warn('parseNDJSONStream: Failed to parse final buffer', e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}