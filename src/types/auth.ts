export interface User {
  id: number;
  name: string;
  email: string;
  photo?: string;
}

/** User object as returned by the backend API */
export interface ApiUser {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture_url: string;
  created_at: string;
}

/** Response from POST /auth/login */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
}

/** Response from POST /auth/refresh */
export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Map a backend ApiUser to the app's User type */
export function mapApiUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    photo: apiUser.picture_url || undefined,
  };
}