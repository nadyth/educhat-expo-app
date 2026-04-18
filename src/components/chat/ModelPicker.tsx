import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronDown, X, Cpu } from 'lucide-react-native';
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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Model</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={models}
            keyExtractor={(item) => item.name}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                <TouchableOpacity
                  style={[
                    styles.modelItem,
                    item.name === currentModel && styles.modelItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.name);
                    onClose();
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
                >
                  <View style={styles.modelInfo}>
                    <View style={styles.modelNameRow}>
                      <Cpu size={16} color={theme.colors.primary} />
                      <Text style={styles.modelName}>{item.name}</Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Text style={styles.badge}>{item.details.family}</Text>
                      <Text style={styles.badge}>{item.details.parameter_size}</Text>
                      <Text style={styles.badge}>{item.details.quantization_level}</Text>
                      <Text style={styles.sizeBadge}>{formatModelSize(item.size)}</Text>
                    </View>
                  </View>
                  {item.name === currentModel && <View style={styles.checkmark} />}
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      </Pressable>
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
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  modelItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  modelInfo: {
    flex: 1,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  modelName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  sizeBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent,
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
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