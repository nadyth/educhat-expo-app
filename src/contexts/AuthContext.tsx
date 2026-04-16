import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { User, AuthState } from '../types/auth';
import { saveAuthData, loadAuthData, clearAuthData } from '../services/auth';

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || Constants.expoConfig?.extra?.googleWebClientId || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// --- Web: Google Identity Services (popup, no redirect URI needed) ---

function loadGoogleGSI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('Not a browser')); return; }
    if ((window as any).google?.accounts?.id) { resolve(); return; }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google GIS'));
    document.head.appendChild(script);
  });
}

function signInWithGIS(): Promise<{ idToken: string; user: User }> {
  return new Promise(async (resolve, reject) => {
    await loadGoogleGSI();

    (window as any).google.accounts.id.initialize({
      client_id: WEB_CLIENT_ID,
      callback: (response: any) => {
        if (response.credential) {
          try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);

            const user: User = {
              id: payload.sub,
              name: payload.name || 'Student',
              email: payload.email,
              photo: payload.picture,
            };

            resolve({ idToken: response.credential, user });
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error('No credential returned'));
        }
      },
    });

    (window as any).google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        reject(new Error('Google Sign-In was not displayed. Please try again.'));
      }
    });
  });
}

// --- Native: Lazy-load @react-native-google-signin to avoid web crash ---

let nativeGoogleSignin: typeof import('@react-native-google-signin/google-signin') | null = null;

async function getNativeGoogleSignin() {
  if (!nativeGoogleSignin) {
    nativeGoogleSignin = await import('@react-native-google-signin/google-signin');
  }
  return nativeGoogleSignin;
}

// --- AuthProvider ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const hasRestoredRef = useRef(false);

  // Configure native Google Sign-In (lazy)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getNativeGoogleSignin().then(({ GoogleSignin }) => {
        console.log('Configuring Google Sign-In with Web Client ID:', WEB_CLIENT_ID);
        GoogleSignin.configure({
          webClientId: WEB_CLIENT_ID,
          iosClientId: IOS_CLIENT_ID || undefined,
          offlineAccess: true,
          scopes: ['profile', 'email'],
        });
      }).catch((err) => {
        console.error('Failed to configure Google Sign-In:', err);
      });
    }
  }, []);

  // Load saved session on mount — only once
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    (async () => {
      try {
        const data = await loadAuthData();
        if (data) {
          setState({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const signIn = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      if (Platform.OS === 'web') {
        const { idToken, user } = await signInWithGIS();
        await saveAuthData(idToken, user);
        setState({ user, token: idToken, isAuthenticated: true, isLoading: false });
      } else {
        const { GoogleSignin, isSuccessResponse } = await getNativeGoogleSignin();
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const googleUser = response.data;
        const user: User = {
          id: googleUser.user.id,
          name: googleUser.user.name ?? 'Student',
          email: googleUser.user.email,
          photo: googleUser.user.photo ?? undefined,
        };

        const token = googleUser.idToken ?? '';
        await saveAuthData(token, user);
        setState({ user, token, isAuthenticated: true, isLoading: false });
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        const { GoogleSignin } = await getNativeGoogleSignin();
        await GoogleSignin.signOut();
      } catch {}
    }
    await clearAuthData();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}