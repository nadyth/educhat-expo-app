import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GraduationCap, User } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
  modelName?: string;
  tokensPerSecond?: number | null;
}

export function ChatBubble({ text, isUser, isStreaming, modelName, tokensPerSecond }: ChatBubbleProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <GraduationCap size={18} color={theme.colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {!isUser && modelName && (
          <Text style={styles.modelLabel}>{modelName}</Text>
        )}
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {text}
          {isStreaming && <Text style={styles.cursor}>|</Text>}
        </Text>
        {!isUser && tokensPerSecond && !isStreaming && (
          <Text style={styles.speed}>{tokensPerSecond.toFixed(1)} t/s</Text>
        )}
      </View>
      {isUser && (
        <View style={[styles.avatar, styles.userAvatar]}>
          <User size={18} color={theme.colors.textOnPrimary} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  userAvatar: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.userBubble,
    borderBottomRightRadius: theme.spacing.xs,
  },
  aiBubble: {
    backgroundColor: theme.colors.aiBubble,
    borderBottomLeftRadius: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.accentLight + '40',
  },
  text: {
    ...theme.typography.body,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.textOnPrimary,
  },
  aiText: {
    color: theme.colors.aiBubbleText,
  },
  cursor: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  modelLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  speed: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});