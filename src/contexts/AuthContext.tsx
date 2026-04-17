import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { User, AuthState } from '../types/auth';
import {
  saveAuthData,
  loadAuthData,
  clearAuthData,
  loginWithGoogle,
  fetchCurrentUser,
  updateStoredAccessToken,
} from '../services/auth';
import { setOnAuthFailure, setOnTokenRefreshed, setTokenGetters } from '../services/api';

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || Constants.expoConfig?.extra?.googleWebClientId || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '597120914452-2kkuuts4k4330pvm9b2t0vj8ii2qaa59.apps.googleusercontent.com';

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

function signInWithGIS(): Promise<{ idToken: string }> {
  return new Promise(async (resolve, reject) => {
    await loadGoogleGSI();

    (window as any).google.accounts.id.initialize({
      client_id: WEB_CLIENT_ID,
      callback: (response: any) => {
        if (response.credential) {
          resolve({ idToken: response.credential });
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
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const hasRestoredRef = useRef(false);

  // Wire up token getters for the API client
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = state.accessToken;
    refreshTokenRef.current = state.refreshToken;
  }, [state.accessToken, state.refreshToken]);

  useEffect(() => {
    setTokenGetters(
      () => accessTokenRef.current,
      () => refreshTokenRef.current,
    );
  }, []);

  // Configure native Google Sign-In (lazy)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getNativeGoogleSignin().then(({ GoogleSignin }) => {
        console.log('Google Sign-In Configuration:');
        console.log('  WEB_CLIENT_ID:', WEB_CLIENT_ID);
        console.log('  IOS_CLIENT_ID:', IOS_CLIENT_ID);
        console.log('  Platform:', Platform.OS);
        
        const config = {
          webClientId: WEB_CLIENT_ID,
          iosClientId: IOS_CLIENT_ID || undefined,
          offlineAccess: true,
          scopes: ['profile', 'email'],
        };
        
        console.log('  Config object being passed:', JSON.stringify(config, null, 2));
        
        GoogleSignin.configure(config);
      }).catch((err) => {
        console.error('Failed to configure Google Sign-In:', err);
      });
    }
  }, []);

  const handleAuthFailure = useCallback(async () => {
    await clearAuthData();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const handleTokenRefreshed = useCallback((newAccessToken: string) => {
    setState(prev => ({ ...prev, accessToken: newAccessToken }));
  }, []);

  useEffect(() => {
    setOnAuthFailure(handleAuthFailure);
    setOnTokenRefreshed(handleTokenRefreshed);
  }, [handleAuthFailure, handleTokenRefreshed]);

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
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
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

      let idToken: string;

      if (Platform.OS === 'web') {
        const result = await signInWithGIS();
        idToken = result.idToken;
      } else {
        const { GoogleSignin, isSuccessResponse } = await getNativeGoogleSignin();
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (!isSuccessResponse(response)) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        idToken = response.data.idToken ?? '';
      }

      // Send the Google idToken to our backend
      const authResponse = await loginWithGoogle(idToken);

      const user: User = {
        id: authResponse.user.id,
        name: authResponse.user.name,
        email: authResponse.user.email,
        photo: authResponse.user.picture_url || undefined,
      };

      await saveAuthData(authResponse.access_token, authResponse.refresh_token, user);
      setState({
        user,
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Sign-in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error; // Re-throw so the UI can show the error
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
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.accessToken) return;
    try {
      const updatedUser = await fetchCurrentUser(state.accessToken);
      await saveAuthData(state.accessToken, state.refreshToken!, updatedUser);
      setState(prev => ({ ...prev, user: updatedUser }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.accessToken, state.refreshToken]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshUser }}>
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