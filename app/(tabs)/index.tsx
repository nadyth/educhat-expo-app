import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform, Keyboard, Text } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useChat } from '../../src/contexts/ChatContext';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { FilePicker, FilePickerTrigger } from '../../src/components/chat/FilePicker';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { theme } from '../../src/constants/theme';
import type { FileOut } from '../../src/services/files';

export default function ChatScreen() {
  const headerHeight = useHeaderHeight();
  const {
    messages,
    isStreaming,
    selectedFile,
    hasSelectedFile,
    isLoadingFile,
    error,
    currentStep,
    sendMessage,
    setFile,
    clearChat,
    stopGeneration,
    loadAvailableFiles,
  } = useChat();
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<FileOut[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Auto-open file picker if no file selected yet (after storage load completes)
  useEffect(() => {
    if (!isLoadingFile && !hasSelectedFile) {
      setShowFilePicker(true);
    }
  }, [isLoadingFile, hasSelectedFile]);

  // Load files when picker is opened
  const handleOpenFilePicker = async () => {
    setShowFilePicker(true);
    setIsLoadingFiles(true);
    try {
      const files = await loadAvailableFiles();
      setAvailableFiles(files);
    } catch {
      // Error handled silently, empty list shown
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, messages[messages.length - 1]?.text]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (messages.length > 0) {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    );
    return () => showSubscription.remove();
  }, [messages.length]);

  const renderMessage = ({ item }: { item: typeof messages[number] }) => (
    <ChatBubble
      text={item.text}
      isUser={item.isUser}
      isStreaming={isStreaming && !item.isUser && item === messages[messages.length - 1]}
      fileName={item.isUser ? undefined : item.fileName}
      stepLabel={item.stepLabel}
      sources={item.sources}
    />
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {isLoadingFile ? null : !hasSelectedFile ? (
          <View style={styles.noFileContainer}>
            <Text style={styles.noFileText}>Select a document to start chatting</Text>
          </View>
        ) : messages.length === 0 && !isStreaming ? (
          <EmptyState onSuggestionPress={sendMessage} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isStreaming && messages[messages.length - 1]?.text === '' ? (
                <TypingIndicator label={currentStep || undefined} />
              ) : null
            }
          />
        )}

        {error && (
          <View style={styles.errorBar} />
        )}

        {isLoadingFile ? null : !hasSelectedFile ? (
          <View style={styles.fileRequiredArea}>
            <FilePickerTrigger
              currentFile={null}
              onPress={handleOpenFilePicker}
            />
          </View>
        ) : (
          <View style={styles.inputArea}>
            <FilePickerTrigger
              currentFile={selectedFile}
              onPress={handleOpenFilePicker}
            />
            <ChatInput
              onSend={sendMessage}
              onStop={stopGeneration}
              isStreaming={isStreaming}
            />
          </View>
        )}

        <FilePicker
          files={availableFiles}
          currentFile={selectedFile}
          onSelect={setFile}
          visible={showFilePicker}
          onClose={() => setShowFilePicker(false)}
          isLoading={isLoadingFiles}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: theme.spacing.md,
  },
  errorBar: {
    backgroundColor: theme.colors.error + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  inputArea: {
    gap: theme.spacing.xs,
  },
  fileRequiredArea: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  noFileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  noFileText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});