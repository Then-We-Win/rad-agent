/*
 * This file is the main entry point for the SDK. It initializes the SDK with the backend URL, authentication key, and settings.
 * This has nothing to do with the admin app and will eventually be removed and placed into it's own NPM package.
 */

// index.js - Main app SDK entry point
import defaultSettings from './settings.json';
console.log('XXX src/sdk/index.js');

// index.js - Main entry point for the SDK

import backendAdapter from './lib/directus';
import { createAuthService } from './lib/auth';
import { createToolSystem } from './lib/tools';
import { createMetadataService } from './lib/metadata';
import { buildPermittedSDK } from './lib/permissions';
import { initializeSettings } from './utils/schema';
import { mergeSettings } from './lib/settings';
import { parseKey, validateKeyFormat } from './utils/security';
import sdkSettings from './settings.json';

/**
 * Initialize the SDK with backend URL, authentication key, and settings
 * @param {string} url - The URL of the backend service
 * @param {string} key - Authentication/API key
 * @param {Object} appSettings - Configuration options for the SDK
 * @returns {Object} - SDK instance with permitted methods
 */
async function setup(config) {
  const { url, key, settings: appSettings } = config;
  if (!url) {
    throw new Error('Backend URL is required');
  }

  if (!key || !validateKeyFormat(key)) {
    throw new Error('Valid API key is required');
  }

  // Initialize and validate settings
  //const settings = initializeSettings(settingsObj);
  //if (!settings) {
    //throw new Error('Invalid settings object');
  //}

  // Parse key to determine permissions
  // const keyInfo = parseKey(key);

  // Combine settings in correct order...
  let settings = mergeSettings(sdkSettings, appSettings);

  // Initialize agnostic backend adapter with sdk and app settings...
  const backend = backendAdapter(url, key, settings);

  // Add key settings...
  let keyData = { settings: {}}

  try {
    keyData = await backend.getKey(key);
  } catch (e) {
    console.warn('Invalid API key. Skipping key settings.');
    keyData = { settings: {}}
  }
  const keySettings = keyData.settings || {};
  settings = mergeSettings(settings, keySettings);

  // Initialize services using the backend adapter
  const auth = createAuthService(backend, settings);
  const metadata = createMetadataService(settings);

  // Build the core service collection
  const services = {
    createToolSystem,
    // Shortcuts for common operations
    user: {},
    login: auth.authenticate,
    getAsset: backend.getAsset,
    mergeSettings,
    backend,
    settings,
    // Direct data operations from backend
    data: backend.data,
    // Authentication services
    auth,
    // Metadata services
    metadata
  };

  // Build SDK with permissions
  return buildPermittedSDK(services, keyData);
}

// Export the main setup function
export default setup
