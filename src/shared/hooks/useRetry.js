import { useState, useCallback, useRef } from 'react';

/**
 * Hook for executing async operations with automatic retry on failure.
 *
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @param {boolean} options.exponentialBackoff - Whether to use exponential backoff (default: true)
 * @param {Function} options.onRetry - Callback when a retry occurs
 * @param {Function} options.onError - Callback when all retries fail
 *
 * @returns {Object} - { execute, isLoading, error, retryCount, reset }
 */
export function useRetry(asyncFn, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);

      // Create abort controller for this execution
      abortControllerRef.current = new AbortController();

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Request aborted');
          }

          const result = await asyncFn(...args, abortControllerRef.current.signal);
          setIsLoading(false);
          return result;
        } catch (err) {
          // Don't retry on abort
          if (err.name === 'AbortError' || err.message === 'Request aborted') {
            setIsLoading(false);
            return null;
          }

          if (attempt < maxRetries) {
            const waitTime = exponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;

            setRetryCount(attempt + 1);
            onRetry?.(attempt + 1, err);

            await delay(waitTime);
          } else {
            // All retries exhausted
            setError(err);
            setIsLoading(false);
            onError?.(err);
            throw err;
          }
        }
      }
    },
    [asyncFn, maxRetries, retryDelay, exponentialBackoff, onRetry, onError]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    error,
    retryCount,
    reset,
    abort,
  };
}

/**
 * Simple wrapper for fetch with retry capability.
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Retry configuration
 * @returns {Promise} - Fetch result
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000 } = retryOptions;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
    }
  }
}
