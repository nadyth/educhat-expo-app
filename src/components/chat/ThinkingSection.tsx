import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Brain, ChevronDown } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface ThinkingSectionProps {
  thinking: string;
  isActivelyThinking: boolean;
}

export function ThinkingSection({ thinking, isActivelyThinking }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const heightValue = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  // Auto-collapse when thinking phase ends
  useEffect(() => {
    if (!isActivelyThinking && isExpanded) {
      setIsExpanded(false);
    }
  }, [isActivelyThinking]);

  // Animate height and chevron when expanded state or measured height changes
  useEffect(() => {
    const targetHeight = isExpanded ? measuredHeight : 0;
    heightValue.value = withTiming(targetHeight, { duration: 250 });
    chevronRotation.value = withTiming(isExpanded ? 0 : -90, { duration: 250 });
  }, [isExpanded, measuredHeight]);

  const animatedHeight = useAnimatedStyle(() => ({
    height: measuredHeight > 0 ? heightValue.value : undefined,
    overflow: 'hidden',
  }));

  const animatedChevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handleLayout = useCallback((e: any) => {
    setMeasuredHeight(e.nativeEvent.layout.height);
  }, []);

  const handleToggle = useCallback(() => {
    if (!isActivelyThinking) {
      setIsExpanded(prev => !prev);
    }
  }, [isActivelyThinking]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={isActivelyThinking ? 1 : 0.7}
        style={styles.header}
      >
        <Brain size={14} color={theme.colors.primaryLight} />
        <Text style={styles.headerLabel}>
          {isActivelyThinking ? 'Thinking...' : 'Thinking'}
        </Text>
        <Animated.View style={animatedChevron}>
          <ChevronDown size={14} color={theme.colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {measuredHeight > 0 && (
        <Animated.View style={animatedHeight}>
          <View style={styles.content}>
            <Text style={styles.thinkingText}>{thinking}</Text>
          </View>
        </Animated.View>
      )}
      {/* Hidden measurer: always rendered to capture content height */}
      <View style={styles.measurer}>
        <View onLayout={handleLayout} style={styles.content}>
          <Text style={styles.thinkingText}>{thinking}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
  },
  headerLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  thinkingText: {
    ...theme.typography.body,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  measurer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
});