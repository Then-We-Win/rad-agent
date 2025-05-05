/**
 * Core Tool System - Framework-agnostic implementation
 *
 * This module provides a universal tool system that can be used across
 * different JavaScript frameworks and environments.
 */

// Import a lightweight event emitter library
import mitt from 'mitt';

/**
 * Creates a tool system instance
 * @param {Object} options - Configuration options
 * @returns {Object} Tool system API
 */
export function createToolSystem(options = {}) {
  // Initialize the event emitter
  const emitter = mitt();

  // Configuration with defaults
  const config = {
    logSize: options.logSize || 100,
    defaultTimeout: options.defaultTimeout || 30000,
    debug: options.debug || false,
    ...options
  };

  // Tool registry - stores metadata about registered tools
  const registry = options.registry || {};

  // Event log for debugging
  const eventLog = [];

  // Map of pending requests waiting for responses
  const pendingRequests = new Map();

  // Provider registry - stores handlers for different namespaces
  const providers = {
    // Default app provider - can be overridden
    app: {
      handle: async (event) => {
        return {
          success: true,
          data: event.payload,
          meta: {
            name: event.meta.name,
            provider: 'app',
            id: event.meta.id,
            time: Date.now()
          }
        };
      }
    }
  };

  // Middleware stack
  const middleware = [];

  /**
   * Generate a unique ID for requests
   * @returns {string} UUID v4
   */
  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  /**
   * Add an event to the log
   * @param {Object} event - Event to log
   */
  const logEvent = (event) => {
    // Only log if debug is enabled
    if (!config.debug) return;

    eventLog.unshift({
      ...event,
      _timestamp: new Date()
    });

    // Keep log at configured size
    if (eventLog.length > config.logSize) {
      eventLog.pop();
    }

    // Log to console in debug mode
    if (config.debug) {
      console.log(`[Tool] ${event.meta.provider}.${event.meta.name}`, event);
    }
  };

  /**
   * Run all middleware on an event
   * @param {Object} event - Event to process
   * @param {string} direction - 'before' or 'after'
   * @returns {Object} Processed event
   */
  const runMiddleware = async (event, direction = 'before') => {
    let currentEvent = {...event};

    for (const handler of middleware) {
      if (typeof handler[direction] === 'function') {
        try {
          const result = await handler[direction](currentEvent);

          // Allow middleware to cancel events by returning null/false
          if (!result) return null;

          currentEvent = result;
        } catch (error) {
          console.error(`Middleware error (${direction}):`, error);
        }
      }
    }

    return currentEvent;
  };

  /**
   * Handle a response to a pending request
   * @param {Object} response - Response event
   * @returns {boolean} Whether the response was handled
   */
  const handleResponse = (response) => {
    const requestId = response.meta?.id;

    if (!requestId || !pendingRequests.has(requestId)) {
      return false;
    }

    const { resolve, reject, timeout } = pendingRequests.get(requestId);
    clearTimeout(timeout);
    pendingRequests.delete(requestId);

    if (response.error) {
      reject(response);
    } else {
      resolve(response);
    }

    return true;
  };

  /**
   * Main tool function - the primary API endpoint
   * @param {string} name - Tool name to invoke
   * @param {any} payload - Data to send
   * @param {Object} meta - Additional metadata
   * @returns {Promise|Object} Result - Promise for async operations, direct result for sync
   */
  const tool = (name, payload, meta = {}) => {
    // Extract provider from meta or use default
    const provider = meta.provider || 'app';

    // Check if tool exists in registry
    const toolInfo = registry[provider]?.[name];
    const isAsync = meta.async ?? toolInfo?.async ?? true;

    // Create event object
    const event = {
      meta: {
        id: meta.id || generateId(),
        name,
        provider,
        time: Date.now(),
        async: isAsync,
        ...meta
      },
      payload
    };

    // Log outgoing event
    logEvent(event);

    // Emit raw event for listeners
    emitter.emit('tool:call', event);
    emitter.emit(`tool:call:${provider}.${name}`, event);

    // For synchronous tools, handle directly and return result
    if (!isAsync) {
      try {
        // Ensure provider exists
        if (!providers[provider]) {
          throw new Error(`Provider '${provider}' not registered`);
        }

        // Process event
        const result = providers[provider].handle(event);

        // Emit completion
        emitter.emit('tool:complete', {
          meta: event.meta,
          result
        });

        return result;
      } catch (error) {
        const errorResult = {
          success: false,
          error: {
            message: error.message,
            name: error.name
          },
          meta: event.meta
        };

        emitter.emit('tool:error', errorResult);
        return errorResult;
      }
    }

    // For async tools, return a promise
    return new Promise((resolve, reject) => {
      // Set timeout for the request
      const timeout = setTimeout(() => {
        if (pendingRequests.has(event.meta.id)) {
          pendingRequests.delete(event.meta.id);

          const timeoutError = {
            success: false,
            error: {
              message: `Request timed out after ${config.defaultTimeout}ms`,
              name: 'TimeoutError'
            },
            meta: event.meta
          };

          emitter.emit('tool:timeout', timeoutError);
          reject(timeoutError);
        }
      }, config.defaultTimeout);

      // Store pending request
      pendingRequests.set(event.meta.id, {
        resolve,
        reject,
        timeout,
        event
      });

      // Process the request
      try {
        // Ensure provider exists
        if (!providers[provider]) {
          const error = new Error(`Provider '${provider}' not registered`);
          throw error;
        }

        // Run before middleware
        runMiddleware(event, 'before')
          .then(processedEvent => {
            if (!processedEvent) {
              const cancelError = {
                success: false,
                error: {
                  message: 'Request cancelled by middleware',
                  name: 'CancelledError'
                },
                meta: event.meta
              };

              // Remove from pending requests
              pendingRequests.delete(event.meta.id);
              clearTimeout(timeout);

              emitter.emit('tool:cancelled', cancelError);
              reject(cancelError);
              return;
            }

            // Handle the event
            return providers[provider].handle(processedEvent);
          })
          .then(result => {
            // Add response metadata
            const response = {
              ...result,
              meta: {
                ...event.meta,
                responseTime: Date.now(),
                ...result.meta
              }
            };

            // Run after middleware
            return runMiddleware(response, 'after');
          })
          .then(finalResult => {
            // Only resolve if still pending (not timed out)
            if (pendingRequests.has(event.meta.id)) {
              pendingRequests.delete(event.meta.id);
              clearTimeout(timeout);

              emitter.emit('tool:complete', {
                meta: event.meta,
                result: finalResult
              });

              resolve(finalResult);
            }
          })
          .catch(error => {
            // Only reject if still pending
            if (pendingRequests.has(event.meta.id)) {
              pendingRequests.delete(event.meta.id);
              clearTimeout(timeout);

              const errorResult = {
                success: false,
                error: {
                  message: error.message,
                  name: error.name,
                  stack: config.debug ? error.stack : undefined
                },
                meta: event.meta
              };

              emitter.emit('tool:error', errorResult);
              reject(errorResult);
            }
          });
      } catch (error) {
        // Handle synchronous errors in setup
        pendingRequests.delete(event.meta.id);
        clearTimeout(timeout);

        const errorResult = {
          success: false,
          error: {
            message: error.message,
            name: error.name,
            stack: config.debug ? error.stack : undefined
          },
          meta: event.meta
        };

        emitter.emit('tool:error', errorResult);
        reject(errorResult);
      }
    });
  };

  /**
   * Register a new provider
   * @param {string} name - Provider name
   * @param {Object} handler - Provider implementation
   * @returns {Object} The tool system (for chaining)
   */
  const registerProvider = (name, handler) => {
    if (typeof handler.handle !== 'function') {
      throw new Error(`Provider '${name}' must have a handle method`);
    }

    providers[name] = handler;

    // Emit provider registration event
    emitter.emit('provider:registered', { name, handler });

    return api; // For chaining
  };

  /**
   * Register a tool in the registry
   * @param {string} provider - Provider name
   * @param {string} name - Tool name
   * @param {Object} metadata - Tool metadata
   * @returns {Object} The tool system (for chaining)
   */
  const registerTool = (provider, name, metadata = {}) => {
    // Initialize provider in registry if needed
    if (!registry[provider]) {
      registry[provider] = {};
    }

    // Add tool to registry
    registry[provider][name] = {
      ...metadata,
      registered: new Date()
    };

    // Emit tool registration event
    emitter.emit('tool:registered', { provider, name, metadata });

    return api; // For chaining
  };

  /**
   * Add middleware to the processing pipeline
   * @param {Object} handler - Middleware handlers
   * @returns {Object} The tool system (for chaining)
   */
  const use = (handler) => {
    middleware.push(handler);
    return api; // For chaining
  };

  /**
   * Subscribe to tool events
   * @param {string} event - Event name to subscribe to
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  const on = (event, handler) => {
    emitter.on(event, handler);
    return () => emitter.off(event, handler);
  };

  /**
   * Unsubscribe from tool events
   * @param {string} event - Event name to unsubscribe from
   * @param {Function} handler - Event handler to remove
   */
  const off = (event, handler) => {
    emitter.off(event, handler);
  };

  // Create and return the public API
  const api = {
    tool,
    registerProvider,
    registerTool,
    handleResponse,
    use,
    on,
    off,
    // Debugging utilities
    getRegistry: () => ({...registry}),
    getEventLog: () => [...eventLog],
    getPendingRequests: () => new Map(pendingRequests),
    getProviders: () => Object.keys(providers),
    // Config access
    getConfig: () => ({...config}),
    setConfig: (newConfig) => {
      Object.assign(config, newConfig);
      return api;
    }
  };

  return api;
}

// Export a default instance for simple cases
export const toolSystem = createToolSystem();

// Default export for ES modules
export default createToolSystem;