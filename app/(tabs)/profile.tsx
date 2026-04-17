import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LogOut,
  MessageCircle,
  Cpu,
  Zap,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Image } from 'react-native';
import { useChat } from '../../src/contexts/ChatContext';
import { EDUCATION_PROMPTS, PromptType } from '../../src/utils/educationPrompts';
import { theme } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { currentModel, promptType, setSystemPrompt, totalMessagesSent, modelsUsed, clearChat } = useChat();

  const promptOptions: { key: PromptType; label: string; icon: string }[] = [
    { key: 'default', label: 'General Tutor', icon: '🎓' },
    { key: 'math', label: 'Math Tutor', icon: '📐' },
    { key: 'science', label: 'Science Tutor', icon: '🔬' },
    { key: 'writing', label: 'Writing Coach', icon: '✍️' },
    { key: 'coding', label: 'Coding Instructor', icon: '💻' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              {totalMessagesSent}
            </Animated.Text>
            <Text style={styles.statLabel}>Messages</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(200).duration(500)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.accent + '20' }]}>
              <Cpu size={20} color={theme.colors.accent} />
            </View>
            <Animated.Text entering={FadeInRight.delay(300).duration(500)} style={styles.statNumber}>
              {modelsUsed.size}
            </Animated.Text>
            <Text style={styles.statLabel}>Models Used</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.delay(300).duration(500)} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.success + '15' }]}>
              <Zap size={20} color={theme.colors.success} />
            </View>
            <Animated.Text entering={FadeInRight.delay(400).duration(500)} style={styles.statNumber}>
              {currentModel.split(':')[0]}
            </Animated.Text>
            <Text style={styles.statLabel}>Model</Text>
          </Animated.View>
        </View>

        {/* System Prompt Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <BookOpen size={16} color={theme.colors.primary} /> Study Mode
          </Text>
          <View style={styles.promptGrid}>
            {promptOptions.map((opt, index) => (
              <Animated.View key={opt.key} entering={FadeInRight.delay(index * 80).duration(400)}>
                <TouchableOpacity
                  style={[
                    styles.promptCard,
                    promptType === opt.key && styles.promptCardActive,
                  ]}
                  onPress={() => setSystemPrompt(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptEmoji}>{opt.icon}</Text>
                  <Text
                    style={[
                      styles.promptLabel,
                      promptType === opt.key && styles.promptLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
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
    </SafeAreaView>
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
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    gap: theme.spacing.xs,
  },
  promptCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  promptEmoji: {
    fontSize: 16,
  },
  promptLabel: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  promptLabelActive: {
    color: theme.colors.primary,
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