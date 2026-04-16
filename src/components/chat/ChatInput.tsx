import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Send, Square } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ask me anything..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={4000}
          editable={!disabled && !isStreaming}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isStreaming || !text.trim()) && styles.sendButtonDisabled,
          ]}
          onPress={isStreaming ? onStop : handleSend}
          disabled={disabled || (!isStreaming && !text.trim())}
          activeOpacity={0.7}
        >
          {isStreaming ? (
            <Square size={18} color={theme.colors.textOnPrimary} fill={theme.colors.textOnPrimary} />
          ) : (
            <Send size={18} color={theme.colors.textOnPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.primaryLight + '60',
  },
});