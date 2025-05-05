/**
 * Vue Integration for the Tool System
 *
 * This module integrates the framework-agnostic SDK with Vue
 * and provides reactive wrappers for Vue components.
 */
console.log('XXX src/sdk/vue/integration.js');

import { reactive, ref, watch, computed } from 'vue';
import { createToolSystem } from '../lib/tools';
import { createStore } from '../lib/state';
import setup from '../index.js';
import defaultSettings from '../settings.js';
import { mergeSettings } from '../lib/settings';
// SDK instance
let sdkInstance = null;
let sdkInitializing = false;
let sdkInitialized = false;

/**
 * Initialize the core SDK for use with Vue integration
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} SDK instance
 */
async function initializeSDK(options = {}) {
  if (sdkInstance && sdkInitialized) {
    return sdkInstance;
  }

  if (sdkInitializing) {
    // Wait for initialization to complete
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (sdkInitialized) {
          clearInterval(checkInterval);
          resolve(sdkInstance);
        }
      }, 100);
    });
  }

  sdkInitializing = true;

  try {
    // Merge provided options with defaults
    const settings = options.settings || defaultSettings;
    const url = options.url || settings.sdk?.app?.endpoint || 'https://api.rad-agent.com';
    const key = options.key || settings.sdk?.app?.key || 'app.v1.demo';

    // Initialize the core SDK
    sdkInstance = await setup({
      url,
      key,
      settings
    });

    sdkInitialized = true;
    sdkInitializing = false;

    return sdkInstance;
  } catch (error) {
    sdkInitializing = false;
    console.error('SDK initialization failed:', error);
    throw error;
  }
}

/**
 * Creates a Vue-compatible tool system with reactive state
 * @param {Object} options - Configuration options
 * @returns {Object} Vue-enhanced tool system
 */
