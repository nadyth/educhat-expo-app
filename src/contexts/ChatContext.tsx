import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, SourcePage } from '../types/chat';
import { explainStream } from '../services/explain';
import { listFiles, type FileOut } from '../services/files';
import { generateId } from '../utils/formatters';

const STORAGE_KEY_FILE = '@educhat_selected_file';

interface ChatContextType {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedFile: FileOut | null;
  hasSelectedFile: boolean;
  isLoadingFile: boolean;
  currentStep: string | null;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  setFile: (file: FileOut) => void;
  clearChat: () => void;
  stopGeneration: () => void;
  loadAvailableFiles: () => Promise<FileOut[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileOut | null>(null);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load saved file selection on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_FILE);
        if (saved) {
          const savedFile: FileOut = JSON.parse(saved);
          // Verify file still exists by loading files list
          const files = await listFiles();
          const match = files.find(f => f.id === savedFile.id && f.processing_status === 'completed');
          if (match) {
            setSelectedFile(match);
            setHasSelectedFile(true);
          } else {
            // File no longer exists or isn't processed, clear saved selection
            await AsyncStorage.removeItem(STORAGE_KEY_FILE);
          }
        }
      } catch {
        // Ignore storage errors, user will select file
      } finally {
        setIsLoadingFile(false);
      }
    })();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !text.trim() || !selectedFile) return;

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
      fileName: selectedFile.original_name,
      stepLabel: '',
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsStreaming(true);
    setError(null);
    setCurrentStep('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const generator = explainStream(selectedFile.id, text.trim());

      let accumulatedText = '';
      let currentSources: SourcePage[] | undefined;
      let currentStepLabel = '';

      for await (const event of generator) {
        if (abortController.signal.aborted) break;

        switch (event.type) {
          case 'step':
            currentStepLabel = event.label;
            setCurrentStep(event.label);
            setMessages(prev =>
              prev.map(m => (m.id === aiMessageId ? { ...m, stepLabel: event.label } : m))
            );
            break;

          case 'sources':
            currentSources = event.pages;
            setMessages(prev =>
              prev.map(m => (m.id === aiMessageId ? { ...m, sources: event.pages } : m))
            );
            break;

          case 'token':
            accumulatedText += event.text;
            const textSnapshot = accumulatedText;
            const sourcesSnapshot = currentSources;
            const stepSnapshot = currentStepLabel;
            setMessages(prev =>
              prev.map(m =>
                m.id === aiMessageId
                  ? { ...m, text: textSnapshot, sources: sourcesSnapshot, stepLabel: stepSnapshot }
                  : m
              )
            );
            break;

          case 'done':
            // Clear step label on completion
            setCurrentStep(null);
            setMessages(prev =>
              prev.map(m => (m.id === aiMessageId ? { ...m, stepLabel: undefined } : m))
            );
            break;
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to get response');
        setMessages(prev => prev.filter(m => m.id !== aiMessageId || m.text !== ''));
      }
    } finally {
      setIsStreaming(false);
      setCurrentStep(null);
      abortRef.current = null;
    }
  }, [isStreaming, selectedFile]);

  const setFile = useCallback((file: FileOut) => {
    setSelectedFile(file);
    setHasSelectedFile(true);
    AsyncStorage.setItem(STORAGE_KEY_FILE, JSON.stringify(file)).catch(() => {});
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const loadAvailableFiles = useCallback(async (): Promise<FileOut[]> => {
    const files = await listFiles();
    // Only return files that have been processed
    return files.filter(f => f.processing_status === 'completed');
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isStreaming,
        selectedFile,
        hasSelectedFile,
        isLoadingFile,
        currentStep,
        error,
        sendMessage,
        setFile,
        clearChat,
        stopGeneration,
        loadAvailableFiles,
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