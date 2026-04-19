import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, Pressable, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronDown, X, Cpu, Search, Check } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { OllamaModel } from '../../types/ollama';
import { formatModelSize } from '../../utils/formatters';

interface ModelPickerProps {
  models: OllamaModel[];
  currentModel: string | null;
  onSelect: (model: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function ModelPicker({ models, currentModel, onSelect, visible, onClose }: ModelPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? models.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.details.family.toLowerCase().includes(search.toLowerCase()))
    : models;

  const modelSize = (item: OllamaModel) => item.size > 0 ? formatModelSize(item.size) : 'API';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Model</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Search size={16} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search models..."
              placeholderTextColor={theme.colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.name}
            nestedScrollEnabled={true}
            renderItem={({ item, index }) => {
              const selected = item.name === currentModel;
              return (
                <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                  <TouchableOpacity
                    style={[styles.modelItem, selected && styles.modelItemSelected]}
                    onPress={() => { onSelect(item.name); onClose(); }}
                    hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
                  >
                    <Cpu size={14} color={selected ? theme.colors.textOnPrimary : theme.colors.primary} />
                    <Text style={[styles.modelName, selected && styles.modelNameSelected]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.modelSize, selected && styles.modelSizeSelected]}>
                      {modelSize(item)}
                    </Text>
                    {selected && <Check size={16} color={theme.colors.textOnPrimary} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            }}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

interface ModelPickerTriggerProps {
  currentModel: string;
  onPress: () => void;
}

export function ModelPickerTrigger({ currentModel, onPress }: ModelPickerTriggerProps) {
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
      <Cpu size={14} color={theme.colors.primary} />
      <Text style={styles.triggerText} numberOfLines={1}>{currentModel}</Text>
      <ChevronDown size={14} color={theme.colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  sheetTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  list: {
    paddingBottom: theme.spacing.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    height: 40,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  modelItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  modelName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  modelNameSelected: {
    color: theme.colors.textOnPrimary,
  },
  modelSize: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  modelSizeSelected: {
    color: theme.colors.textOnPrimary,
    opacity: 0.8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    maxWidth: 180,
    minHeight: 44,
  },
  triggerText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});