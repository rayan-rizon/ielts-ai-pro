/**
 * Simple in-memory API response cache.
 * Provides TTL-based caching for API responses to reduce redundant requests.
 * Uses LRU eviction to prevent unbounded memory growth.
 */

// Cache storage
const cache = new Map<string, CacheEntry>();

// Maximum number of cache entries before LRU eviction kicks in
const MAX_CACHE_SIZE = 100;

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30 seconds - for frequently changing data
  MEDIUM: 5 * 60 * 1000, // 5 minutes - for user data, stats
  LONG: 30 * 60 * 1000, // 30 minutes - for relatively static data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for static reference data
};

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Get a value from cache.
 * @param key - Cache key
 * @returns - Cached value or null if not found/expired
 */
export function getFromCache<T = any>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    // Cache expired, remove and return null
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set a value in cache.
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in ms (default: MEDIUM)
 */
export function setInCache(key: string, data: any, ttl: number = CACHE_TTL.MEDIUM) {
  // Evict oldest entries if cache is at capacity
  if (!cache.has(key) && cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Remove a value from cache.
 * @param key - Cache key
 */
export function removeFromCache(key: string) {
  cache.delete(key);
}

/**
 * Clear entire cache or entries matching a prefix.
 * @param prefix - Optional prefix to match keys
 */
export function clearCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate cache entries matching a pattern.
 * Useful for invalidating related data after mutations.
 * @param pattern - Pattern to match keys
 */
export function invalidateCache(pattern: RegExp) {
  for (const key of cache.keys()) {
    if (pattern.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Create a cache key from function name and arguments.
 * @param fnName - Function name
 * @param args - Function arguments
 * @returns - Cache key
 */
export function createCacheKey(fnName: string, ...args: any[]): string {
  const argsHash = JSON.stringify(args);
  return `${fnName}:${argsHash}`;
}

/**
 * Wrap an async function with caching.
 * @param fn - Async function to cache
 * @param keyPrefix - Prefix for cache keys
 * @param ttl - Cache TTL in ms
 * @returns - Cached function
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl: number = CACHE_TTL.MEDIUM
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = createCacheKey(keyPrefix, ...args);

    // Check cache first
    const cached = getFromCache(key);
    if (cached !== null) {
      return cached;
    }

    // Call original function
    const result = await fn(...args);

    // Cache the result
    setInCache(key, result, ttl);

    return result;
  };
}

/**
 * Higher-order function for stale-while-revalidate pattern.
 * Returns cached data immediately while fetching fresh data in background.
 * @param fn - Async function
 * @param keyPrefix - Cache key prefix
 * @param ttl - Cache TTL
 * @returns - SWR-enabled function
 */
export function withSWR<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttl: number = CACHE_TTL.MEDIUM
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    const key = createCacheKey(keyPrefix, ...args);
    const cached = getFromCache(key);

    // Start background revalidation
    const revalidate = async () => {
      try {
        const fresh = await fn(...args);
        setInCache(key, fresh, ttl);
        return fresh;
      } catch (error) {
        console.warn(`Background revalidation failed for ${key}:`, error);
        return null;
      }
    };

    if (cached !== null) {
      // Return cached data, revalidate in background
      revalidate();
      return cached;
    }

    // No cache, await fresh data
    const result = await fn(...args);
    setInCache(key, result, ttl);
    return result;
  };
}

/**
 * Get cache statistics.
 * @returns {{ size: number, keys: string[] }}
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
