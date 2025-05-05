/**
 * Cross-Window Communication for Tool System
 *
 * This module enables the tool system to work across browser windows,
 * iframes, and potentially with server environments in the future.
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Creates a cross-window communication provider for the tool system
 * @param {Object} toolSystem - Tool system instance
 * @param {Object} options - Configuration options
 * @returns {Object} Communication provider
 */
export function createCommunicationProvider(toolSystem, options = {}) {
  // Default options
  const config = {
    channelName: 'app-tool-system',
    localStorageKey: 'app-tool-events',
    allowedOrigins: ['*'],
    ...options
  };

  // Communication channels
  let broadcastChannel = null;
  let connectionMap = new Map();

  // Initialize browser-specific functionality
  if (isBrowser) {
    // Try to use BroadcastChannel API if available (modern browsers)
    try {
      broadcastChannel = new BroadcastChannel(config.channelName);

      broadcastChannel.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };
    } catch (error) {
      console.warn('BroadcastChannel API not available, falling back to localStorage');

      // Set up localStorage fallback
      window.addEventListener('storage', (event) => {
        if (event.key === config.localStorageKey) {
          try {
            const data = JSON.parse(event.newValue);
            handleIncomingMessage(data);
          } catch (e) {
            console.error('Error parsing cross-window message:', e);
          }
        }
      });
    }

    // Set up window messaging for iframe communication
    window.addEventListener('message', (event) => {
      // Check origin if specified
      if (config.allowedOrigins[0] !== '*') {
        if (!config.allowedOrigins.includes(event.origin)) {
          return;
        }
      }

      // Process message if it has our channel marker
      if (event.data && event.data._channel === config.channelName) {
        handleIncomingMessage(event.data);
      }
    });
  }

  /**
   * Handle incoming messages from other windows/frames
   * @param {Object} message - The received message
   */
  const handleIncomingMessage = (message) => {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'tool:call':
        // Handle external tool call
        if (message.event && message.event.meta) {
          // Get the appropriate provider
          const providerName = message.event.meta.provider || 'app';

          // Check if we have this provider
          if (toolSystem.getProviders().includes(providerName)) {
            // Forward to our local tool system
            toolSystem.tool(
              message.event.meta.name,
              message.event.payload,
              {
                ...message.event.meta,
                _external: true,
                _source: message.source
              }
            ).then(result => {
              // Send response back if requested
              if (message.requestResponse) {
                sendMessage({
                  type: 'tool:response',
                  requestId: message.event.meta.id,
                  result,
                  source: getSourceId()
                });
              }
            }).catch(error => {
              // Send error back if requested
              if (message.requestResponse) {
                sendMessage({
                  type: 'tool:error',
                  requestId: message.event.meta.id,
                  error: {
                    message: error.message,
                    name: error.name
                  },
                  source: getSourceId()
                });
              }
            });
          }
        }
        break;

      case 'tool:response':
        // Handle response to a previous request
        if (message.requestId) {
          toolSystem.handleResponse({
            meta: {
              id: message.requestId,
              _external: true,
              _source: message.source
            },
            ...message.result
          });
        }
        break;

      case 'state:sync':
        // Handle state synchronization
        if (message.state && message.path) {
          // Update our local state
          toolSystem.tool(message.path, message.state, {
            updateState: true,
            _external: true,
            _source: message.source
          });
        }
        break;

      case 'connection:request':
        // Handle connection request from another window/frame
        sendMessage({
          type: 'connection:response',
          source: getSourceId(),
          target: message.source
        });

        // Store connection info
        if (message.source) {
          connectionMap.set(message.source, {
            connected: true,
            lastSeen: Date.now()
          });
        }
        break;

      case 'connection:response':
        // Handle connection response
        if (message.source && message.target === getSourceId()) {
          connectionMap.set(message.source, {
            connected: true,
            lastSeen: Date.now()
          });
        }
        break;

      case 'ping':
        // Respond to ping requests
        sendMessage({
          type: 'pong',
          pingId: message.pingId,
          source: getSourceId(),
          target: message.source
        });
        break;

      case 'pong':
        // Handle ping response
        if (message.source && connectionMap.has(message.source)) {
          connectionMap.set(message.source, {
            ...connectionMap.get(message.source),
            lastSeen: Date.now(),
            pingReceived: true
          });
        }
        break;
    }
  };

  /**
   * Send a message to other windows/frames
   * @param {Object} message - The message to send
   */
  const sendMessage = (message) => {
    if (!isBrowser) return;

    // Add channel marker and timestamp
    const wrappedMessage = {
      ...message,
      _channel: config.channelName,
      _timestamp: Date.now()
    };

    // Use BroadcastChannel if available
    if (broadcastChannel) {
      broadcastChannel.postMessage(wrappedMessage);
    } else {
      // Fallback to localStorage
      localStorage.setItem(config.localStorageKey, JSON.stringify(wrappedMessage));
      // Remove it after a short delay to trigger another event
      setTimeout(() => {
        localStorage.removeItem(config.localStorageKey);
      }, 100);
    }

    // Also try postMessage to parent if we're in an iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(wrappedMessage, '*');
    }

    // And to any child iframes
    const frames = document.querySelectorAll('iframe');
    frames.forEach(frame => {
      try {
        frame.contentWindow.postMessage(wrappedMessage, '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    });
  };

  /**
   * Generate a unique source ID for this window
   * @returns {string} Unique ID
   */
  const getSourceId = () => {
    if (!isBrowser) return 'server';

    // Create or get window ID
    if (!window._toolSystemId) {
      window._toolSystemId = 'window_' + Math.random().toString(36).substring(2, 9);
    }

    return window._toolSystemId;
  };

  /**
   * Check connections with other windows
   */
  const checkConnections = () => {
    if (!isBrowser) return;

    // Send ping to all connections
    connectionMap.forEach((info, sourceId) => {
      sendMessage({
        type: 'ping',
        pingId: Math.random().toString(36).substring(2, 9),
        source: getSourceId(),
        target: sourceId
      });
    });

    // Clean up stale connections (no response in 30 seconds)
    const now = Date.now();
    connectionMap.forEach((info, sourceId) => {
      if (now - info.lastSeen > 30000) {
        connectionMap.delete(sourceId);
      }
    });
  };

  // Start connection checking at intervals
  let connectionInterval = null;

  if (isBrowser) {
    connectionInterval = setInterval(checkConnections, 10000);

    // Initial connection request
    sendMessage({
      type: 'connection:request',
      source: getSourceId()
    });
  }

  // Create the provider for the tool system
  const provider = {
    handle: async (event) => {
      // Handle remote tool calls
      if (event.meta.name === 'remote') {
        const targetWindow = event.payload.target;
        const toolName = event.payload.tool;
        const toolPayload = event.payload.payload;
        const toolMeta = event.payload.meta || {};

        // Send the tool call to other windows
        sendMessage({
          type: 'tool:call',
          event: {
            meta: {
              ...toolMeta,
              name: toolName,
              provider: toolMeta.provider || 'app',
              id: event.meta.id
            },
            payload: toolPayload
          },
          requestResponse: true,
          source: getSourceId(),
          target: targetWindow
        });

        // Return a pending response
        return {
          success: true,
          pending: true,
          data: {
            message: 'Request sent to remote window'
          },
          meta: {
            id: event.meta.id,
            name: event.meta.name,
            provider: 'remote'
          }
        };
      }

      // Handle state syncing
      if (event.meta.name === 'syncState') {
        const path = event.payload.path;
        const state = event.payload.state;

        // Send state to other windows
        sendMessage({
          type: 'state:sync',
          path,
          state,
          source: getSourceId()
        });

        return {
          success: true,
          data: {
            message: 'State synced to remote windows',
            path,
            state
          },
          meta: {
            id: event.meta.id,
            name: event.meta.name,
            provider: 'remote'
          }
        };
      }

      // List connected windows
      if (event.meta.name === 'listConnections') {
        return {
          success: true,
          data: {
            connections: Array.from(connectionMap.entries()).map(([id, info]) => ({
              id,
              ...info
            })),
            thisWindow: getSourceId()
          },
          meta: {
            id: event.meta.id,
            name: event.meta.name,
            provider: 'remote'
          }
        };
      }

      // Default response for unknown commands
      return {
        success: false,
        error: {
          message: `Unknown remote command: ${event.meta.name}`
        },
        meta: {
          id: event.meta.id,
          name: event.meta.name,
          provider: 'remote'
        }
      };
    }
  };

  // Register tools with the system
  toolSystem.registerTool('remote', 'remote', {
    async: true,
    description: 'Execute a tool in another window',
    schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target window ID' },
        tool: { type: 'string', description: 'Tool to execute' },
        payload: { type: 'object', description: 'Tool payload' },
        meta: { type: 'object', description: 'Tool metadata' }
      },
      required: ['tool', 'payload']
    }
  });

  toolSystem.registerTool('remote', 'syncState', {
    async: false,
    description: 'Sync state to other windows',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'State path to sync' },
        state: { type: 'object', description: 'State to sync' }
      },
      required: ['path', 'state']
    }
  });

  toolSystem.registerTool('remote', 'listConnections', {
    async: false,
    description: 'List connected windows',
    schema: {}
  });

  // Clean up when done
  const cleanup = () => {
    if (isBrowser) {
      if (broadcastChannel) {
        broadcastChannel.close();
      }

      if (connectionInterval) {
        clearInterval(connectionInterval);
      }

      window.removeEventListener('message', handleIncomingMessage);
    }
  };

  return {
    provider,
    sendMessage,
    getSourceId,
    getConnections: () => Array.from(connectionMap.entries()),
    cleanup
  };
}

/**
 * Register the communication provider with a tool system
 * @param {Object} toolSystem - Tool system instance
 * @param {Object} options - Provider options
 * @returns {Object} Communication provider
 */
export function registerCommunicationProvider(toolSystem, options = {}) {
  const provider = createCommunicationProvider(toolSystem, options);

  // Register with the tool system
  toolSystem.registerProvider('remote', provider.provider);

  return provider;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCommunicationProvider,
    registerCommunicationProvider
  };
}