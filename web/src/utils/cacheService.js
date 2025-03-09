/**
 * Cache service for API responses
 * Caches data for 2 minutes or until manually invalidated
 */

// Cache storage
const cache = new Map();

// Cache expiration time in milliseconds (2 minutes)
const CACHE_EXPIRATION = 2 * 60 * 1000;

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if not found or expired
 */
export const getCachedData = (key) => {
  if (!cache.has(key)) {
    return null;
  }

  const cachedItem = cache.get(key);
  const now = Date.now();

  // Check if cache has expired
  if (now - cachedItem.timestamp > CACHE_EXPIRATION) {
    cache.delete(key);
    return null;
  }

  return cachedItem.data;
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Clear all cached data
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Clear specific cached data
 * @param {string} key - Cache key to clear
 */
export const clearCacheItem = (key) => {
  cache.delete(key);
};

/**
 * Get all cache keys
 * @returns {string[]} - Array of cache keys
 */
export const getCacheKeys = () => {
  return Array.from(cache.keys());
};

/**
 * Check if cache has a valid (non-expired) item
 * @param {string} key - Cache key
 * @returns {boolean} - True if cache has valid item
 */
export const hasCachedData = (key) => {
  return getCachedData(key) !== null;
}; 