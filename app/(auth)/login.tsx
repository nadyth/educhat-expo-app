import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, Sparkles } from 'lucide-react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { GoogleSignInButton } from '../../src/components/auth/GoogleSignInButton';
import { theme } from '../../src/constants/theme';

export default function LoginScreen() {
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const floatY = useSharedValue(0);

  // If already authenticated, redirect to main app
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-15, { duration: 2500 }), -1, true);
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.primary, theme.colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating decorative elements */}
      <View style={styles.decorations}>
        <Animated.View style={[styles.floatingIcon, styles.float1, floatingStyle]}>
          <Sparkles size={24} color={theme.colors.accentLight + '80' } />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.float2, floatingStyle]}>
          <GraduationCap size={20} color={theme.colors.accentLight + '60' } />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.float3, floatingStyle]}>
          <Sparkles size={16} color={theme.colors.accentLight + '40' } />
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <GraduationCap size={56} color={theme.colors.primary} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200).duration(800)} style={styles.title}>
          EduChat AI
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={styles.subtitle}>
          Your AI Study Companion
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(500).duration(800)} style={styles.description}>
          Learn anything with the power of AI. Ask questions, get explanations, and ace your studies.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.buttonContainer}>
          <GoogleSignInButton onPress={signIn} isLoading={isLoading} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(700).duration(800)} style={styles.terms}>
          By signing in, you agree to our Terms of Service
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
  },
  float1: {
    top: 80,
    right: 40,
  },
  float2: {
    top: 200,
    left: 30,
  },
  float3: {
    bottom: 200,
    right: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textOnPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.h3,
    color: theme.colors.accentLight,
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary + 'CC',
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    maxWidth: 300,
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  terms: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary + '80',
  },
});