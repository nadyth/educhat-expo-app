import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface PdfViewerProps {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}

export function PdfViewer({ visible, url, title, onClose }: PdfViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'PDF Viewer'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        {url ? (
          <iframe
            src={url}
            style={styles.iframe}
            title={title || 'PDF Viewer'}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  title: {
    flex: 1,
    ...theme.typography.h3,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  closeButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  iframe: {
    flex: 1,
    borderWidth: 0,
    width: '100%',
    height: '100%',
  } as any,
});