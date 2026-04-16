import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, isLoading, disabled }: GoogleSignInButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, theme.animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.button, (isLoading || disabled) && styles.buttonDisabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading || disabled}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.text}>Sign in with Google</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: theme.spacing.sm,
    minWidth: 240,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    width: 24,
    textAlign: 'center',
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
});