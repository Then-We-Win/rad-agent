// lib/directus.js - Backend adapter for Directus
// This is the only file that should contain Directus-specific code
console.log('XXX src/sdk/lib/directus.js');

import {
  // Core functions
  createDirectus,
  rest,
  graphql,
  realtime,
  authentication,

  // Items
  createItem,
  createItems,
  readItem,
  readItems,
  updateItem,
  updateItems,
  deleteItem,
  deleteItems,

  readSingleton,
  updateSingleton,

  // Authentication
  login,
  refresh,
  logout,
  readMe,
  updateMe,
  passwordRequest,
  passwordReset,
  readProviders,
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,

  // Users
  createUser,
  createUsers,
  readUsers,
  readUser,
  updateUser,
  updateUsers,
  deleteUser,
  deleteUsers,

  registerUser,
  registerUserVerify,
  inviteUser,
  acceptUserInvite,

  // Operations
  createOperation,
  createOperations,
  readOperation,
  readOperations,
  updateOperation,
  updateOperations,
  deleteOperation,
  deleteOperations,

  // Flows
  createFlow,
  createFlows,
  readFlow,
  readFlows,
  updateFlow,
  updateFlows,
  deleteFlow,
  deleteFlows,

  triggerFlow,

  // Revisions (infinite undo/redo, aka data-time-travel)
  readRevision,
  readRevisions,

  // Assets (storing things in the platform)
  uploadFiles,
  readFile,
  readFiles,
  updateFile,
  updateFiles,
  deleteFile,
  deleteFiles,

  readAssetRaw,
  importFile,

  // Folders
  createFolder,
  createFolders,
  readFolder,
  readFolders,
  updateFolder,
  updateFolders,
  deleteFolder,
  deleteFolders,

  // Shares
  createShare,
  createShares,
  readShare,
  readShares,
  updateShare,
  updateShares,
  deleteShare,
  deleteShares,

  authenticateShare,
  inviteShare,
  readShareInfo,

  // Comments
  createComment,
  createComments,
  readComment,
  readComments,
  updateComment,
  updateComments,
  deleteComment,
  deleteComments,

  // Import/Export
  utilsImport,
  utilsExport,

  // Dashboards/widgets
  createDashboard,
  createDashboards,
  readDashboard,
  readDashboards,
  updateDashboard,
  updateDashboards,
  deleteDashboard,
  deleteDashboards,

  // Notifications (to users)
  createNotification,
  createNotifications,
  readNotification,
  readNotifications,
  updateNotification,
  updateNotifications,
  deleteNotification,
  deleteNotifications,

  // Versioning
  createContentVersion,
  createContentVersions,
  readContentVersion,
  readContentVersions,
  updateContentVersion,
  updateContentVersions,
  deleteContentVersion,
  deleteContentVersions,

  saveToContentVersion,
  promoteContentVersion,

  // Activity
  readActivity,
  readActivities,

  // Extensions
  readExtensions,
  updateExtension,

  // Altering fields
  readField,
  readFields,
  readFieldsByCollection,
  createField,
  updateField,
  deleteField,

  // Collections
  createCollection,
  readCollection,
  readCollections,
  updateCollection,
  deleteCollection,

  // TODO...

  // Permission
  // Policies
  // Presets
  // Settings
  // Schema
  // Server
  // Utilities
  // Relations
  // Roles


} from '@directus/sdk'
import { request, buildUrl } from '../utils/requests';
import { create } from 'lodash';

/**
 * Create a backend adapter for Directus
 * @param {string} url - Base URL for the API
 * @param {string} key - API key
 * @param {Object} settings - SDK settings
 * @returns {Object} - Standardized backend interface
 */
