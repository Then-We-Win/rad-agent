// utils/request.js - HTTP request handling
/**
 * Make HTTP request with appropriate headers and error handling
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
function request(url, options = {}) {
  // Handle authentication headers
  // Make request
  // Handle common errors
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} - Complete URL with query string
 */
function buildUrl(baseUrl, params = {}) {
  // Convert params to query string
  // Return complete URL
}

export {
  request,
  buildUrl
};
