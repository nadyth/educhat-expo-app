import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { FileText, Upload, Trash2, Clock, CheckCircle, AlertCircle, Loader, Pencil, X } from 'lucide-react-native';
import { useFiles } from '../../src/hooks/useFiles';
import { theme } from '../../src/constants/theme';
import { LoadingSpinner } from '../../src/components/shared/LoadingSpinner';
import { PdfViewer } from '../../src/components/shared/PdfViewer';
import { getPdfViewingUrl } from '../../src/services/pdfCache';
import type { FileOut } from '../../src/services/files';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ file }: { file: FileOut }) {
  const status = file.processing_status;
  let icon: React.ReactNode;
  let color: string;
  let label: string;

  switch (status) {
    case 'completed':
      icon = <CheckCircle size={12} color={theme.colors.success} />;
      color = theme.colors.success;
      label = `Done (${file.pages_processed}/${file.pages_total})`;
      break;
    case 'processing':
      icon = <Loader size={12} color={theme.colors.accent} />;
      color = theme.colors.accent;
      label = `${file.pages_processed}/${file.pages_total} pages`;
      break;
    case 'failed':
      icon = <AlertCircle size={12} color={theme.colors.error} />;
      color = theme.colors.error;
      label = 'Failed';
      break;
    default:
      icon = <Clock size={12} color={theme.colors.textSecondary} />;
      color = theme.colors.textSecondary;
      label = 'Pending';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
      {icon}
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

export default function DocsScreen() {
  const { files, isLoading, isUploading, error, loadFiles, pickAndUpload, removeFile, renameFileItem, refreshStatus } = useFiles();
  const insets = useSafeAreaInsets();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileOut | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Poll status for files that are still processing
  useEffect(() => {
    const pending = files.filter(f => f.processing_status === 'pending' || f.processing_status === 'processing');
    if (pending.length === 0) return;

    const interval = setInterval(() => {
      pending.forEach(f => refreshStatus(f.id));
    }, 5000);

    return () => clearInterval(interval);
  }, [files, refreshStatus]);

  const handleDelete = (file: FileOut) => {
    Alert.alert(
      'Delete Document',
      `Remove "${file.original_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeFile(file.id) },
      ]
    );
  };

  const openRename = (file: FileOut) => {
    setRenameTarget(file);
    setRenameValue(file.original_name);
    setRenameModalVisible(true);
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setIsRenaming(true);
    await renameFileItem(renameTarget.id, renameValue.trim());
    setIsRenaming(false);
    setRenameModalVisible(false);
    setRenameTarget(null);
    setRenameValue('');
  };

  const handleOpenPdf = async (file: FileOut) => {
    if (file.processing_status !== 'completed') return;
    try {
      const url = await getPdfViewingUrl(file.id);
      setPdfUrl(url);
      setPdfTitle(file.original_name);
      setPdfVisible(true);
    } catch {
      Alert.alert('Error', 'Could not open this document.');
    }
  };

  const renderDeleteAction = (file: FileOut) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDelete(file)}
      activeOpacity={0.7}
    >
      <Trash2 size={20} color="#fff" />
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderFile = ({ item, index }: { item: FileOut; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Swipeable
        renderRightActions={() => renderDeleteAction(item)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity style={styles.card} onPress={() => handleOpenPdf(item)} activeOpacity={0.7}>
          <View style={styles.cardLeft}>
            <View style={styles.iconCircle}>
              <FileText size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{item.original_name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatFileSize(item.size)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{formatTime(item.created_at)}</Text>
              </View>
              <StatusBadge file={item} />
            </View>
          </View>
          <TouchableOpacity onPress={() => openRename(item)} style={styles.editButton}>
            <Pencil size={18} color={theme.colors.textOnPrimary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={pickAndUpload}
        disabled={isUploading}
        activeOpacity={0.7}
      >
        {isUploading ? (
          <LoadingSpinner size={18} color={theme.colors.textOnPrimary} />
        ) : (
          <Upload size={18} color={theme.colors.textOnPrimary} />
        )}
        <Text style={styles.uploadText}>
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading && files.length === 0 ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFile}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadFiles}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyText}>Upload a PDF to get started</Text>
            </View>
          }
        />
      )}

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} animationType="fade" transparent onRequestClose={() => setRenameModalVisible(false)} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRenameModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Document</Text>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.renameInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Enter new name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity
              style={[styles.renameButton, (!renameValue.trim() || isRenaming) && styles.renameButtonDisabled]}
              onPress={handleRename}
              disabled={!renameValue.trim() || isRenaming}
              activeOpacity={0.7}
            >
              {isRenaming ? (
                <LoadingSpinner size={16} color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={styles.renameButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PDF Viewer */}
      <PdfViewer
        visible={pdfVisible}
        url={pdfUrl}
        title={pdfTitle}
        onClose={() => setPdfVisible(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadText: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    gap: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.colors.error,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  metaDot: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 3,
    marginTop: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: theme.spacing.xs,
    marginRight: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: 2,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  modalCloseBtn: {
    padding: theme.spacing.sm,
  },
  renameInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  renameButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  renameButtonDisabled: {
    opacity: 0.5,
  },
  renameButtonText: {
    ...theme.typography.body,
    color: theme.colors.textOnPrimary,
    fontWeight: '600',
  },
});