function setup(url, key, settings) {
  // Initialize the underlying Directus SDK client
  const directus = createDirectus(url).with(rest()).with(graphql()).with(authentication('cookie'));
  // Internal state
  let token = null;
  let user = null;
  let collections = null;
  let refreshTimer = null;

  // Track retry attempts
  let retryCount = 0;
  const maxRetries = settings.sdk.settings.requests.retries.max;

  /**
   * Handle errors from backend operations
   * @private
   * @param {Error} error - Error object
   * @param {string} operation - Operation name for context
   */
  function _handleError(error, operation) {
    const errorInfo = {
      operation,
      message: error.message,
      status: error.status || error.response?.status
    };
    // Log the error if debug is enabled
    if (settings.sdk.settings.debug.enabled) console.error(`RAD-Agent SDK Error (${operation}):`, error);
    // Wrap the error with context
    const wrappedError = new Error(`RAD-Agent SDK: ${operation} failed - ${error.message}`);
    wrappedError.originalError = error;
    wrappedError.status = errorInfo.status;
    throw wrappedError;
  }

  async function sdkCall(fn, ...args) {
    try {
      const result = await directus.request(fn(...args));
      return result ?? null;
    } catch (error) {
      _handleError(error, fn.name || 'anonymous');
      return null;
    }
  }
  // Return standardized backend interface
  return {
    data: {
      // Directus SDK wrapper - additional CRUD functions using a flexible call wrapper
      createItem: async (collection, data) => sdkCall(createItem, collection, data),
      createItems: async (collection, data) => sdkCall(createItems, collection, data),
      readItem: async (collection, data) => sdkCall(readItem, collection, data),
      readItems: async (collection, data) => sdkCall(readItems, collection, data),
      updateItem: async (collection, data) => sdkCall(updateItem, collection, data),
      updateItems: async (collection, data) => sdkCall(updateItems, collection, data),
      deleteItem: async (collection, id) => sdkCall(deleteItem, collection, id),
      deleteItems: async (collection, query = {}) => sdkCall(deleteItems, collection, query),

      readSingleton: async (key) => sdkCall(readSingleton, key),
      updateSingleton: async (key, data) => sdkCall(updateSingleton, key, data),

      createUser: async (data) => sdkCall(createUser, data),
      createUsers: async (data) => sdkCall(createUsers, data),
      readUsers: async (query = {}) => sdkCall(readUsers, query),
      readUser: async (id, query = {}) => sdkCall(readUser, id, query),
      updateUser: async (id, data) => sdkCall(updateUser, id, data),
      updateUsers: async (data) => sdkCall(updateUsers, data),
      deleteUser: async (id) => sdkCall(deleteUser, id),
      deleteUsers: async (query = {}) => sdkCall(deleteUsers, query),

      createOperation: async (data) => sdkCall(createOperation, data),
      createOperations: async (data) => sdkCall(createOperations, data),
      readOperation: async (id, query = {}) => sdkCall(readOperation, id, query),
      readOperations: async (query = {}) => sdkCall(readOperations, query),
      updateOperation: async (id, data) => sdkCall(updateOperation, id, data),
      updateOperations: async (data) => sdkCall(updateOperations, data),
      deleteOperation: async (id) => sdkCall(deleteOperation, id),
      deleteOperations: async (query = {}) => sdkCall(deleteOperations, query),

      createFlow: async (data) => sdkCall(createFlow, data),
      createFlows: async (data) => sdkCall(createFlows, data),
      readFlow: async (id, query = {}) => sdkCall(readFlow, id, query),
      readFlows: async (query = {}) => sdkCall(readFlows, query),
      updateFlow: async (id, data) => sdkCall(updateFlow, id, data),
      updateFlows: async (data) => sdkCall(updateFlows, data),
      deleteFlow: async (id) => sdkCall(deleteFlow, id),
      deleteFlows: async (query = {}) => sdkCall(deleteFlows, query),

      uploadFiles: async (data) => sdkCall(uploadFiles, data),
      readFile: async (id, query = {}) => sdkCall(readFile, id, query),
      readFiles: async (query = {}) => sdkCall(readFiles, query),
      updateFile: async (id, data) => sdkCall(updateFile, id, data),
      updateFiles: async (data) => sdkCall(updateFiles, data),
      deleteFile: async (id) => sdkCall(deleteFile, id),
      deleteFiles: async (query = {}) => sdkCall(deleteFiles, query),

      createFolder: async (data) => sdkCall(createFolder, data),
      createFolders: async (data) => sdkCall(createFolders, data),
      readFolder: async (id, query = {}) => sdkCall(readFolder, id, query),
      readFolders: async (query = {}) => sdkCall(readFolders, query),
      updateFolder: async (id, data) => sdkCall(updateFolder, id, data),
      updateFolders: async (data) => sdkCall(updateFolders, data),
      deleteFolder: async (id) => sdkCall(deleteFolder, id),
      deleteFolders: async (query = {}) => sdkCall(deleteFolders, query),

      createShare: async (data) => sdkCall(createShare, data),
      createShares: async (data) => sdkCall(createShares, data),
      readShare: async (id, query = {}) => sdkCall(readShare, id, query),
      readShares: async (query = {}) => sdkCall(readShares, query),
      updateShare: async (id, data) => sdkCall(updateShare, id, data),
      updateShares: async (data) => sdkCall(updateShares, data),
      deleteShare: async (id) => sdkCall(deleteShare, id),
      deleteShares: async (query = {}) => sdkCall(deleteShares, query),

      createComment: async (data) => sdkCall(createComment, data),
      createComments: async (data) => sdkCall(createComments, data),
      readComment: async (id, query = {}) => sdkCall(readComment, id, query),
      readComments: async (query = {}) => sdkCall(readComments, query),
      updateComment: async (id, data) => sdkCall(updateComment, id, data),
      updateComments: async (data) => sdkCall(updateComments, data),
      deleteComment: async (id) => sdkCall(deleteComment, id),
      deleteComments: async (query = {}) => sdkCall(deleteComments, query),

      createDashboard: async (data) => sdkCall(createDashboard, data),
      createDashboards: async (data) => sdkCall(createDashboards, data),
      readDashboard: async (id, query = {}) => sdkCall(readDashboard, id, query),
      readDashboards: async (query = {}) => sdkCall(readDashboards, query),
      updateDashboard: async (id, data) => sdkCall(updateDashboard, id, data),
      updateDashboards: async (data) => sdkCall(updateDashboards, data),
      deleteDashboard: async (id) => sdkCall(deleteDashboard, id),
      deleteDashboards: async (query = {}) => sdkCall(deleteDashboards, query),

      createNotification: async (data) => sdkCall(createNotification, data),
      createNotifications: async (data) => sdkCall(createNotifications, data),
      readNotification: async (id, query = {}) => sdkCall(readNotification, id, query),
      readNotifications: async (query = {}) => sdkCall(readNotifications, query),
      updateNotification: async (id, data) => sdkCall(updateNotification, id, data),
      updateNotifications: async (data) => sdkCall(updateNotifications, data),
      deleteNotification: async (id) => sdkCall(deleteNotification, id),
      deleteNotifications: async (query = {}) => sdkCall(deleteNotifications, query),

      createContentVersion: async (data) => sdkCall(createContentVersion, data),
      createContentVersions: async (data) => sdkCall(createContentVersions, data),
      readContentVersion: async (id, query = {}) => sdkCall(readContentVersion, id, query),
      readContentVersions: async (query = {}) => sdkCall(readContentVersions, query),
      updateContentVersion: async (id, data) => sdkCall(updateContentVersion, id, data),
      updateContentVersions: async (data) => sdkCall(updateContentVersions, data),
      deleteContentVersion: async (id) => sdkCall(deleteContentVersion, id),
      deleteContentVersions: async (query = {}) => sdkCall(deleteContentVersions, query),
    },
    // Login a user (Everything below will be filtered by the permissions of this person)...
    login: async (email, password) => {
      try {
        const response = await directus.login(email, password);
        // Store authentication data
        token = response.refresh_token;
        const userResponse = await directus.request(readMe());
        user = userResponse

        return {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          expires: response.expires,
          expires_at: response.expires_at,
          data: user
        };
      } catch (error) {
        _handleError(error, 'login');
      }
    },
    // Get the URL of any uploaded asset...
    getAsset: (id, key, transforms = {}) => {
      try {
        const keyParam = key ? `?key=${key}` : '';
        const assetUrl = `${url}/assets/${id}${keyParam}`
        return assetUrl
      } catch (error) {
        _handleError(error, 'getAsset');
      }
    },
    // Get details about a key...
    getKey: async (id) => {
      try {
        const key = await directus.request(readItems('keys', { filter: { key: id } }));
        if (key && key.length) {
          return key[0];
        }
      } catch (error) {
        _handleError(error, 'getKey');
      }
    },
    // Get a list of all collections on the platform...
    logout: async () => {
      if (!token) return;

      try {
        await directus.auth.logout();
        token = null;
        user = null;

        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
      } catch (error) {
        _handleError(error, 'logout');
      }
    },
    getCurrentUser: () => { return user; },
  };
}

export default setup
