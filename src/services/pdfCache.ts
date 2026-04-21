import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { getFileSignedUrl } from './files';

const PDF_CACHE_DIR = FileSystem.cacheDirectory + 'pdfs/';

/** Ensure the PDF cache directory exists. */
async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, { intermediates: true });
  }
}

/** Get the local cache path for a file. */
function getCachePath(fileId: string): string {
  return PDF_CACHE_DIR + `${fileId}.pdf`;
}

/**
 * Get a URL suitable for viewing a PDF.
 *
 * - iOS / Android: Downloads to local cache on first open, returns local file URI
 *   on subsequent opens (no re-download, no signed-URL API call).
 * - Web: Returns a signed URL (browser iframe handles HTTP caching).
 */
export async function getPdfViewingUrl(fileId: string): Promise<string> {
  if (Platform.OS === 'web') {
    return getFileSignedUrl(fileId);
  }

  const localUri = getCachePath(fileId);
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists) {
    return localUri;
  }

  await ensureCacheDir();
  const signedUrl = await getFileSignedUrl(fileId);
  await FileSystem.downloadAsync(signedUrl, localUri);
  return localUri;
}

/** Remove a cached PDF file. */
export async function removeCachedPdf(fileId: string): Promise<void> {
  const localUri = getCachePath(fileId);
  const info = await FileSystem.getInfoAsync(localUri);
  if (info.exists) {
    await FileSystem.deleteAsync(localUri);
  }
}

/** Clear all cached PDFs. */
export async function clearPdfCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(PDF_CACHE_DIR);
  }
}