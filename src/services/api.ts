import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { refreshAccessToken, updateStoredAccessToken } from './auth';

/** Callback set by AuthContext — called when refresh also fails, triggering sign-out. */
let onAuthFailure: (() => void) | null = null;
/** Callback set by AuthContext — called when a token is refreshed to update in-memory state. */
let onTokenRefreshed: ((newAccessToken: string) => void) | null = null;

export function setOnAuthFailure(cb: () => void) {
  onAuthFailure = cb;
}

export function setOnTokenRefreshed(cb: (newAccessToken: string) => void) {
  onTokenRefreshed = cb;
}

/** Current access token getter, set by AuthContext. */
let getAccessToken: (() => string | null) | null = null;
let getRefreshToken: (() => string | null) | null = null;

export function setTokenGetters(accessGetter: () => string | null, refreshGetter: () => string | null) {
  getAccessToken = accessGetter;
  getRefreshToken = refreshGetter;
}

/**
 * Make an authenticated API request.
 * Automatically attaches Bearer token and handles 401 with token refresh + retry.
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options: { body?: unknown; headers?: Record<string, string> } = {}
): Promise<Response> {
  const token = getAccessToken?.();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && token) {
    // Try refreshing the token
    const refreshToken = getRefreshToken?.();
    if (!refreshToken) {
      onAuthFailure?.();
      return response;
    }

    try {
      const refreshResp = await refreshAccessToken(refreshToken);
      const newAccessToken = refreshResp.access_token;

      // Persist the new token
      await updateStoredAccessToken(newAccessToken);

      // Update in-memory state so subsequent requests use the new token
      onTokenRefreshed?.(newAccessToken);

      // Retry the original request with the new token
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      return fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: retryHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      // Refresh failed — sign the user out
      onAuthFailure?.();
      return response;
    }
  }

  return response;
}

/** Convenience: authenticated GET that returns parsed JSON. */
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const response = await apiRequest('GET', path);
  if (!response.ok) {
    throw new Error(`API GET ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Convenience: authenticated POST that returns parsed JSON. */
export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const response = await apiRequest('POST', path, { body });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API POST ${path} failed: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/** Get the current access token (for streaming requests that need to set headers manually). */
export function getAccessTokenSync(): string | null {
  return getAccessToken?.() ?? null;
}

/** Get the full URL for an API endpoint (for streaming/XHR requests). */
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}