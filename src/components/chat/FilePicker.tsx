import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronDown, X, FileText, Check } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import type { FileOut } from '../../services/files';

interface FilePickerProps {
  files: FileOut[];
  currentFile: FileOut | null;
  onSelect: (file: FileOut) => void;
  visible: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function FilePicker({ files, currentFile, onSelect, visible, onClose, isLoading }: FilePickerProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Document</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading documents...</Text>
            </View>
          ) : files.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={40} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No processed documents found</Text>
              <Text style={styles.emptySubtext}>Upload a PDF from the Docs tab first</Text>
            </View>
          ) : (
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              nestedScrollEnabled={true}
              renderItem={({ item, index }) => {
                const selected = currentFile?.id === item.id;
                return (
                  <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                    <TouchableOpacity
                      style={[styles.fileItem, selected && styles.fileItemSelected]}
                      onPress={() => { onSelect(item); onClose(); }}
                      hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
                    >
                      <FileText size={16} color={selected ? theme.colors.textOnPrimary : theme.colors.primary} />
                      <View style={styles.fileInfo}>
                        <Text style={[styles.fileName, selected && styles.fileNameSelected]} numberOfLines={1}>
                          {item.original_name}
                        </Text>
                        <Text style={[styles.fileMeta, selected && styles.fileMetaSelected]}>
                          {item.pages_total} page{item.pages_total !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {selected && <Check size={16} color={theme.colors.textOnPrimary} />}
                    </TouchableOpacity>
                  </Animated.View>
                );
              }}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

interface FilePickerTriggerProps {
  currentFile: FileOut | null;
  onPress: () => void;
}

export function FilePickerTrigger({ currentFile, onPress }: FilePickerTriggerProps) {
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
      <FileText size={14} color={theme.colors.primary} />
      <Text style={styles.triggerText} numberOfLines={1}>
        {currentFile?.original_name || 'Select document'}
      </Text>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceAlt,
  },
  fileItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fileNameSelected: {
    color: theme.colors.textOnPrimary,
  },
  fileMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  fileMetaSelected: {
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
    maxWidth: 200,
    minHeight: 44,
  },
  triggerText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
});