import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { GraduationCap } from 'lucide-react-native';
import { theme } from '../src/constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <GraduationCap size={64} color={theme.colors.primary} />
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>This page doesn't exist in EduChat AI</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to Chat</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  link: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.md,
  },
  linkText: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
});