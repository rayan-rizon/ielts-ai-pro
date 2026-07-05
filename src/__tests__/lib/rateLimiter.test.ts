import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RATE_LIMITS,
  checkRateLimit,
  waitForRateLimit,
  withRateLimit,
  debounce,
  throttle,
  clearRateLimits,
  getRemainingRequests,
  isRateLimitError,
} from '@/lib/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have expected rate limit configurations', () => {
      expect(RATE_LIMITS.AI_OPERATION).toBeDefined();
      expect(RATE_LIMITS.STANDARD).toBeDefined();
      expect(RATE_LIMITS.SEARCH).toBeDefined();
      expect(RATE_LIMITS.FORM_SUBMIT).toBeDefined();
    });

    it('should have valid maxRequests and windowMs values', () => {
      Object.values(RATE_LIMITS).forEach((config) => {
        expect(config.maxRequests).toBeGreaterThan(0);
        expect(config.windowMs).toBeGreaterThan(0);
      });
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const config = { maxRequests: 3, windowMs: 1000 };

      const result1 = checkRateLimit('test-key', config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = checkRateLimit('test-key', config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = checkRateLimit('test-key', config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should deny requests over the limit', () => {
      const config = { maxRequests: 2, windowMs: 1000 };

      checkRateLimit('over-limit', config);
      checkRateLimit('over-limit', config);

      const result = checkRateLimit('over-limit', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toContain('Try again');
    });

    it('should reset after window expires', () => {
      const config = { maxRequests: 1, windowMs: 1000 };

      checkRateLimit('reset-key', config);
      expect(checkRateLimit('reset-key', config).allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1001);

      const result = checkRateLimit('reset-key', config);
      expect(result.allowed).toBe(true);
    });

    it('should use separate buckets for different keys', () => {
      const config = { maxRequests: 1, windowMs: 1000 };

      checkRateLimit('key-a', config);
      expect(checkRateLimit('key-a', config).allowed).toBe(false);

      // Different key should have its own bucket
      expect(checkRateLimit('key-b', config).allowed).toBe(true);
    });

    it('should provide reset time when rate limited', () => {
      const config = { maxRequests: 1, windowMs: 5000 };

      checkRateLimit('reset-time', config);
      const result = checkRateLimit('reset-time', config);

      expect(result.allowed).toBe(false);
      expect(result.resetMs).toBeGreaterThan(0);
      expect(result.resetMs).toBeLessThanOrEqual(5000);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return max requests for new keys', () => {
      const config = { maxRequests: 10, windowMs: 1000 };
      expect(getRemainingRequests('new-key', config)).toBe(10);
    });

    it('should return correct remaining after some requests', () => {
      const config = { maxRequests: 5, windowMs: 1000 };

      checkRateLimit('remaining-key', config);
      checkRateLimit('remaining-key', config);

      expect(getRemainingRequests('remaining-key', config)).toBe(3);
    });
  });

  describe('clearRateLimits', () => {
    it('should reset all rate limit buckets', () => {
      const config = { maxRequests: 1, windowMs: 1000 };

      checkRateLimit('clear-key-1', config);
      checkRateLimit('clear-key-2', config);

      clearRateLimits();

      expect(checkRateLimit('clear-key-1', config).allowed).toBe(true);
      expect(checkRateLimit('clear-key-2', config).allowed).toBe(true);
    });
  });

  describe('withRateLimit', () => {
    it('should call the wrapped function when under limit', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const config = { maxRequests: 5, windowMs: 1000 };
      const wrapped = withRateLimit(mockFn, 'wrap-test', config);

      const result = await wrapped();

      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should throw when rate limited', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const config = { maxRequests: 1, windowMs: 1000 };
      const wrapped = withRateLimit(mockFn, 'wrap-limit', config);

      await wrapped(); // First call succeeds

      await expect(wrapped()).rejects.toThrow();
    });

    it('should pass arguments to wrapped function', async () => {
      const mockFn = vi.fn().mockImplementation((a, b) => Promise.resolve(a + b));
      const config = { maxRequests: 5, windowMs: 1000 };
      const wrapped = withRateLimit(mockFn, 'wrap-args', config);

      const result = await wrapped(1, 2);

      expect(mockFn).toHaveBeenCalledWith(1, 2);
      expect(result).toBe(3);
    });
  });

  describe('isRateLimitError', () => {
    it('should identify rate limit errors', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const config = { maxRequests: 1, windowMs: 1000 };
      const wrapped = withRateLimit(mockFn, 'error-test', config);

      await wrapped();

      try {
        await wrapped();
      } catch (error) {
        expect(isRateLimitError(error)).toBe(true);
      }
    });

    it('should return false for other errors', () => {
      expect(isRateLimitError(new Error('Generic error'))).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError('string error')).toBe(false);
    });
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    const debounced = debounce(mockFn, 100);

    debounced();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    await Promise.resolve(); // Let promises resolve

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls on rapid invocations', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    const debounced = debounce(mockFn, 100);

    debounced();
    debounced();
    debounced();

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use the last call arguments', async () => {
    const mockFn = vi.fn().mockImplementation((x) => Promise.resolve(x));
    const debounced = debounce(mockFn, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockFn).toHaveBeenCalledWith('third');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    const throttled = throttle(mockFn, 100);

    const result = throttled();

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('should skip calls within the limit interval', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    const throttled = throttle(mockFn, 100);

    throttled();
    throttled();
    throttled();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should allow calls after the limit interval', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    const throttled = throttle(mockFn, 100);

    throttled();
    vi.advanceTimersByTime(101);
    throttled();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should return cached result during throttle period', () => {
    let counter = 0;
    const mockFn = vi.fn().mockImplementation(() => ++counter);
    const throttled = throttle(mockFn, 100);

    const result1 = throttled();
    const result2 = throttled();

    expect(result1).toBe(1);
    expect(result2).toBe(1); // Cached result
  });
});

describe('waitForRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearRateLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve immediately when not rate limited', async () => {
    const config = { maxRequests: 5, windowMs: 1000 };

    const promise = waitForRateLimit('wait-test', config);
    vi.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should wait when rate limited', async () => {
    const config = { maxRequests: 1, windowMs: 100 };

    checkRateLimit('wait-limited', config); // Exhaust limit

    const promise = waitForRateLimit('wait-limited', config);

    // Should not resolve immediately
    vi.advanceTimersByTime(50);

    // Should resolve after window expires
    vi.advanceTimersByTime(51);
    await expect(promise).resolves.toBeUndefined();
  });
});
