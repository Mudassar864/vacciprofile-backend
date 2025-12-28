const NodeCache = require('node-cache');

// Create cache instance with default TTL of 1 hour (3600 seconds)
// stdTTL: time to live in seconds for every generated cache element
// checkperiod: period in seconds to automatically delete expired entries
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour default
  checkperiod: 600, // Check for expired entries every 10 minutes
  useClones: false // Better performance, but be careful with object references
});

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds (optional, defaults to 1 hour)
 * @returns {Function} Express middleware function
 */
const cacheMiddleware = (ttl = 3600) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from request URL and query parameters
    const key = req.originalUrl || req.url;
    
    // Check if data exists in cache
    const cachedData = cache.get(key);
    
    if (cachedData) {
      // Set cache headers
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedData);
    }

    // If not cached, override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      // Only cache successful responses (status 200)
      if (res.statusCode === 200) {
        cache.set(key, data, ttl);
        res.set('X-Cache', 'MISS');
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for a specific key or pattern
 * @param {string} keyPattern - Cache key or pattern to clear
 */
const clearCache = (keyPattern) => {
  if (keyPattern) {
    // If pattern contains wildcard, clear all matching keys
    if (keyPattern.includes('*')) {
      const keys = cache.keys();
      const pattern = new RegExp(keyPattern.replace(/\*/g, '.*'));
      keys.forEach(key => {
        if (pattern.test(key)) {
          cache.del(key);
        }
      });
    } else {
      // Clear specific key
      cache.del(keyPattern);
    }
  } else {
    // Clear all cache
    cache.flushAll();
  }
};

/**
 * Clear cache for multiple patterns
 * @param {string[]} patterns - Array of cache key patterns to clear
 */
const clearCachePatterns = (patterns) => {
  patterns.forEach(pattern => clearCache(pattern));
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCachePatterns,
  getCacheStats,
  cache, // Export cache instance for direct access if needed
};

