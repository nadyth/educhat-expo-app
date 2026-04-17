import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform, Keyboard, Text } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useChat } from '../../src/contexts/ChatContext';
import { useOllamaModels } from '../../src/hooks/useOllamaModels';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { TypingIndicator } from '../../src/components/chat/TypingIndicator';
import { ModelPicker, ModelPickerTrigger } from '../../src/components/chat/ModelPicker';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { theme } from '../../src/constants/theme';

export default function ChatScreen() {
  const headerHeight = useHeaderHeight();
  const {
    messages,
    isStreaming,
    currentModel,
    hasSelectedModel,
    isLoadingModel,
    error,
    tokensPerSecond,
    sendMessage,
    setModel,
    clearChat,
    stopGeneration,
  } = useChat();
  const { models } = useOllamaModels();
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Auto-open model picker if no model selected yet (after storage load completes)
  useEffect(() => {
    if (!isLoadingModel && !hasSelectedModel) {
      setShowModelPicker(true);
    }
  }, [isLoadingModel, hasSelectedModel]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
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
      modelName={item.isUser ? undefined : item.model}
      tokensPerSecond={
        !item.isUser && item === messages[messages.length - 1] && !isStreaming
          ? tokensPerSecond
          : undefined
      }
      thinking={item.thinking}
    />
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {isLoadingModel ? null : !hasSelectedModel ? (
          <View style={styles.noModelContainer}>
            <Text style={styles.noModelText}>Select a model to start chatting</Text>
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
              isStreaming && messages[messages.length - 1]?.text === '' && !messages[messages.length - 1]?.thinking ? (
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

        {isLoadingModel ? null : !hasSelectedModel ? (
          <View style={styles.modelRequiredArea}>
            <ModelPickerTrigger
              currentModel="Select a model"
              onPress={() => setShowModelPicker(true)}
            />
          </View>
        ) : (
          <View style={styles.inputArea}>
            <ModelPickerTrigger
              currentModel={currentModel!}
              onPress={() => setShowModelPicker(true)}
            />
            <ChatInput
              onSend={sendMessage}
              onStop={stopGeneration}
              isStreaming={isStreaming}
            />
          </View>
        )}

        <ModelPicker
          models={models}
          currentModel={currentModel}
          onSelect={setModel}
          visible={showModelPicker}
          onClose={() => setShowModelPicker(false)}
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
  modelRequiredArea: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  noModelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  noModelText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});