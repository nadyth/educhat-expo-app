import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GraduationCap, User, BookOpen } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import type { SourcePage } from '../../types/chat';
import { RichText } from './RichText';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
  fileName?: string;
  stepLabel?: string;
  sources?: SourcePage[];
}

export function ChatBubble({ text, isUser, isStreaming, fileName, stepLabel, sources }: ChatBubbleProps) {
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
        {!isUser && fileName && (
          <View style={styles.fileLabelRow}>
            <BookOpen size={12} color={theme.colors.primary} />
            <Text style={styles.fileLabel}>{fileName}</Text>
          </View>
        )}
        {!isUser && stepLabel && (
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <Text style={styles.stepText}>{stepLabel}</Text>
          </View>
        )}
        {isUser ? (
          <Text style={styles.userText}>
            {text}
          </Text>
        ) : (
          <RichText
            text={isStreaming ? text + '|' : text}
            style={styles.aiText}
          />
        )}
        {!isUser && sources && sources.length > 0 && !isStreaming && (
          <View style={styles.sourcesRow}>
            <BookOpen size={12} color={theme.colors.textSecondary} />
            <Text style={styles.sourcesText}>
              Sources: {sources.map(s => `p.${s.page_label}`).join(', ')}
            </Text>
          </View>
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
  userText: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary,
  },
  aiText: {
    ...theme.typography.body,
    color: theme.colors.aiBubbleText,
  },
  fileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  fileLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  stepText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  sourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  sourcesText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});