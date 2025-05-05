/*
  vue-console for Vue 3
  Based on original vue-console 1.0.0
  https://github.com/onexdata/vue-console
  By Nick Steele <njsteele@gmail.com>

  Based on console.js 1.2.2 (pre-React)

  Apache 2.0 License.
*/

import consoleComponent from './console.vue'
import Bus from './bus.js'  // Import the Bus factory function
import { markRaw } from 'vue'

// Create a new bus instance
const consoleBus = Bus()

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  install: (app, options = {}) => {

    // Set up the omni array in app settings
    if (!app.config.globalProperties.$app.settings.omni) {
      app.config.globalProperties.$app.settings.omni = {
        items: [] // This will store all omni bar items
      };
    }

    // Default configuration
    const defaultConfig = {
      version: '1.0.0',
      hotkey: 192, // '~'
      onShow: null,
      onHide: null,
      onEnter: null,
      onToggle: null,
      placeholder: 'Command?',
      helpCmd: 'help',
      defaultHandler: null,
      caseSensitive: false,
      historySize: 256,
      defaultProvider: 'app',
      welcome: `Universal tool console v0.0.1.<br>Integrates Model Context Protocol. Up or down for history. "help" for help.<br>Use command:provider to access specific provider commands.`
    }

    // Set up global properties
    app.config.globalProperties.$console = {
      providers: {
        // Initialize with empty default provider
        [options.settings?.defaultProvider || defaultConfig.defaultProvider]: {}
      },
      defaultConfig: { ...defaultConfig, ...options.settings },
      log: null,
      dispatch: null,
      toggle: null,
      guide: null,
      // Store event subscriptions by component instance
      _eventSubscriptions: new Map(),
      // Helper for commands to get Vue app context
      getContext: function() {
        return {
          app,
          providers: app.config.globalProperties.$console.providers,
          config: app.config.globalProperties.$console.defaultConfig,
          // Return a method to access Vue components by name (if they have a name)
          getComponentByName: function(name) {
            // This is a simplified approach - in a real app you might need a more robust solution
            return app._instance?.appContext.components[name] || null
          }
        }
      },
      // Event emission method that uses the consoleBus
      emitEvent: function(event, data) {
        consoleBus.emit(event, data);
        return true;
      }
    }

    // Expose the full consoleBus as $consoleBus
    app.config.globalProperties.$consoleBus = consoleBus;

    // Pre-load providers and commands from options if provided
    if (options.providers) {
      Object.entries(options.providers).forEach(([providerName, commands]) => {
        if (!app.config.globalProperties.$console.providers[providerName]) {
          app.config.globalProperties.$console.providers[providerName] = {}
        }

        Object.entries(commands).forEach(([commandName, command]) => {
          const lowerCommandName = commandName.toLowerCase()
          app.config.globalProperties.$console.providers[providerName][lowerCommandName] = command
        })
      })
    }

    // Initialize core console methods
    const initConsoleMethods = (instance) => {
      // Set the log method
      app.config.globalProperties.$console.log = function(type, ...args) {
        if (instance) instance.log(type, ...args)
      }

      // Set the dispatch method
      app.config.globalProperties.$console.dispatch = function(str, invoker) {
        if (instance) instance.dispatch(str, invoker)
      }

      // Set the guide method
      app.config.globalProperties.$console.guide = function() {
        let guide = ''

        // Organize commands by provider
        Object.keys(app.config.globalProperties.$console.providers).sort().forEach(providerName => {
          const providerCommands = app.config.globalProperties.$console.providers[providerName]
          const defaultProvider = app.config.globalProperties.$console.defaultConfig.defaultProvider

          if (Object.keys(providerCommands).length > 0) {
            guide += `<div class="console-guide-heading">Provider: ${providerName}</div>`

            Object.keys(providerCommands).sort().forEach(commandName => {
              guide += `<div class="console-guide-heading">${commandName}${providerName !== defaultProvider ? ':' + providerName : ''}</div>` +
                `<div class="console-guide-detail">${providerCommands[commandName].guide}</div>`
            })
          }
        })

        return guide
      }

      // Set the toggle method
      app.config.globalProperties.$console.toggle = function() {
        if (instance) instance.toggle()
      }

      // Listen for 'console.log' event (with dot notation)
      consoleBus.on('console.log', function(message) {
        if (instance) {
          const strMessage = typeof message === 'string' ? message :
            (typeof message === 'object' ? JSON.stringify(message) : String(message));
          instance.log('message', strMessage);
        }
      });
    }

    // Helper functions...

    const defaultProvider = options.settings?.defaultProvider || defaultConfig.defaultProvider

    // Register the mixin for all components
    app.mixin({
      beforeMount() {
        // This registers new commands found on each component in your apps...
        function register(commandWithProvider, payload, instance) {
          // Parse command and provider
          let commandName, providerName
          const defaultProvider = app.config.globalProperties.$console.defaultConfig.defaultProvider

          if (commandWithProvider.includes(':')) {
            [commandName, providerName] = commandWithProvider.split(':')
          } else {
            commandName = commandWithProvider
            providerName = defaultProvider
          }

          if (!app.config.globalProperties.$console.defaultConfig.caseSensitive) {
            commandName = commandName.toLowerCase()
            providerName = providerName.toLowerCase()
          }

          // Create provider if it doesn't exist
          if (!app.config.globalProperties.$console.providers[providerName]) {
            app.config.globalProperties.$console.providers[providerName] = {}
          }

          // Run the payload to set up the command and get its guide and function...
          const config = payload.bind(instance)()

          // Get the component name and file path for reference
          const componentName = instance.$options.name || 'Unnamed Component'
          const filePath = instance.$options.__file || 'Unknown'

          app.config.globalProperties.$console.providers[providerName][commandName] = {
            guide: config.guide,
            command: config.command,  // Store the command function without binding
            context: instance,  // Store the instance as context for later use

            // Enhanced properties
            documentation: config.documentation || null,
            component: componentName,  // Auto-tracked from component
            image: config.image || null,
            src: config.src || filePath,  // Auto-tracked from source file
            schema: config.schema || null
          }
        }

        // This registers event handlers defined on components
        function registerEvent(eventName, payload, instance) {
          // Run the payload to set up the event handler
          const config = payload.bind(instance)();

          if (!config.handler || typeof config.handler !== 'function') {
            console.warn(`Event handler for '${eventName}' is not a function`);
            return;
          }

          // Store reference to the handler bound to this instance
          const boundHandler = config.handler.bind(instance);

          // Subscribe to the event using the consoleBus
          consoleBus.on(eventName, boundHandler);

          // Store the subscription info for cleanup
          if (!app.config.globalProperties.$console._eventSubscriptions.has(instance)) {
            app.config.globalProperties.$console._eventSubscriptions.set(instance, []);
          }

          app.config.globalProperties.$console._eventSubscriptions.get(instance).push({
            eventName,
            handler: boundHandler
          });
        }

        // If this is the console component, initialize the console methods
        if (this.$options.name === 'v-console') {
          initConsoleMethods(this)

          // Set the console instance as context for default commands in all providers
          Object.keys(app.config.globalProperties.$console.providers).forEach(provider => {
            Object.keys(app.config.globalProperties.$console.providers[provider]).forEach(command => {
              const commandObj = app.config.globalProperties.$console.providers[provider][command]
              if (!commandObj.context) {
                commandObj.context = this
              }
            })
          })
        }

        // Go through each component in the app and register all commands...
        const commands = this.$options.commands
        if (commands) {
          const name = this.$options.name
          if (!name) console.warn('vue-console: All components should be named for better event debugging');
          Object.keys(commands).forEach(command => register(command, this.$options.commands[command], this))
        }

        // Register all event handlers defined in the component
        const events = this.$options.events
        if (events) {
          const name = this.$options.name
          if (!name) console.warn('vue-console: All components should be named for better event debugging');
          Object.keys(events).forEach(event => registerEvent(event, this.$options.events[event], this))
        }

        // Ensure component has a unique ID
        this._omniId = generateUUID();

        // Register omni items if defined
        if (this.$options.omni) {
          const componentName = this.$options.name || 'unnamed';

          // Add items to the global settings
          Object.entries(this.$options.omni).forEach(([key, item]) => {
            // Deep clone the item to avoid directly modifying the original
            const omniItem = { ...item };

            // Here's the key fix: automatically mark any component with markRaw
            if (omniItem.type === 'component' && omniItem.component) {
              omniItem.component = markRaw(omniItem.component);
            }

            const finalItem = {
              id: `${this._omniId}-${key}`,
              componentId: this._omniId,
              componentName,
              key,
              ...omniItem
            };

            // Add to the global array
            if (!this.$app.settings.omni) {
              this.$app.settings.omni = { items: [] };
            }
            this.$app.settings.omni.items.push(finalItem);
          });
        }
      },

      beforeUnmount() {
        // Clean up event subscriptions when component is unmounted
        const subscriptions = app.config.globalProperties.$console._eventSubscriptions.get(this);
        if (subscriptions) {
          // Unsubscribe from each event
          subscriptions.forEach(sub => {
            consoleBus.off(sub.eventName, sub.handler);
          });

          // Remove all subscriptions for this component
          app.config.globalProperties.$console._eventSubscriptions.delete(this);
        }

        // Clean up omni items using the reliable ID
        if (this._omniId && this.$app.settings.omni && this.$app.settings.omni.items) {
          // Find indices to remove
          for (let i = this.$app.settings.omni.items.length - 1; i >= 0; i--) {
            if (this.$app.settings.omni.items[i].componentId === this._omniId) {
              // Remove item
              this.$app.settings.omni.items.splice(i, 1);
            }
          }
        }
      }
    })


    // Register the component
    app.component('console', consoleComponent)
  }
}