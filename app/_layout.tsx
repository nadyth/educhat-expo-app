import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ChatProvider } from '../src/contexts/ChatContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { theme } from '../src/constants/theme';
import { useState, useCallback, useRef, useEffect } from 'react';
import StartupScreen from '../src/components/StartupScreen';

// Prevent the native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [showStartup, setShowStartup] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const hasHiddenNativeSplash = useRef(false);

  // Hide native splash once auth is done loading
  useEffect(() => {
    if (!isLoading && !hasHiddenNativeSplash.current) {
      hasHiddenNativeSplash.current = true;
      SplashScreen.hideAsync().then(() => {
        setNativeSplashHidden(true);
      });
    }
  }, [isLoading]);

  const handleStartupReady = useCallback(() => {
    setShowStartup(false);
  }, []);

  // Show startup screen (overlays everything) until it signals ready
  if (nativeSplashHidden && showStartup) {
    return (
      <>
        <StatusBar style="light" />
        <StartupScreen onReady={handleStartupReady} isAuthLoaded={!isLoading} />
      </>
    );
  }

  // While native splash is still visible or auth is loading, show nothing
  // (the native splash covers this)
  if (!nativeSplashHidden) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardProvider>
      <ChatProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ChatProvider>
    </KeyboardProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gradientStart,
  },
});