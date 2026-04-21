import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label }: TypingIndicatorProps) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
    const t2 = setTimeout(() => {
      dot2.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
    }, 150);
    const t3 = setTimeout(() => {
      dot3.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
    }, 300);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const animatedDot1 = useAnimatedStyle(() => ({
    opacity: 0.4 + dot1.value * 0.6,
    transform: [{ translateY: -dot1.value * 6 }],
  }));

  const animatedDot2 = useAnimatedStyle(() => ({
    opacity: 0.4 + dot2.value * 0.6,
    transform: [{ translateY: -dot2.value * 6 }],
  }));

  const animatedDot3 = useAnimatedStyle(() => ({
    opacity: 0.4 + dot3.value * 0.6,
    transform: [{ translateY: -dot3.value * 6 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, animatedDot1]} />
      <Animated.View style={[styles.dot, animatedDot2]} />
      <Animated.View style={[styles.dot, animatedDot3]} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 4,
  },
});