import { useState, useEffect, useCallback, useRef } from 'react';
import { getFromCache, setInCache, CACHE_TTL, removeFromCache } from '@/lib/apiCache';

// Re-export cache utilities for convenience
export { removeFromCache, CACHE_TTL };

/**
 * Options for the useDataQuery hook
 */
export interface UseDataQueryOptions {
  /** Cache time-to-live in ms (default: 5 mins) */
  ttl?: number;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Dependencies that trigger a refetch (default: []) */
  dependencies?: unknown[];
  /** Return stale data while fetching fresh (default: true) */
  staleWhileRevalidate?: boolean;
  /** Refresh on tab focus (default: true) */
  revalidateOnFocus?: boolean;
  /** Refresh on network reconnect (default: true) */
  revalidateOnReconnect?: boolean;
}

/**
 * Return type for the useDataQuery hook
 */
export interface UseDataQueryResult<T> {
  /** The fetched data, or null if not yet loaded */
  data: T | null;
  /** Whether the initial fetch is in progress */
  loading: boolean;
  /** Error if the fetch failed */
  error: Error | null;
  /** Function to manually refetch the data */
  refetch: () => Promise<void>;
  /** Whether the current data is stale and being revalidated */
  isStale: boolean;
}

/**
 * Custom hook for data fetching with SWR-style caching.
 * Returns stale data immediately while revalidating in the background.
 *
 * @template T - The type of data returned by the fetcher
 * @param cacheKey - Unique key for caching the result
 * @param fetcher - Async function that returns the data
 * @param options - Hook options
 * @returns UseDataQueryResult<T>
 */
export function useDataQuery<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: UseDataQueryOptions = {}
): UseDataQueryResult<T> {
  const {
    ttl = CACHE_TTL.MEDIUM,
    enabled = true,
    dependencies = [],
    staleWhileRevalidate = true,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
  } = options;

  const [data, setData] = useState<T | null>(() => getFromCache<T>(cacheKey));
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const isRevalidatingRef = useRef<boolean>(false);
  const requestCounterRef = useRef<number>(0);

  const fetchData = useCallback(
    async (force: boolean = false): Promise<void> => {
      // Prevent duplicate revalidation requests
      if (isRevalidatingRef.current && !force) return;

      // Increment request counter for ordering — stale responses are discarded
      const thisRequest = ++requestCounterRef.current;

      const cached = getFromCache<T>(cacheKey);

      // SWR: Return stale data immediately, refresh in background
      if (cached !== null && !force && staleWhileRevalidate) {
        setData(cached);
        setLoading(false);
        setIsStale(true);

        // Background revalidation
        isRevalidatingRef.current = true;
        fetcher()
          .then((fresh) => {
            if (isMountedRef.current && thisRequest === requestCounterRef.current) {
              setInCache(cacheKey, fresh, ttl);
              setData(fresh);
              setIsStale(false);
            }
          })
          .catch((err) => {
            console.warn(`Background revalidation failed for ${cacheKey}:`, err);
          })
          .finally(() => {
            isRevalidatingRef.current = false;
          });
        return;
      }

      // No cache or force refresh - await fresh data
      if (!force && cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        if (isMountedRef.current && thisRequest === requestCounterRef.current) {
          setInCache(cacheKey, result, ttl);
          setData(result);
          setIsStale(false);
        }
      } catch (err) {
        console.error(`Error in useDataQuery (${cacheKey}):`, err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [cacheKey, fetcher, ttl, staleWhileRevalidate]
  );

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    if (enabled) {
      fetchData();
    }
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies, fetchData]);

  // Revalidate on tab focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData, revalidateOnFocus, enabled]);

  // Revalidate on network reconnect
  useEffect(() => {
    if (!revalidateOnReconnect || !enabled) return;

    const handleOnline = (): void => {
      fetchData(true);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData, revalidateOnReconnect, enabled]);

  const refetch = useCallback(async (): Promise<void> => {
    return fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch, isStale };
}

export default useDataQuery;
