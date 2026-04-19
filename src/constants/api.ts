export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://educhat.devnadeem.com';

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_GEN_TOKEN: '/auth/gen-token',
  AUTH_REFRESH: '/auth/refresh',
  USERS_ME: '/users/me',
  OLLAMA_MODELS: '/ollama/models',
  OLLAMA_GENERATE: '/ollama/generate',
} as const;