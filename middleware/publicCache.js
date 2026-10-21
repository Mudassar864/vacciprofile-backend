/**
 * In-process response cache for anonymous GET requests (the public website).
 *
 * - Authenticated requests (the admin portal) always bypass the cache so editors see fresh data.
 * - Any write calls `invalidatePublicCache()` (via updateLastUpdate), which drops every entry
 *   in this process. With several PM2 instances, the other processes converge within the TTL.
 */
const TTL_MS = Math.max(0, Number(process.env.PUBLIC_CACHE_TTL_SECONDS ?? 60)) * 1000;
const MAX_ENTRIES = Math.max(10, Number(process.env.PUBLIC_CACHE_MAX_ENTRIES ?? 500));
const BROWSER_MAX_AGE = Math.max(0, Number(process.env.PUBLIC_CACHE_BROWSER_MAX_AGE ?? 30));

const store = new Map();
let stats = { hits: 0, misses: 0, invalidations: 0 };

function invalidatePublicCache() {
  store.clear();
  stats.invalidations += 1;
}

function getPublicCacheStats() {
  return { ...stats, entries: store.size, ttlSeconds: TTL_MS / 1000, maxEntries: MAX_ENTRIES };
}

function publicCache(req, res, next) {
  if (TTL_MS === 0 || req.method !== 'GET' || req.headers.authorization) {
    return next();
  }

  const key = req.originalUrl;
  const entry = store.get(key);
  const now = Date.now();

  if (entry && entry.expiresAt > now) {
    stats.hits += 1;
    // Refresh LRU position.
    store.delete(key);
    store.set(key, entry);
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=60`);
    res.type('application/json');
    return res.status(200).send(entry.body);
  }

  if (entry) store.delete(key);
  stats.misses += 1;

  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode === 200 && payload && payload.success !== false) {
      try {
        const body = JSON.stringify(payload);
        store.set(key, { body, expiresAt: Date.now() + TTL_MS });
        while (store.size > MAX_ENTRIES) {
          store.delete(store.keys().next().value);
        }
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=60`);
        res.type('application/json');
        return res.send(body);
      } catch {
        // Fall through to the default serializer.
      }
    }
    return originalJson(payload);
  };

  next();
}

module.exports = { publicCache, invalidatePublicCache, getPublicCacheStats };
