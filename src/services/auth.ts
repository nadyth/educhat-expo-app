import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

const AUTH_TOKEN_KEY = 'educhat_auth_token';
const USER_DATA_KEY = 'educhat_user_data';

export async function saveAuthData(token: string, user: User): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

export async function loadAuthData(): Promise<{ token: string; user: User } | null> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const userData = await AsyncStorage.getItem(USER_DATA_KEY);

  if (!token || !userData) return null;

  try {
    return { token, user: JSON.parse(userData) };
  } catch {
    return null;
  }
}

export async function clearAuthData(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
}