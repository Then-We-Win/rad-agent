// lib/metadata.js - CDN metadata operations

/**
 * Create a metadata service for accessing content metadata
 * @param {Object} settings - SDK settings
 * @returns {Object} - Metadata service interface
 */
function createMetadataService(settings) {
  // Cache for metadata
  const metadataCache = {};

  // Check if caching is enabled
  const cacheEnabled = settings.sdk.settings.metadata.cdn.cache.enabled;
  const cacheTTL = settings.sdk.settings.metadata.cdn.cache.ttl * 1000;

  /**
   * Check if item is in cache and valid
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} - Cached item or null if not found/valid
   */
  function getFromCache(cacheKey) {
    if (!cacheEnabled || !metadataCache[cacheKey]) {
      return null;
    }

    const cacheItem = metadataCache[cacheKey];
    if (Date.now() - cacheItem.timestamp > cacheTTL) {
      delete metadataCache[cacheKey];
      return null;
    }

    return cacheItem.data;
  }

  /**
   * Add item to cache
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Data to cache
   */
  function addToCache(cacheKey, data) {
    if (!cacheEnabled) return;

    metadataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Build CDN URL for metadata
   * @param {string} contentID - Content identifier
   * @param {string} trackName - Track/stream name
   * @param {string} chunkID - Chunk identifier
   * @returns {string} - Complete URL for metadata
   */
  function buildMetadataUrl(contentID, trackName, chunkID) {
    const baseUrl = settings.sdk.settings.metadata.cdn.baseUrl;
    return `${baseUrl}/${contentID}/${trackName}/${chunkID}`;
  }

  return {
    /**
     * Get metadata for a specific content chunk
     * @param {string} contentID - Content identifier
     * @param {string} trackName - Track/stream name
     * @param {string} chunkID - Chunk identifier
     * @returns {Promise<Object>} - Metadata for the chunk
     */
    getMetadata: async (contentID, trackName, chunkID) => {
      // Create cache key
      const cacheKey = `${contentID}:${trackName}:${chunkID}`;

      // Check cache first
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Build URL and fetch metadata
      const url = buildMetadataUrl(contentID, trackName, chunkID);

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Add to cache
        addToCache(cacheKey, data);

        return data;
      } catch (error) {
        throw new Error(`Metadata fetch failed: ${error.message}`);
      }
    },

    /**
     * Get all metadata tracks for content
     * @param {string} contentID - Content identifier
     * @returns {Promise<Array>} - List of available tracks
     */
    getMetadataTracks: async (contentID) => {
      const baseUrl = settings.sdk.settings.metadata.cdn.baseUrl;
      const url = `${baseUrl}/${contentID}/tracks`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata tracks: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        throw new Error(`Metadata tracks fetch failed: ${error.message}`);
      }
    },

    /**
     * Track user engagement with metadata
     * @param {string} contentID - Content identifier
     * @param {string} trackName - Track name
     * @param {string} chunkID - Chunk identifier
     * @param {Object} eventData - Engagement data
     * @returns {Promise<Object>} - Tracking result
     */
    trackEngagement: async (contentID, trackName, chunkID, eventData) => {
      const baseUrl = settings.sdk.settings.metadata.cdn.baseUrl;
      const url = `${baseUrl}/${contentID}/${trackName}/${chunkID}/engagement`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            timestamp: Date.now(),
            ...eventData
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to track engagement: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // Silently handle engagement tracking errors if in production
        if (settings.sdk.settings.environment.mode === 'production') {
          console.error('Engagement tracking failed:', error);
          return { success: false };
        }

        throw new Error(`Engagement tracking failed: ${error.message}`);
      }
    },

    /**
     * Preload metadata for tracks
     * @returns {Promise<void>}
     */
    preloadMetadata: async () => {
      const tracksToPreload = settings.sdk.settings.metadata.preloadTracks;

      if (!tracksToPreload || tracksToPreload.length === 0) {
        return;
      }

      // Execute preloading in background
      Promise.all(tracksToPreload.map(async (trackInfo) => {
        if (typeof trackInfo === 'string') {
          // Simple format: just content ID
          return await this.getMetadataTracks(trackInfo);
        } else if (trackInfo.contentID) {
          // Detailed format with contentID, track, chunk
          return await this.getMetadata(
            trackInfo.contentID,
            trackInfo.trackName,
            trackInfo.chunkID
          );
        }
      })).catch(error => {
        console.error('Metadata preloading error:', error);
      });
    }
  };
}

export {
  createMetadataService
};
