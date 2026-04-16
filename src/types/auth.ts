export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}