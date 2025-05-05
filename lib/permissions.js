// lib/permissions.js - Method availability logic
//import { getSettings } from './settings.js';

/**
 * Permission levels for API keys
 * @enum {number}
 */
const PermissionLevel = {
  READ_ONLY: 0,
  STANDARD: 1,
  ADMIN: 2,
  SYSTEM: 3
};

/**
 * Map of methods to required permission levels
 * @type {Object}
 */
const methodPermissions = {
  // Authentication methods
  'auth.authenticate': PermissionLevel.READ_ONLY,
  'auth.authenticateWithToken': PermissionLevel.READ_ONLY,
  'auth.validateOTP': PermissionLevel.READ_ONLY,
  'auth.logout': PermissionLevel.READ_ONLY,
  'auth.getCurrentUser': PermissionLevel.READ_ONLY,
  'auth.isAuthenticated': PermissionLevel.READ_ONLY,
  'auth.restoreAuthentication': PermissionLevel.READ_ONLY,
  'auth.createOTP': PermissionLevel.ADMIN,

  // Data methods (backend-agnostic names)
  'data.getCollections': PermissionLevel.READ_ONLY,
  'data.getItems': PermissionLevel.READ_ONLY,
  'data.getItem': PermissionLevel.READ_ONLY,
  'data.queryItems': PermissionLevel.READ_ONLY,
  'data.getSchema': PermissionLevel.READ_ONLY,
  'data.createItem': PermissionLevel.STANDARD,
  'data.updateItem': PermissionLevel.STANDARD,
  'data.deleteItem': PermissionLevel.STANDARD,
  'data.subscribe': PermissionLevel.STANDARD,

  // Metadata methods
  'metadata.getMetadata': PermissionLevel.READ_ONLY,
  'metadata.getMetadataTracks': PermissionLevel.READ_ONLY,
  'metadata.trackEngagement': PermissionLevel.READ_ONLY
};

/**
 * Get permissions for the given key info
 * @param {Object} keyInfo - Key information from parseKey
 * @returns {Object} - Map of method names to permission booleans
 */
function getPermissionsForKey(keyInfo) {
  const permissions = {};
  const level = keyInfo //.permissionLevel;

  // Set permissions based on level
  Object.keys(methodPermissions).forEach(method => {
    permissions[method] = level >= methodPermissions[method];
  });

  return permissions;
}

/**
 * Build SDK instance with only permitted methods
 * @param {Object} services - Internal service implementations
 * @param {Object} keyInfo - Key information from parseKey
 * @returns {Object} - SDK instance with permitted methods
 */
async function buildPermittedSDK(services, keyInfo) {
  // Get a settings implementation...
  // let settings = await getSettings(services.settings);
  // services.settings = settings;
  // Return the whole object. This is a placeholder for the actual implementation.
  return services;

  /*
  const permissions = getPermissionsForKey(keyInfo);
  const sdk = {};

  // Helper to get nested property path
  const getNestedProperty = (obj, path) => {
    const parts = path.split('.');
    return parts.reduce((current, part) => current && current[part], obj);
  };

  // Helper to set nested property path
  const setNestedProperty = (obj, path, value) => {
    const parts = path.split('.');
    const lastPart = parts.pop();
    const target = parts.reduce((current, part) => {
      if (!current[part]) current[part] = {};
      return current[part];
    }, obj);

    target[lastPart] = value;
  };

  // Add permitted methods to SDK
  Object.keys(permissions).forEach(methodPath => {
    if (permissions[methodPath]) {
      const method = getNestedProperty(services, methodPath);

      if (typeof method === 'function') {
        // Bind method to its service
        const serviceName = methodPath.split('.')[0];
        const boundMethod = method.bind(services[serviceName]);

        // Add to SDK
        setNestedProperty(sdk, methodPath, boundMethod);
      }
    }
  });

  // Add key info to SDK
  sdk.keyInfo = {
    permissionLevel: keyInfo, //.permissionLevel,
    tenant: keyInfo, //.tenant,
    expires: keyInfo, //.expires
  };

  return sdk;
  */
}

export {
  PermissionLevel,
  buildPermittedSDK,
  getPermissionsForKey
};
