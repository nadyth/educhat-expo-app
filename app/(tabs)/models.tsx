import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Cpu, Search, GraduationCap, Zap, HardDrive, ArrowUpDown } from 'lucide-react-native';
import { useOllamaModels } from '../../src/hooks/useOllamaModels';
import { useChat } from '../../src/contexts/ChatContext';
import { theme } from '../../src/constants/theme';
import { formatModelSize } from '../../src/utils/formatters';
import { OllamaModel } from '../../src/types/ollama';
import { LoadingSpinner } from '../../src/components/shared/LoadingSpinner';

export default function ModelsScreen() {
  const { models, isLoading, error, refresh } = useOllamaModels();
  const { currentModel, setModel } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = models.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.details.family.toLowerCase().includes(q) ||
      m.details.parameter_size.toLowerCase().includes(q)
    );
  });

  const uniqueFamilies = [...new Set(models.map((m) => m.details.family))];

  const renderModelCard = ({ item, index }: { item: OllamaModel; index: number }) => {
    const isActive = item.name === currentModel;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          style={[styles.card, isActive && styles.cardActive]}
          onPress={() => setModel(item.name)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Cpu size={20} color={isActive ? theme.colors.textOnPrimary : theme.colors.primary} />
            </View>
            <View style={styles.cardTitleSection}>
              <Text style={[styles.modelName, isActive && styles.modelNameActive]}>
                {item.name}
              </Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.familyBadge]}>
              <GraduationCap size={10} color={theme.colors.primary} />
              <Text style={styles.familyBadgeText}>{item.details.family}</Text>
            </View>
            <View style={[styles.badge, styles.paramBadge]}>
              <Zap size={10} color={theme.colors.accent} />
              <Text style={styles.paramBadgeText}>{item.details.parameter_size}</Text>
            </View>
            <View style={[styles.badge, styles.quantBadge]}>
              <ArrowUpDown size={10} color={theme.colors.textSecondary} />
              <Text style={styles.quantBadgeText}>{item.details.quantization_level}</Text>
            </View>
            <View style={[styles.badge, styles.sizeBadge]}>
              <HardDrive size={10} color={theme.colors.success} />
              <Text style={styles.sizeBadgeText}>{formatModelSize(item.size)}</Text>
            </View>
          </View>

          <Text style={styles.formatText}>
            Format: {item.details.format}
            {item.details.families && item.details.families.length > 1
              ? ` • Families: ${item.details.families.join(', ')}`
              : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search models..."
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Family filter chips */}
      {uniqueFamilies.length > 0 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !searchQuery && styles.filterChipActive]}
            onPress={() => setSearchQuery('')}
          >
            <Text style={[styles.filterChipText, !searchQuery && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {uniqueFamilies.slice(0, 6).map((family) => (
            <TouchableOpacity
              key={family}
              style={[
                styles.filterChip,
                searchQuery.toLowerCase() === family && styles.filterChipActive,
              ]}
              onPress={() => setSearchQuery(family)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  searchQuery.toLowerCase() === family && styles.filterChipTextActive,
                ]}
              >
                {family}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && models.length === 0 ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Loading models...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Cpu size={48} color={theme.colors.textSecondary} />
          <Text style={styles.errorTitle}>Could not load models</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredModels}
          renderItem={renderModelCard}
          keyExtractor={(item) => item.name}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No models found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary + '08',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  cardTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  modelName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
  },
  modelNameActive: {
    color: theme.colors.primary,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    ...theme.typography.caption,
    color: '#fff',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  familyBadge: {
    backgroundColor: theme.colors.primary + '15',
  },
  familyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  paramBadge: {
    backgroundColor: theme.colors.accent + '20',
  },
  paramBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  quantBadge: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  quantBadgeText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  sizeBadge: {
    backgroundColor: theme.colors.success + '15',
  },
  sizeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.success,
  },
  formatText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});