// Auth service for managing authentication state
const AUTH_TOKEN_KEY = 'reditto_auth_token';
const AUTH_USER_KEY = 'reditto_user';

export const authService = {
  // Save token and user to localStorage
  saveAuth: (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Get user from localStorage
  getUser: () => {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Remove token and user from localStorage
  clearAuth: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};
