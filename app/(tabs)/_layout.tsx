import { Tabs, Redirect } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Cpu, GraduationCap } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { HapticTab } from '../../components/haptic-tab';
import { theme } from '../../src/constants/theme';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.cardBorder,
          borderTopWidth: 1,
          paddingBottom: insets.bottom || 4,
          ...(Platform.OS === 'android' && {
            height: 56 + (insets.bottom || 0),
          }),
        },
        tabBarLabelStyle: {
          ...theme.typography.caption,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
          marginBottom: 2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          ...theme.typography.h3,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <View pointerEvents="none"><MessageCircle size={size} color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Models',
          tabBarIcon: ({ color, size }) => <View pointerEvents="none"><Cpu size={size} color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <View pointerEvents="none"><GraduationCap size={size} color={color} /></View>,
        }}
      />
    </Tabs>
  );
}