import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Sparkles } from 'lucide-react-native';
import { theme } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StartupScreenProps {
  onReady: () => void;
  isAuthLoaded: boolean;
}

export default function StartupScreen({ onReady, isAuthLoaded }: StartupScreenProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  const hasDismissed = useRef(false);
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Floating animation for the icon
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Pulse animation for the icon container
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Minimum display time before allowing dismiss
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Dismiss when both the minimum time has passed AND auth is loaded
  useEffect(() => {
    if (canDismiss && isAuthLoaded && !hasDismissed.current) {
      hasDismissed.current = true;
      // Small delay for a smooth transition
      const dismissTimer = setTimeout(onReady, 300);
      return () => clearTimeout(dismissTimer);
    }
  }, [canDismiss, isAuthLoaded, onReady]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.primary, theme.colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative sparkles */}
      <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.sparkle1}>
        <Sparkles size={20} color={theme.colors.accentLight + '60'} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.sparkle2}>
        <Sparkles size={14} color={theme.colors.accentLight + '40'} />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeIn.duration(600)} style={floatingStyle}>
          <Animated.View style={[styles.logoCircle, pulseStyle]}>
            <GraduationCap size={64} color={theme.colors.primary} />
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(800)}
          style={styles.title}
        >
          EduChat AI
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInDown.delay(500).duration(800)}
          style={styles.subtitle}
        >
          Your AI Study Companion
        </Animated.Text>

        {/* Loading indicator */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.loadingBar}>
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
          <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle1: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    right: SCREEN_WIDTH * 0.15,
  },
  sparkle2: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textOnPrimary,
    marginBottom: theme.spacing.sm,
    fontSize: 34,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary + 'CC',
    marginBottom: theme.spacing.xxl,
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.xl,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textOnPrimary + '80',
    animationName: 'pulse',
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 0.3,
  },
});