export async function createVueToolSystem(options = {}) {
  // Initialize the SDK first
  const sdk = await initializeSDK(options);

  // Create the core tool system
  const toolSystem = createToolSystem(options);
  console.log('Created tool system:', toolSystem);

  // Create the state store with user object initialized
  const initialState = options.initialState || sdk.settings || defaultSettings;

  // Ensure initial state has user property initialized
  if (!initialState.user) {
    initialState.user = { loggedIn: false, data: {} };
  }

  // Try to restore user from localStorage if available
  try {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      const userSettings = JSON.parse(localStorage.getItem('userSettings'));
      if (userSettings && userSettings.user && userSettings.password) {
        // We'll handle auto-login in a separate function later
        console.log('Found saved credentials, will auto-login');
      }
    }
  } catch (e) {
    console.error('Error checking stored credentials:', e);
  }

  const appStore = createStore(initialState);

  // Make the state reactive for Vue
  const reactiveState = reactive(appStore.getState());

  // Update reactive state when store changes
  appStore.subscribe(newState => {
    Object.keys(newState).forEach(key => {
      reactiveState[key] = newState[key];
    });
  });

  // Create a Vue ref for loading state
  const isLoading = ref(false);
  const activeRequests = ref(0);

  // Add loading state tracking middleware
  toolSystem.use({
    before: async (event) => {
      if (event.meta.async) {
        activeRequests.value++;
        isLoading.value = activeRequests.value > 0;
      }
      return event;
    },
    after: async (event) => {
      if (event.meta.async) {
        activeRequests.value = Math.max(0, activeRequests.value - 1);
        isLoading.value = activeRequests.value > 0;
      }
      return event;
    }
  });

  // Enhance the tool function to update state
  const enhancedTool = (name, payload, meta = {}) => {
    // If the meta indicates this is a state update, handle locally
    if (meta.updateState === true) {
      const path = name.split('.');
      const slice = path[0];

      // If we're updating a slice
      if (path.length > 1) {
        appStore.setState({
          [slice]: {
            ...appStore.getState()[slice],
            [path[1]]: payload
          }
        });

        // Also emit an event for tools listening
        toolSystem.on('state:updated', {
          path: name,
          value: payload,
          previousValue: appStore.getState()[slice]?.[path[1]]
        });

        return { success: true, data: payload };
      }

      // Otherwise update the root state
      appStore.setState({ [name]: payload });

      // Emit event
      toolSystem.on('state:updated', {
        path: name,
        value: payload,
        previousValue: appStore.getState()[name]
      });

      return { success: true, data: payload };
    }

    // Otherwise delegate to the core tool system
    return toolSystem.tool(name, payload, meta);
  };

  /**
   * Creates a reactive wrapper around a state slice
   * @param {string} sliceName - Name of the state slice
   * @returns {Object} Reactive state and methods
   */
  const useState = (sliceName) => {
    // Create computed property that always returns current state
    const state = computed(() => {
      return sliceName ? reactiveState[sliceName] : reactiveState;
    });

    // Create setter function
    const setState = (newState) => {
      if (sliceName) {
        appStore.setState({
          [sliceName]: {
            ...appStore.getState()[sliceName],
            ...newState
          }
        });
      } else {
        appStore.setState(newState);
      }
    };

    return {
      state,
      setState
    };
  };

  // Create Vue plugin
  const plugin = {
    install(app, options = {}) {
      // Add the tool system to Vue's global properties
      app.config.globalProperties.$tool = enhancedTool;
      app.config.globalProperties.$toolSystem = toolSystem;
      app.config.globalProperties.$appState = reactiveState;
      app.config.globalProperties.$isLoading = isLoading;

      // Add composable functions to app
      app.provide('toolSystem', toolSystem);
      app.provide('appState', reactiveState);
      app.provide('isLoading', isLoading);
      app.provide('useState', useState);

      // Make tool system available globally if configured
      if (options.global) {
        window.$toolSystem = toolSystem;
      }
    }
  };

  // Enhanced login method that updates user state
  const enhancedLogin = async (email, password) => {
    try {
      const result = await sdk.login(email, password);

      // Update the user state in the store
      if (result && result.data) {
        const userState = {
          loggedIn: true,
          data: result.data,
          token: result.access_token,
          refresh_token: result.refresh_token,
          expires: result.expires,
          expires_at: result.expires_at
        };

        // Update the state
        appStore.setState({ user: userState });

        // Update the SDK's user property
        sdk.user = userState;

        return userState;
      }

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Auto-login function
  const tryAutoLogin = async () => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        const userSettings = JSON.parse(localStorage.getItem('userSettings'));
        if (userSettings && userSettings.user && userSettings.password) {
          return await enhancedLogin(userSettings.user, userSettings.password);
        }
      }
    } catch (e) {
      console.error('Auto-login failed:', e);
      return null;
    }
  };

  // Return enhanced system with Vue features and SDK access
  return {
    // Tool system methods
    ...toolSystem,
    tool: enhancedTool,
    state: reactiveState,
    isLoading,
    store: appStore,
    useState,
    plugin,

    // Core SDK methods - forwarding SDK methods through the Vue integration
    login: enhancedLogin, // Use the enhanced login method
    tryAutoLogin,
    logout: async () => {
      try {
        await sdk.logout();
        // Clear user state
        appStore.setState({ user: { loggedIn: false, data: {} } });
        // Clear localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userSettings');
        return true;
      } catch (error) {
        console.error('Logout failed:', error);
        throw error;
      }
    },
    getAsset: sdk.getAsset,
    data: sdk.data,
    mergeSettings: (target, source) => {
      const merged = mergeSettings(target, source);
      // Update the state store with merged settings
      appStore.setState(merged);
      return merged;
    },

    // SDK instance for direct access
    sdk
  };
}

// Export the async function to get the SDK instance
export async function getSDK(options = {}) {
  return initializeSDK(options);
}

// Default export
export default createVueToolSystem;