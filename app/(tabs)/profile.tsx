import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LogOut,
  MessageCircle,
  FileText,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Image } from 'react-native';
import { useChat } from '../../src/contexts/ChatContext';
import { theme } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { selectedFile, messages, clearChat } = useChat();

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {/* Profile Header */}
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.primary, theme.colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.headerContent}>
            <View style={styles.avatar}>
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImage} />
              ) : (
                <GraduationCap size={40} color={theme.colors.primary} />
              )}
            </View>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Loading...'}</Text>
          </Animated.View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInRight.delay(100).duration(500)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <MessageCircle size={20} color={theme.colors.primary} />
            </View>
            <Animated.Text entering={FadeInRight.delay(200).duration(500)} style={styles.statNumber}>
              {messages.length}
            </Animated.Text>
            <Text style={styles.statLabel}>Messages</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(200).duration(500)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.accent + '20' }]}>
              <FileText size={20} color={theme.colors.accent} />
            </View>
            <Animated.Text entering={FadeInRight.delay(300).duration(500)} style={styles.statNumber}>
              {selectedFile ? '1' : '0'}
            </Animated.Text>
            <Text style={styles.statLabel}>Doc Active</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(300).duration(500)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '15' }]}>
              <BookOpen size={20} color={theme.colors.success} />
            </View>
            <Animated.Text entering={FadeInRight.delay(400).duration(500)} style={styles.statNumber} numberOfLines={1}>
              {selectedFile ? selectedFile.original_name.replace(/\.pdf$/i, '') : '—'}
            </Animated.Text>
            <Text style={styles.statLabel}>Document</Text>
          </Animated.View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingRow} onPress={refreshUser}>
            <View style={styles.settingLeft}>
              <GraduationCap size={18} color={theme.colors.primary} />
              <Text style={styles.settingText}>Refresh Profile</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={clearChat}>
            <View style={styles.settingLeft}>
              <Trash2 size={18} color={theme.colors.error} />
              <Text style={styles.settingText}>Clear Chat History</Text>
            </View>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <LogOut size={18} color={theme.colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.textOnPrimary,
    marginBottom: 2,
  },
  userEmail: {
    ...theme.typography.caption,
    color: theme.colors.textOnPrimary + 'CC',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginTop: -theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: theme.spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  settingText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  signOutSection: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xxl,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error + '10',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    gap: theme.spacing.sm,
  },
  signOutText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
});