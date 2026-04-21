import { Platform } from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { apiRequest, getAccessTokenSync } from './api';

export interface FileOut {
  id: string;
  original_name: string;
  content_type: string;
  size: number;
  gcs_path: string;
  owner_id: string;
  processing_status: string;
  pages_processed: number;
  pages_total: number;
  created_at: string;
}

export interface ProcessingStatusResponse {
  file_id: string;
  processing_status: string;
  pages_processed: number;
  pages_total: number;
}

export async function uploadFile(fileUri: string, fileName: string, mimeType: string): Promise<FileOut> {
  const token = getAccessTokenSync();
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: fetch the blob from the object URL and append as a File
    const resp = await fetch(fileUri);
    const blob = await resp.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append('file', file);
  } else {
    // Native (iOS/Android): FormData accepts { uri, type, name }
    // @ts-expect-error React Native FormData supports uri/type/name
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    });
  }

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILES_UPLOAD}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function listFiles(): Promise<FileOut[]> {
  const response = await apiRequest('GET', API_ENDPOINTS.FILES_LIST);
  if (!response.ok) {
    throw new Error(`List files failed: ${response.status}`);
  }
  return response.json();
}

export async function renameFile(fileId: string, originalName: string): Promise<FileOut> {
  const response = await apiRequest('PATCH', API_ENDPOINTS.FILE_RENAME(fileId), { original_name: originalName });
  if (!response.ok) {
    throw new Error(`Rename file failed: ${response.status}`);
  }
  return response.json();
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await apiRequest('DELETE', API_ENDPOINTS.FILE_DELETE(fileId));
  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete file failed: ${response.status}`);
  }
}

export async function getFileStatus(fileId: string): Promise<ProcessingStatusResponse> {
  const response = await apiRequest('GET', API_ENDPOINTS.FILE_STATUS(fileId));
  if (!response.ok) {
    throw new Error(`Get status failed: ${response.status}`);
  }
  return response.json();
}

/** Build an authenticated URL for downloading/viewing a file. */
export async function getFileSignedUrl(fileId: string): Promise<string> {
  const response = await apiRequest('GET', API_ENDPOINTS.FILE_URL(fileId));
  if (!response.ok) {
    throw new Error(`Get signed URL failed: ${response.status}`);
  }
  const data = await response.json();
  return data.url;
}

export async function triggerProcessing(fileId: string): Promise<ProcessingStatusResponse> {
  const response = await apiRequest('POST', API_ENDPOINTS.FILE_PROCESS(fileId));
  if (!response.ok) {
    throw new Error(`Trigger processing failed: ${response.status}`);
  }
  return response.json();
}