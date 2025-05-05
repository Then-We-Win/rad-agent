// src/boot/libs.js
console.log('XXX src/boot/libs.js');

import { boot } from 'quasar/wrappers'
import { reactive } from 'vue'
import ToolSystem from 'rad-agent/vue/tools'
import appCommands from '../commands/app'
import devCommands from '../commands/dev'
import replicateCommands from '../commands/replicate'
import playaiCommands from '../commands/playai'
import minimaxCommands from '../commands/minimax'

// Import the Vue integration directly
import { createVueToolSystem } from 'rad-agent/vue/integration'
import defaultSettings from 'src/settings'

// Create a store for the Vue integration instance
let vueIntegrationInstance = null;

// Boot function that initializes the tool system
export default boot(async ({ app }) => {
  // Register components

  // Organize commands by provider
  const providers = {
    app: { ...appCommands }, // Default provider for general commands
    dev: { ...devCommands },
    replicate: { ...replicateCommands },
    playai: { ...playaiCommands },
    minimax: { ...minimaxCommands }
  }

  // Custom settings
  const consoleSettings = {
    version: '1.1.0',
    welcome: 'Welcome to MyApp Console v1.1.0. Type "help" for a list of available commands or "providers" to see all command providers.',
    hotkey: 192, // Backtick key
    placeholder: 'Enter command...',
    defaultProvider: 'app' // Set the default provider to 'app'
  }

  try {
    console.log('Initializing Vue integration for tool system...');

    // Initialize the Vue integration of the SDK if not already done
    if (!vueIntegrationInstance) {
      vueIntegrationInstance = await createVueToolSystem({
        initialState: defaultSettings
      });

      // Try auto-login if we have stored credentials
      try {
        await vueIntegrationInstance.tryAutoLogin();
        console.log('Auto-login complete, user state:', vueIntegrationInstance.state.user);
      } catch (e) {
        console.warn('Auto-login failed:', e);
      }
    }

    // Create a reactive wrapper for Vue components to access
    const appInstance = reactive({
      // Tool system properties
      settings: vueIntegrationInstance.state,
      tool: vueIntegrationInstance.tool,

      // Core SDK methods
      login: vueIntegrationInstance.login,
      logout: vueIntegrationInstance.logout,
      getAsset: vueIntegrationInstance.getAsset,
      mergeSettings: vueIntegrationInstance.mergeSettings,
      data: vueIntegrationInstance.data,

      // Create a reactive proxy to the user state
      get user() {
        return vueIntegrationInstance.state.user || { loggedIn: false, data: {} };
      },
      set user(newValue) {
        // Update the user state when modified
        vueIntegrationInstance.store.setState({ user: newValue });
      },

      // Utility methods for backward compatibility
      getSettings: () => vueIntegrationInstance.state
    });

    // Make it available to Vue components through the Vue app
    app.config.globalProperties.$app = appInstance;

    // Provide direct access to the tool system through Vue
    app.config.globalProperties.$toolSystem = vueIntegrationInstance;

    // Freeze the original settings for reference
    app.config.globalProperties.$appSettings = Object.freeze({ ...defaultSettings });


    // Initialize app with console plugin (requires $app.settings to exist!)
    app.use(ToolSystem, {
      settings: consoleSettings,
      providers: providers // Pass the providers object instead of commands
    })

    // Use the Vue plugin from the integration
    app.use(vueIntegrationInstance.plugin);

    /*
    // Add this to your console (or in your app initialization)
// In your browser console or in a temporary debug script
const originalSplice = app.config.globalProperties.$app.settings.omni.items.splice;
app.config.globalProperties.$app.settings.omni.items.splice = function() {
  // Check if this is a call that would clear the array
  if (arguments[0] === 0 && arguments.length >= 2) {
    if (arguments[1] === this.length || arguments[1] === undefined || arguments[1] >= this.length) {
      console.warn('🚨 OMNI ITEMS BEING CLEARED with splice!', {
        args: Array.from(arguments),
        stack: new Error().stack
      });
    }
  }
  return originalSplice.apply(this, arguments);
};

let omniDescriptor = Object.getOwnPropertyDescriptor(app.config.globalProperties.$app.settings.omni, 'items');
if (omniDescriptor && omniDescriptor.configurable) {
  let origItems = app.config.globalProperties.$app.settings.omni.items;
  Object.defineProperty(app.config.globalProperties.$app.settings.omni, 'items', {
    get: function() {
      return origItems;
    },
    set: function(newValue) {
      if (Array.isArray(newValue) && newValue.length === 0) {
        console.warn('🚨 OMNI ITEMS BEING REPLACED with empty array!', {
          stack: new Error().stack
        });
      }
      origItems = newValue;
      return true;
    },
    enumerable: true,
    configurable: true
  });
}
*/

    console.log('Vue integration initialized successfully');
  } catch (error) {
    // Critical application error - tool system not available
    console.error('CRITICAL ERROR: Application cannot initialize SDK Vue integration:', error);

    // Throw the error to halt the boot process
    throw error;
  }
})
