/**
 * Helper functions for cache invalidation
 * Use these in controllers to clear cache when data changes
 */

const { clearCache, clearCachePatterns } = require('./cache');

/**
 * Clear cache for vaccine-related endpoints
 */
const clearVaccineCache = () => {
  clearCachePatterns([
    '/api/vaccines*',
    '/api/pathogens*', // Pathogens are related to vaccines
  ]);
};

/**
 * Clear cache for pathogen-related endpoints
 */
const clearPathogenCache = () => {
  clearCachePatterns([
    '/api/pathogens*',
    '/api/vaccines*', // Vaccines are related to pathogens
  ]);
};

/**
 * Clear cache for manufacturer-related endpoints
 */
const clearManufacturerCache = () => {
  clearCachePatterns([
    '/api/manufacturers*',
    '/api/manufacturer-*',
    '/api/vaccines*', // Vaccines are related to manufacturers
  ]);
};

/**
 * Clear cache for licensing-related endpoints
 */
const clearLicensingCache = () => {
  clearCachePatterns([
    '/api/licensing-dates*',
    '/api/vaccines*', // Vaccines have licensing dates
  ]);
};

/**
 * Clear cache for product profile-related endpoints
 */
const clearProductProfileCache = () => {
  clearCachePatterns([
    '/api/product-profiles*',
    '/api/vaccines*', // Vaccines have product profiles
  ]);
};

/**
 * Clear cache for NITAG-related endpoints
 */
const clearNITAGCache = () => {
  clearCache('/api/nitags*');
};

/**
 * Clear cache for licenser-related endpoints
 */
const clearLicenserCache = () => {
  clearCachePatterns([
    '/api/licensers*',
    '/api/vaccines*', // Vaccines are related to licensers
  ]);
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  clearCache();
};

module.exports = {
  clearVaccineCache,
  clearPathogenCache,
  clearManufacturerCache,
  clearLicensingCache,
  clearProductProfileCache,
  clearNITAGCache,
  clearLicenserCache,
  clearAllCache,
};

