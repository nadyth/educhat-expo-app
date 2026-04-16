import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../../src/contexts/ChatContext';
import { useOllamaModels } from '../../src/hooks/useOllamaModels';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { ModelPicker, ModelPickerTrigger } from '../../src/components/chat/ModelPicker';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { theme } from '../../src/constants/theme';

export default function ChatScreen() {
  const {
    messages,
    isStreaming,
    currentModel,
    error,
    tokensPerSecond,
    sendMessage,
    setModel,
    clearChat,
    stopGeneration,
  } = useChat();
  const { models } = useOllamaModels();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, messages[messages.length - 1]?.text]);

  const renderMessage = ({ item }: { item: typeof messages[number] }) => (
    <ChatBubble
      text={item.text}
      isUser={item.isUser}
      isStreaming={isStreaming && !item.isUser && item === messages[messages.length - 1] && item.text !== ''}
      modelName={item.isUser ? undefined : item.model}
      tokensPerSecond={
        !item.isUser && item === messages[messages.length - 1] && !isStreaming
          ? tokensPerSecond
          : undefined
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 && !isStreaming ? (
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
                <TypingIndicator />
              ) : null
            }
          />
        )}

        {error && (
          <View style={styles.errorBar}>
            {/* Error displayed in input area */}
          </View>
        )}

        <View style={styles.inputArea}>
          <ModelPickerTrigger
            currentModel={currentModel}
            onPress={() => setShowModelPicker(true)}
          />
          <ChatInput
            onSend={sendMessage}
            onStop={stopGeneration}
            isStreaming={isStreaming}
          />
        </View>

        <ModelPicker
          models={models}
          currentModel={currentModel}
          onSelect={setModel}
          visible={showModelPicker}
          onClose={() => setShowModelPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
});