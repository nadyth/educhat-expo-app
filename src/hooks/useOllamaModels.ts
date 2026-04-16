import { useState, useEffect, useCallback } from 'react';
import { OllamaModel } from '../types/ollama';
import { fetchModels } from '../services/ollama';

interface UseOllamaModelsReturn {
  models: OllamaModel[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOllamaModels(): UseOllamaModelsReturn {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchModels();
      setModels(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return { models, isLoading, error, refresh: loadModels };
}