// src/commands/app/state.js
// Command to get or set values in the app state

export default {
  guide: 'Request quick help with something: request [get/set] [path] [value]',
  documentation: ``,
  command: function(args) {
    if (!args || args.length < 2) {
      // Create error response object
      const responseObject = {
        response: {
          error: true,
          message: "Insufficient arguments. Usage: request [get/set] [path] [value]"
        },
        meta: {
          command: "state",
          args: args || [],
          timestamp: new Date().toISOString()
        }
      };

      const jsonString = JSON.stringify(responseObject, null, 2)
        .replace(/'/g, '&#39;');

      return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
    }

    const operation = args[0].toLowerCase();
    const path = args[1];

    // Access the global $app object from Vue's globalProperties
    // In Vue 3 components, 'this' should have access to globalProperties
    if (!this.$app) {
      // Initialize $app if it doesn't exist in globalProperties
      this.$app = {};

      // If we have access to app instance, properly register the global property
      if (this.$root && this.$root.$app === undefined) {
        // This adds it to the current app instance
        this.$root.$app = this.$app;
      }
    }

    // Get reference to the $app object
    const $app = this.$app;

    if (operation === 'get') {
      try {
        // Get the value at the specified path
        const value = getValueByPath($app, path);

        // Create the standardized response object
        const responseObject = {
          // Primary response data - the main output of the command
          response: {
            path,
            value: value === undefined ? null : value,
            exists: value !== undefined
          },
          // Metadata - additional information useful for debugging or chaining
          meta: {
            command: "request",
            operation: "get",
            args, // put arguments here
            timestamp: new Date().toISOString()
          }
        };

        // Convert to JSON and display with the JSON viewer component
        const jsonString = JSON.stringify(responseObject, null, 2)
          .replace(/'/g, '&#39;'); // Escape single quotes for HTML attribute

        return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="true" expanded="false"></andypf-json-viewer>`;
      } catch (error) {
        // Create error response object
        const responseObject = {
          response: {
            error: true,
            message: `Error accessing path: ${error.message}`
          },
          meta: {
            command: "request",
            operation: "get",
            args,
            timestamp: new Date().toISOString()
          }
        };

        const jsonString = JSON.stringify(responseObject, null, 2)
          .replace(/'/g, '&#39;');

        return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
      }
    } else if (operation === 'set') {
      if (args.length < 3) {
        // Create error response object
        const responseObject = {
          response: {
            error: true,
            message: "Missing value argument. Usage: state set [path] [value]"
          },
          meta: {
            command: "request",
            operation: "set",
            args,
            timestamp: new Date().toISOString()
          }
        };

        const jsonString = JSON.stringify(responseObject, null, 2)
          .replace(/'/g, '&#39;');

        return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
      }

      // Parse the value from args
      let value = args[2];

      // Try to parse as JSON if it looks like an object/array/number/boolean
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === 'null') {
        value = null;
      } else if (value === 'undefined') {
        value = undefined;
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      } else if ((value.startsWith('{') && value.endsWith('}')) ||
                 (value.startsWith('[') && value.endsWith(']'))) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if parse fails
        }
      }

      try {
        // Set the value at the specified path
        const result = setValueByPath($app, path, value);
        const newValue = getValueByPath($app, path);

        // Create the standardized response object
        const responseObject = {
          // Primary response data - the main output of the command
          response: {
            path,
            success: result,
            oldValue: result ? undefined : null,
            newValue: result ? newValue : null
          },
          // Metadata - additional information useful for debugging or chaining
          meta: {
            command: "request",
            operation: "set",
            args, // put arguments here
            timestamp: new Date().toISOString()
          }
        };

        // Convert to JSON and display with the JSON viewer component
        const jsonString = JSON.stringify(responseObject, null, 2)
          .replace(/'/g, '&#39;'); // Escape single quotes for HTML attribute

        return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
      } catch (error) {
        // Create error response object
        const responseObject = {
          response: {
            error: true,
            message: `Error setting value at path ${path}: ${error.message}`
          },
          meta: {
            command: "request",
            operation: "set",
            args,
            timestamp: new Date().toISOString()
          }
        };

        const jsonString = JSON.stringify(responseObject, null, 2)
          .replace(/'/g, '&#39;');

        return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
      }
    } else {
      // Create error response object for unknown operation
      const responseObject = {
        response: {
          error: true,
          message: `Unknown operation: ${operation}. Use 'get' or 'set'.`
        },
        meta: {
          command: "state",
          args,
          timestamp: new Date().toISOString()
        }
      };

      const jsonString = JSON.stringify(responseObject, null, 2)
        .replace(/'/g, '&#39;');

      return `<andypf-json-viewer data='${jsonString}' theme="monokai" show-toolbar="false" expanded="false"></andypf-json-viewer>`;
    }
  },
  schema: {
    type: "object",
    required: ["operation", "path"],
    properties: {
      operation: {
        type: "string",
        enum: ["get", "set"],
        description: "Operation to perform (get or set)"
      },
      path: {
        type: "string",
        description: "Dot notation path to the property"
      },
      value: {
        type: "string",
        description: "Value to set (required for 'set' operation)"
      }
    },
    dependencies: {
      value: ["operation"] // value is required when operation is "set"
    }
  },
  src: "src/commands/app/request.js"
};

// Helper function to get a value from an object by a dotted path
function getValueByPath(obj, path) {
  if (!path) return obj;

  const segments = path.split('.');
  let current = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

// Helper function to set a value in an object by a dotted path
function setValueByPath(obj, path, value) {
  if (!path) return false;

  const segments = path.split('.');
  const lastSegment = segments.pop();
  let current = obj;

  // Navigate to the parent object
  for (const segment of segments) {
    // Create empty objects along the path if they don't exist
    if (current[segment] === undefined || current[segment] === null) {
      current[segment] = {};
    } else if (typeof current[segment] !== 'object') {
      // Can't navigate further if the path contains a non-object
      return false;
    }
    current = current[segment];
  }

  // Set the value
  current[lastSegment] = value;
  return true;
}

// This function is no longer needed since we're using the JSON viewer component
// Keeping the getValueByPath and setValueByPath functions since they're still used
