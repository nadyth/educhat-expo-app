# iOS Touch Responsiveness — Root Causes & Fixes

## The Problem

On real iOS devices (iPhone), buttons and tab bar items require multiple taps or a very precise tap location to register. This does not reproduce in simulators or Expo Go — only on real devices in development/production builds.

Symptoms:
- Tab bar buttons need 2-3 taps to respond
- Action buttons (send, model picker, close) only work when tapped on an exact pixel
- Feels like the app is "ignoring" touches

---

## Root Cause 1: SVG Icons Swallow Touch Events (Tab Bar)

**What happens:** Icon libraries like `lucide-react-native` render SVG nodes that intercept touch events before the parent `TouchableOpacity` or tab button can process them. On iOS, the icon's SVG view captures the gesture, so the underlying button never receives the press.

**Without fix:** Tapping directly on the icon does nothing. Only tapping the small gap between icon and label registers.

**Fix:** Wrap every tab bar icon with `pointerEvents="none"` so touches pass through to the tab button:

```tsx
// BAD — icon steals touches
tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />

// GOOD — touches pass through icon to tab button
tabBarIcon: ({ color, size }) => (
  <View pointerEvents="none">
    <MessageCircle size={size} color={color} />
  </View>
)
```

This applies to any icon used inside a touchable: lucide, @expo/vector-icons, react-native-heroicons, etc.

---

## Root Cause 2: React Native's TouchableOpacity vs RNGH's TouchableOpacity

**What happens:** React Native's built-in `TouchableOpacity` uses the JS Responder System. On iOS, `ScrollView` and `FlatList` steal the responder from RN's touchables — a known bug (facebook/react-native#35333, #23727, #46142). The result is that buttons inside or near scrollable areas become intermittently unresponsive.

**Without fix:** Buttons work sometimes but require multiple presses, especially after scrolling.

**Fix:** Import `TouchableOpacity` from `react-native-gesture-handler` instead of `react-native`:

```tsx
// BAD — uses JS Responder System with iOS bugs
import { TouchableOpacity } from 'react-native';

// GOOD — uses native gesture system, bypasses responder bugs
import { TouchableOpacity } from 'react-native-gesture-handler';
```

Apply this to every file that uses `TouchableOpacity`. There is no downside — RNGH's version is a drop-in replacement with better iOS behavior.

---

## Root Cause 3: Missing GestureHandlerRootView

**What happens:** `react-native-gesture-handler` requires a `GestureHandlerRootView` at the top of the component tree for its gesture system to function on iOS. Without it, gesture handling falls back to inconsistent behavior.

**Without fix:** Touch events behave unpredictably — some gestures work, others don't, with no clear pattern.

**Fix:** Wrap the entire app in `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
```

Note: Expo's default template includes this. If you refactor your root layout, you must preserve it.

---

## Root Cause 4: PlatformPressable onPress Regression (React Navigation v7)

**What happens:** React Navigation v7 + RN 0.76+ has a regression where `Pressable`, `TouchableOpacity`, and `PlatformPressable` in headers and tab bars fail to fire `onPress`. The `onPressIn` fires immediately without waiting for finger lift, so the tap is never completed.

**Without fix:** Tab buttons using `PlatformPressable` (the default in Expo's `HapticTab` template) are unreliable.

**Fix:** Replace `PlatformPressable` with RNGH's `GestureDetector` + `Gesture.Tap()`:

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Pressable } from 'react-native';

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
```

---

## Root Cause 5: Small Touch Targets

**What happens:** Apple's HIG recommends a minimum 44x44pt touch target. Buttons smaller than this (e.g., small icon buttons, chips, close buttons) are hard to hit with a finger on a real device.

**Fix:** Use `hitSlop` to expand the tappable area beyond visual bounds, and ensure `minHeight: 44` on buttons:

```tsx
<TouchableOpacity
  onPress={onClose}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
>
  <X size={20} />
</TouchableOpacity>

// Small trigger buttons
const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,  // meets Apple's minimum touch target
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
```

---

## Quick Checklist for New Projects

- [ ] Wrap app root in `GestureHandlerRootView`
- [ ] Import `TouchableOpacity` from `react-native-gesture-handler`, NOT `react-native`
- [ ] Wrap all tab bar icons in `<View pointerEvents="none">`
- [ ] Use `GestureDetector` + `Gesture.Tap()` for tab buttons (not `PlatformPressable`)
- [ ] Add `hitSlop` to all buttons under 44pt
- [ ] Set `minHeight: 44` on action buttons
- [ ] Do NOT set a fixed `height` on `tabBarStyle` — let it use natural height
- [ ] Add `pointerEvents="none"` to overlay views that should not block touches

---

## References

- [react-navigation#12935 — Buttons not working reliably on iOS](https://github.com/react-navigation/react-navigation/issues/12935)
- [react-native#35333 — ScrollView inside FlatList blocks touchables](https://github.com/facebook/react-native/issues/35333)
- [react-native#46142 — Buttons not clickable from RN but clickable from RNGH](https://github.com/facebook/react-native/issues/46142)
- [expo#34683 — Header Pressable Components Not Responding](https://github.com/expo/expo/issues/34683)
- [react-native-screens#3466 — App Freeze Regression](https://github.com/software-mansion/react-native-screens/issues/3466)
- [expo#43989 — Touch unresponsive in custom build, works in Expo Go](https://github.com/expo/expo/issues/43989)