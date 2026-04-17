import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse, RefreshResponse, mapApiUser } from '../types/auth';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

const ACCESS_TOKEN_KEY = 'educhat_access_token';
const REFRESH_TOKEN_KEY = 'educhat_refresh_token';
const USER_DATA_KEY = 'educhat_user_data';

export async function saveAuthData(
  accessToken: string,
  refreshToken: string,
  user: User
): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_DATA_KEY, JSON.stringify(user)],
  ]);
}

export async function loadAuthData(): Promise<{
  accessToken: string;
  refreshToken: string;
  user: User;
} | null> {
  const values = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_DATA_KEY,
  ]);

  const accessToken = values[0][1];
  const refreshToken = values[1][1];
  const userData = values[2][1];

  if (!accessToken || !refreshToken || !userData) return null;

  try {
    return {
      accessToken,
      refreshToken,
      user: JSON.parse(userData),
    };
  } catch {
    return null;
  }
}

// Legacy key from before backend auth — cleaned up on sign-out
const LEGACY_AUTH_TOKEN_KEY = 'educhat_auth_token';

export async function clearAuthData(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY, LEGACY_AUTH_TOKEN_KEY]);
}

/** Call POST /auth/login with a Google idToken. Returns session tokens + user. */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken, provider: 'google' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/** Call POST /auth/refresh to get a new access token. */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

/** Fetch current user details from GET /users/me. */
export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS_ME}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  const apiUser = await response.json();
  return mapApiUser(apiUser);
}

/** Update the stored access token (used after refresh). */
export async function updateStoredAccessToken(accessToken: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}