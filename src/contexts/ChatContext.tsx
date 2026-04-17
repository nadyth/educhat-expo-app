import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types/chat';
import { GenerateChunk } from '../types/ollama';
import { generateStream } from '../services/ollama';
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '../constants/ollama';
import { generateId } from '../utils/formatters';
import { EDUCATION_PROMPTS, PromptType } from '../utils/educationPrompts';

const STORAGE_KEY_MODEL = '@educhat_default_model';

interface ChatContextType {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentModel: string | null;
  hasSelectedModel: boolean;
  isLoadingModel: boolean;
  systemPrompt: string;
  promptType: PromptType;
  error: string | null;
  tokensPerSecond: number | null;
  totalMessagesSent: number;
  modelsUsed: Set<string>;
  sendMessage: (text: string) => Promise<void>;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: PromptType) => void;
  clearChat: () => void;
  stopGeneration: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [hasSelectedModel, setHasSelectedModel] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [systemPrompt, setSystemPromptState] = useState(DEFAULT_SYSTEM_PROMPT);
  const [promptType, setPromptType] = useState<PromptType>('default');
  const [error, setError] = useState<string | null>(null);
  const [tokensPerSecond, setTokensPerSecond] = useState<number | null>(null);
  const [totalMessagesSent, setTotalMessagesSent] = useState(0);
  const [modelsUsed, setModelsUsed] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  // Load saved model on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_MODEL);
        if (saved) {
          setCurrentModel(saved);
          setHasSelectedModel(true);
          setModelsUsed(new Set([saved]));
        }
      } catch {
        // Ignore storage errors, user will select model
      } finally {
        setIsLoadingModel(false);
      }
    })();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim() || !currentModel) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      text: text.trim(),
      createdAt: new Date(),
      isUser: true,
    };

    const aiMessageId = generateId();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      text: '',
      createdAt: new Date(),
      isUser: false,
      model: currentModel,
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsStreaming(true);
    setError(null);
    setTokensPerSecond(null);
    setTotalMessagesSent(prev => prev + 1);

    // Build prompt from conversation history
    const conversationHistory = messages
      .map(m => `${m.isUser ? 'Student' : 'Assistant'}: ${m.text}`)
      .join('\n');
    const prompt = conversationHistory
      ? `${conversationHistory}\nStudent: ${text.trim()}\nAssistant:`
      : text.trim();

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const generator = generateStream({
        model: currentModel,
        prompt,
        stream: true,
        system: systemPrompt,
      });

      let accumulatedText = '';
      let accumulatedThinking = '';

      for await (const chunk of generator as AsyncGenerator<GenerateChunk>) {
        if (abortController.signal.aborted) break;

        if (chunk.thinking) {
          accumulatedThinking += chunk.thinking;
          const currentThinking = accumulatedThinking;
          setMessages(prev =>
            prev.map(m => (m.id === aiMessageId ? { ...m, thinking: currentThinking } : m))
          );
        }

        if (chunk.response) {
          accumulatedText += chunk.response;
          const currentText = accumulatedText;
          const currentThinking = accumulatedThinking;
          setMessages(prev =>
            prev.map(m => (m.id === aiMessageId ? { ...m, text: currentText, thinking: currentThinking } : m))
          );
        }

        if (chunk.done) {
          if (chunk.eval_count && chunk.eval_duration) {
            const tps = chunk.eval_count / (chunk.eval_duration / 1e9);
            setTokensPerSecond(tps);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to get response');
        // Remove empty AI message on error
        setMessages(prev => prev.filter(m => m.id !== aiMessageId || m.text !== ''));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, currentModel, systemPrompt, messages]);

  const setModel = useCallback((model: string) => {
    setCurrentModel(model);
    setHasSelectedModel(true);
    setModelsUsed(prev => new Set([...prev, model]));
    AsyncStorage.setItem(STORAGE_KEY_MODEL, model).catch(() => {});
  }, []);

  const setSystemPrompt = useCallback((type: PromptType) => {
    setPromptType(type);
    setSystemPromptState(EDUCATION_PROMPTS[type]);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setTokensPerSecond(null);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isStreaming,
        currentModel,
        hasSelectedModel,
        isLoadingModel,
        systemPrompt,
        promptType,
        error,
        tokensPerSecond,
        totalMessagesSent,
        modelsUsed,
        sendMessage,
        setModel,
        setSystemPrompt,
        clearChat,
        stopGeneration,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}