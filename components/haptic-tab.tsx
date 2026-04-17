import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { children, onPress, onPressIn, accessibilityLabel, testID, style } = props;

  const tapGesture = Gesture.Tap()
    .onStart(() => {
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      onPress?.({} as any);
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={tapGesture}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={style}
        onPressIn={onPressIn as any}
      >
        {children}
      </Pressable>
    </GestureDetector>
  );
}