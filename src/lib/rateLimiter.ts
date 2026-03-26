/**
 * Client-side Rate Limiter for UX
 *
 * IMPORTANT: This is purely for user experience (preventing accidental double-clicks,
 * providing immediate feedback). The REAL rate limiting happens server-side in
 * Edge Functions via `_shared/security.ts` with database-backed quotas.
 *
 * This client-side limiter is easily bypassed and should NOT be relied upon for security.
 */

interface Bucket {
    requests: number[];
    windowStart: number;
}

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    /** Display name for UX feedback */
    name?: string;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetMs: number;
    /** Suggested message for UI display */
    message?: string;
}

// In-memory store (resets on page reload - by design)
const rateLimitStore = new Map<string, Bucket>();

// Auto-cleanup stale entries every minute to prevent memory leak in SPA
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, bucket] of rateLimitStore.entries()) {
            if (now - bucket.windowStart > 5 * 60 * 1000) { // 5 minutes max
                rateLimitStore.delete(key);
            }
        }
    }, 60 * 1000);
}

/**
 * Rate limit configurations for different operation types.
 *
 * NOTE: These are more lenient than server-side limits since
 * they're purely for UX and preventing accidental abuse.
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // AI operations - debounce rapid clicks
    AI_OPERATION: {
        maxRequests: 5,
        windowMs: 60_000, // 5 per minute
        name: 'AI analysis',
    },
    // Standard API calls - generous for normal use
    STANDARD: {
        maxRequests: 30,
        windowMs: 60_000, // 30 per minute
        name: 'requests',
    },
    // Search operations - prevent spam
    SEARCH: {
        maxRequests: 10,
        windowMs: 10_000, // 10 per 10 seconds
        name: 'searches',
    },
    // Points/XP updates - prevent gaming
    POINTS_UPDATE: {
        maxRequests: 10,
        windowMs: 60_000, // 10 per minute
        name: 'point updates',
    },
    // Form submissions - prevent double-submit
    FORM_SUBMIT: {
        maxRequests: 3,
        windowMs: 5_000, // 3 per 5 seconds
        name: 'submissions',
    },
};

/**
 * Check if a request is allowed under rate limits (UX only).
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., 'ai_feedback', 'search')
 * @param config - Rate limit configuration
 * @returns Object with allowed status and metadata
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): RateLimitResult {
    const now = Date.now();
    const bucket = rateLimitStore.get(key) || { requests: [], windowStart: now };

    // Clean expired requests from the sliding window
    bucket.requests = bucket.requests.filter((timestamp) => now - timestamp < config.windowMs);

    const remaining = Math.max(0, config.maxRequests - bucket.requests.length);
    const allowed = remaining > 0;

    if (allowed) {
        bucket.requests.push(now);
        rateLimitStore.set(key, bucket);
    }

    // Calculate reset time
    const oldestRequest = bucket.requests[0];
    const resetMs = oldestRequest ? Math.max(0, config.windowMs - (now - oldestRequest)) : 0;

    return {
        allowed,
        remaining: allowed ? remaining - 1 : 0,
        resetMs,
        message: !allowed
            ? `Too many ${config.name || 'requests'}. Try again in ${Math.ceil(resetMs / 1000)}s`
            : undefined,
    };
}

/**
 * Wait until rate limit resets (for queued operations).
 */
export async function waitForRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): Promise<void> {
    const { allowed, resetMs } = checkRateLimit(key, config);
    if (!allowed && resetMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, resetMs));
    }
}

/**
 * Create a rate-limited version of an async function.
 * Throws RateLimitError if limit exceeded.
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    key: string,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const result = checkRateLimit(key, config);

        if (!result.allowed) {
            const error = new Error(result.message || 'Rate limit exceeded') as Error & {
                name: string;
                resetMs: number;
                remaining: number;
            };
            error.name = 'RateLimitError';
            error.resetMs = result.resetMs;
            error.remaining = result.remaining;
            throw error;
        }

        return fn(...args) as Promise<ReturnType<T>>;
    };
}

/**
 * Debounce function - delays execution until input stops.
 * Good for search inputs, autosave, etc.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        return new Promise((resolve, reject) => {
            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn(...args);
                    resolve(result as ReturnType<T>);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    };
}

/**
 * Throttle function - limits execution to once per interval.
 * Good for scroll handlers, resize events, etc.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit = 1000
): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let lastCall = 0;
    let lastResult: ReturnType<T> | undefined;

    return (...args: Parameters<T>): ReturnType<T> | undefined => {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            lastResult = fn(...args) as ReturnType<T>;
        }
        return lastResult;
    };
}

/**
 * Clear all rate limit data.
 * Call on logout or when user session ends.
 */
export function clearRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Get remaining requests for a key (for UI display).
 */
export function getRemainingRequests(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): number {
    const now = Date.now();
    const bucket = rateLimitStore.get(key);

    if (!bucket) return config.maxRequests;

    const validRequests = bucket.requests.filter((timestamp) => now - timestamp < config.windowMs);
    return Math.max(0, config.maxRequests - validRequests.length);
}

/**
 * Check if rate limit error (for error handling).
 */
export function isRateLimitError(error: unknown): error is Error & { resetMs: number } {
    return error instanceof Error && error.name === 'RateLimitError';
}
