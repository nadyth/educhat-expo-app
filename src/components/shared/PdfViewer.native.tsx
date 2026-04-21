import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface PdfViewerProps {
  visible: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}

export function PdfViewer({ visible, url, title, onClose }: PdfViewerProps) {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<Pdf>(null);

  // Reset state when the PDF URL changes
  useEffect(() => {
    if (url) {
      setCurrentPage(1);
      setTotalPages(0);
      setLoading(true);
      setError(null);
    }
  }, [url]);

  const handleLoadComplete = useCallback((numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setLoading(false);
    setError(null);
  }, []);

  const handlePageChanged = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleError = useCallback((err: Error) => {
    setLoading(false);
    setError(err.message || 'Failed to load PDF');
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && pdfRef.current) {
        (pdfRef.current as any).setPage(page);
      }
    },
    [totalPages],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'PDF Viewer'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
            <X size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* PDF area */}
        <View style={styles.pdfContainer}>
          {url ? (
            <Pdf
              ref={pdfRef}
              source={{ uri: url }}
              style={styles.pdf}
              enablePaging
              fitPolicy={0}
              spacing={8}
              onLoadComplete={handleLoadComplete}
              onPageChanged={handlePageChanged}
              onError={handleError}
              activityIndicator={<ActivityIndicator size="large" color={theme.colors.primary} />}
            />
          ) : null}

          {/* Loading overlay */}
          {loading && (
            <View style={styles.stateOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {/* Error overlay */}
          {error && (
            <View style={styles.stateOverlay}>
              <Text style={styles.errorText}>Failed to load PDF</Text>
            </View>
          )}

          {/* Page navigation overlay */}
          {totalPages > 0 && (
            <View style={[styles.pageIndicator, { bottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={styles.pageBtn}
              >
                <ChevronLeft
                  size={20}
                  color={currentPage <= 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
                />
              </TouchableOpacity>

              <Text style={styles.pageText}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={styles.pageBtn}
              >
                <ChevronRight
                  size={20}
                  color={currentPage >= totalPages ? 'rgba(255,255,255,0.3)' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdf: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
  pageIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  pageBtn: {
    padding: 6,
  },
  pageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
});