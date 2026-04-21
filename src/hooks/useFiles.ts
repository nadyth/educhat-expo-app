import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { listFiles, uploadFile, deleteFile, renameFile, getFileStatus, triggerProcessing, type FileOut } from '../services/files';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function useFiles() {
  const [files, setFiles] = useState<FileOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listFiles();
      setFiles(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickAndUpload = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    if (asset.size && asset.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is 50 MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const newFile = await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/pdf');
      setFiles(prev => [newFile, ...prev]);

      // Trigger processing after upload
      try {
        await triggerProcessing(newFile.id);
      } catch {
        // Processing trigger is non-blocking — status can be polled later
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeFile = useCallback(async (fileId: string) => {
    try {
      await deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  }, []);

  const renameFileItem = useCallback(async (fileId: string, newName: string) => {
    try {
      const updated = await renameFile(fileId, newName);
      setFiles(prev => prev.map(f => f.id === fileId ? updated : f));
    } catch (err: any) {
      setError(err.message || 'Failed to rename document');
    }
  }, []);

  const refreshStatus = useCallback(async (fileId: string) => {
    try {
      const status = await getFileStatus(fileId);
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, processing_status: status.processing_status, pages_processed: status.pages_processed, pages_total: status.pages_total }
            : f
        )
      );
    } catch {
      // Silent — status poll is best-effort
    }
  }, []);

  return {
    files,
    isLoading,
    isUploading,
    error,
    loadFiles,
    pickAndUpload,
    removeFile,
    renameFileItem,
    refreshStatus,
  };
}