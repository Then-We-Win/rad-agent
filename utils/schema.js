// utils/schema.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import defaultSettings from '../settings.json';
import { deepMerge, deepClone } from './utils';

import def from 'ajv/dist/vocabularies/discriminator';

// Define the settings schema
const settingsSchema = {
  type: "object",
  required: ["sdk"],
  properties: {
    sdk: {
      type: "object",
      required: ["settings", "app"],
      properties: {
        settings: {
          type: "object",
          required: ["name", "version", "local", "remote", "requests", "metadata",
                     "embedding", "debug", "environment", "auth"],
          properties: {
            name: { type: "string" },
            version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
            local: {
              type: "object",
              required: ["key", "save", "load", "storage"],
              properties: {
                key: { type: "string" },
                save: { type: "boolean" },
                load: { type: "boolean" },
                storage: { type: "string", enum: ["localStorage", "sessionStorage", "memory"] }
              }
            },
            remote: {
              type: "object",
              required: ["key", "save", "load", "sync"],
              properties: {
                key: { type: "string" },
                save: { type: "boolean" },
                load: { type: "boolean" },
                sync: {
                  type: "object",
                  required: ["enabled", "interval"],
                  properties: {
                    enabled: { type: "boolean" },
                    interval: { type: "integer", minimum: 1000 }
                  }
                }
              }
            },
            requests: {
              type: "object",
              required: ["timeout", "retries", "headers"],
              properties: {
                timeout: { type: "integer", minimum: 0 },
                retries: {
                  type: "object",
                  required: ["max", "backoff", "codes"],
                  properties: {
                    max: { type: "integer", minimum: 0 },
                    backoff: { type: "integer", minimum: 0 },
                    codes: {
                      type: "array",
                      items: { type: "integer", minimum: 100, maximum: 599 }
                    }
                  }
                },
                headers: {
                  type: "object",
                  additionalProperties: { type: "string" }
                }
              }
            },
            metadata: {
              type: "object",
              required: ["cdn", "preloadTracks"],
              properties: {
                cdn: {
                  type: "object",
                  required: ["baseUrl", "cache"],
                  properties: {
                    baseUrl: { type: "string", format: "uri" },
                    cache: {
                      type: "object",
                      required: ["enabled", "ttl"],
                      properties: {
                        enabled: { type: "boolean" },
                        ttl: { type: "integer", minimum: 0 }
                      }
                    }
                  }
                },
                preloadTracks: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            embedding: {
              type: "object",
              required: ["iframe"],
              properties: {
                iframe: {
                  type: "object",
                  required: ["width", "height", "allowFullscreen", "allowedDomains"],
                  properties: {
                    width: { type: "string" },
                    height: { type: "string" },
                    allowFullscreen: { type: "boolean" },
                    allowedDomains: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              }
            },
            debug: {
              type: "object",
              required: ["enabled", "logLevel", "traceRequests"],
              properties: {
                enabled: { type: "boolean" },
                logLevel: {
                  type: "string",
                  enum: ["none", "error", "warn", "info", "debug"]
                },
                traceRequests: { type: "boolean" }
              }
            },
            environment: {
              type: "object",
              required: ["mode", "features"],
              properties: {
                mode: {
                  type: "string",
                  enum: ["development", "production"]
                },
                features: {
                  type: "object",
                  properties: {
                    experimentalApi: { type: "boolean" }
                  },
                  additionalProperties: { type: "boolean" }
                }
              }
            },
            auth: {
              type: "object",
              required: ["defaults", "token", "otp"],
              properties: {
                defaults: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string" },
                    password: { type: "string" }
                  }
                },
                token: {
                  type: "object",
                  required: ["storage", "autoRefresh", "refreshThreshold", "sessionTimeout"],
                  properties: {
                    storage: {
                      type: "string",
                      enum: ["localStorage", "sessionStorage", "memory"]
                    },
                    autoRefresh: { type: "boolean" },
                    refreshThreshold: { type: "integer", minimum: 0 },
                    sessionTimeout: { type: "integer", minimum: 0 }
                  }
                },
                otp: {
                  type: "object",
                  required: ["defaultExpiration", "length", "allowUserCreation"],
                  properties: {
                    defaultExpiration: { type: "integer", minimum: 0 },
                    length: { type: "integer", minimum: 6 },
                    allowUserCreation: { type: "boolean" }
                  }
                }
              }
            }
          }
        },
        app: {
          type: "object",
          required: ["key", "id", "endpoint"],
          properties: {
            key: { type: "string" },
            id: {
              type: "string",
              pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
            },
            endpoint: { type: "string", format: "uri" },
            resources: {
              type: "object",
              additionalProperties: true
            }
          }
        }
      }
    }
  }
};

/**
 * Create and return a configured AJV validator
 * @returns {Object} Configured AJV validator
 */
function createValidator() {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    coerceTypes: true,
    useDefaults: true
  });

  // Add formats for URI validation
  addFormats(ajv);

  // Add our settings schema
  ajv.addSchema(settingsSchema, 'settings');

  return ajv;
}

/**
 * Format validation errors to be more readable
 * @param {Array} errors - AJV error objects
 * @returns {Array} Human-readable error messages
 */
function formatErrors(errors) {
  if (!errors) return [];

  return errors.map(error => {
    const path = error.instancePath || '';
    const property = error.params.missingProperty ?
      `${path ? path + '.' : ''}${error.params.missingProperty}` :
      path.replace(/^\//, '').replace(/\//g, '.');

    switch (error.keyword) {
      case 'required':
        return `Missing required property: ${property}`;
      case 'type':
        return `${property}: should be ${error.params.type}`;
      case 'enum':
        return `${property}: should be one of [${error.params.allowedValues.join(', ')}]`;
      case 'pattern':
        return `${property}: invalid format`;
      case 'format':
        return `${property}: should be a valid ${error.params.format}`;
      case 'minimum':
        return `${property}: should be >= ${error.params.limit}`;
      case 'maximum':
        return `${property}: should be <= ${error.params.limit}`;
      default:
        return `${property}: ${error.message}`;
    }
  });
}

/**
 * Validate settings object against schema
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Validation result {isValid, errors, validatedSettings}
 */
function validateSettings(settings) {
  const ajv = createValidator();
  const validate = ajv.getSchema('settings');

  // Clone settings to avoid modifying the original
  const settingsCopy = JSON.parse(JSON.stringify(settings));

  const isValid = validate(settingsCopy);

  return {
    isValid,
    errors: formatErrors(validate.errors),
    // Return the validated (and possibly coerced) settings
    validatedSettings: isValid ? settingsCopy : null
  };
}

/**
 * Deep merge default settings with user-provided settings
 * @param {Object} target - Destination settings
 * @param {Object} source - Source settings
 * @returns {Object} Merged settings
 */
function mergeSettings(target, source) {
  return deepMerge(deepClone(target), source)
}

/**
 * Initialize settings with defaults and validate
 * @param {Object} userSettings - User-provided settings
 * @returns {Object} Validated settings or null if invalid
 */
function initializeSettings(codeSettings = {}) {
  // Merge the SDK default settings with code-provided settings...
  const merged = mergeSettings(defaultSettings, codeSettings)

  // Merge the key settings...
  const { isValid, errors, validatedSettings } = validateSettings(merged);

  if (!isValid) {
    console.error("Invalid settings:", errors);
    return null;
  }

  return validatedSettings;
}

export {
  validateSettings,
  mergeSettings,
  initializeSettings,
  settingsSchema
};
