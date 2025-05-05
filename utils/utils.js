// utils/utils.js
import defaultSettings from '../settings.json';

/**
 * Deep clone an object
 *
 * @param {Object} obj - The object to clone
 * @returns {Object} A deep copy of the object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge two objects
 *
 * @param {Object} target - The target object
 * @param {Object} source - The source object
 * @returns {Object} The merged object
 */
function deepMerge(target, source) {
  // Create a deep clone of the target so we don't modify the original
  const output = deepClone(target);

  // If source doesn't exist or isn't an object, return the target clone
  if (!source || typeof source !== 'object') {
    return output;
  }

  // For each property in source
  Object.keys(source).forEach(key => {
    // If the property is an object, recursively merge
    if (source[key] && typeof source[key] === 'object' &&
        output[key] && typeof output[key] === 'object') {
      output[key] = deepMerge(output[key], source[key]);
    }
    // Otherwise, just assign the source value
    else {
      output[key] = source[key];
    }
  });

  return output;
}

/**
 * Create an error with the correct internal name
 *
 * @param {String} message - The error message
 * @param {Object} errorObject - The error object
 * @param {Object} settings - The settings object (how you define your internal name)
 * @returns {Object} A deep copy of the object
 */
function createError(message, errorObject, settings = defaultSettings) {
  const config = settings.sdk.settings;
  if (errorObject) {
    console.error(`${config.name}: {${message}}`, errorObject);
  } else {
    throw new Error(`${config.name}: {${message}}`);
  }
}

export {
  deepClone,
  deepMerge,
  createError
};
