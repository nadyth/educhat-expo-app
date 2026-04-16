import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 40, color = theme.colors.primary }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, animatedStyle, { width: size, height: size }]}>
        <View style={[styles.half, styles.topHalf, { borderColor: color }]} />
        <View style={[styles.half, styles.bottomHalf, { borderColor: 'transparent' }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  half: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    borderWidth: 3,
  },
  topHalf: {
    top: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  bottomHalf: {
    bottom: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
});