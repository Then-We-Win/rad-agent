// lib/auth.js - Authentication service

import { get } from "lodash";

/**
 * Create an authentication service that works with the backend adapter
 * @param {Object} backend - Backend adapter instance
 * @param {Object} settings - SDK settings
 * @returns {Object} - Authentication service interface
 */
function createAuthService(backend, settings) {
  // Store token in appropriate storage
  function saveToken(token) {
    const storage = settings.sdk.settings.auth.token.storage;

    if (storage === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.setItem('rad-agent.token', token);
    } else if (storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('rad-agent.token', token);
    }

    // Memory storage is handled by the backend adapter
  }

  function saveRefreshToken(token) {
    const storage = 'localStorage';

    if (storage === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    } else if (storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('refreshToken', token);
    }
  }

  // Retrieve token from storage
  function getStoredToken() {
    const storage = settings.sdk.settings.auth.token.storage;

    if (storage === 'localStorage' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rad-agent.token');
    } else if (storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('rad-agent.token');
    }
    return null;
  }

  // Retrieve refresh token from storage
  function getStoredRefreshToken() {
    //const storage = settings.sdk.settings.auth.token.storage;
    const key = 'refreshToken'
    const storage = 'localStorage'

    if (storage === 'localStorage' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    } else if (storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  }

  // Clear token from storage
  function clearToken() {
    const storage = settings.sdk.settings.auth.token.storage;

    if (storage === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userSettings');
    } else if (storage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('userSettings');
    }
  }

  // Return auth service interface
  return {
    getStoredToken,
    getStoredRefreshToken,
    /**
     * Authenticate user with username and password
     * @param {string} username - User's username or email
     * @param {string} password - User's password
     * @returns {Promise<Object>} - Authentication result with token and user
     */
    authenticate: async (username, password) => {
      const result = await backend.login(username, password);
      if (result && result.refresh_token) {
        saveToken(result.access_token);
        saveRefreshToken(result.refresh_token);
      }

      return result;
    },

    /**
     * Log out the current user
     * @returns {Promise<void>}
     */
    logout: async () => {
      await backend.logout();
      clearToken();
    },

    /**
     * Get the currently authenticated user
     * @returns {Object|null} - Current user or null if not authenticated
     */
    getCurrentUser: () => {
      return backend.getCurrentUser();
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} - Whether user is authenticated
     */
    isAuthenticated: () => {
      return backend.getCurrentUser() !== null;
    }
  };
}

export {
  createAuthService
};
