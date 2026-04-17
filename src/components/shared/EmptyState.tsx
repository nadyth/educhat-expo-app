import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { theme } from '../../constants/theme';

const SUGGESTIONS = [
  'Explain quantum physics',
  'Help me with calculus',
  'Summarize a history topic',
  'Write a study plan',
];

interface EmptyStateProps {
  onSuggestionPress?: (text: string) => void;
}

export function EmptyState({ onSuggestionPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.iconContainer}>
        <Sparkles size={48} color={theme.colors.accent} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={styles.title}>
        Start Learning!
      </Animated.Text>

      <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.subtitle}>
        Ask me anything — I'm your AI study buddy
      </Animated.Text>

      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion, index) => (
          <Animated.View key={suggestion} entering={FadeInDown.delay(300 + index * 100).duration(500)}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onSuggestionPress?.(suggestion)}
              activeOpacity={0.7}
            >
              <MessageCircle size={14} color={theme.colors.primary} />
              <Text style={styles.chipText}>{suggestion}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.accentLight + '30',
    borderRadius: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight + '30',
    gap: theme.spacing.xs,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});