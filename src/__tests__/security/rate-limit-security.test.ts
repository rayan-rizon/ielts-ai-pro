import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    checkRateLimit,
    RATE_LIMITS,
    clearRateLimits,
    withRateLimit,
    isRateLimitError,
} from '@/lib/rateLimiter';

/**
 * Rate Limiting Security Tests
 * Verify that rate limiting properly protects against abuse scenarios
 */

describe('Rate Limiting Security', () => {
    beforeEach(() => {
        clearRateLimits();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('AI Operation Protection', () => {
        it('should enforce AI operation rate limits', () => {
            const { maxRequests } = RATE_LIMITS.AI_OPERATION;

            // Use up all allowed requests
            for (let i = 0; i < maxRequests; i++) {
                const result = checkRateLimit('ai-abuse-test', RATE_LIMITS.AI_OPERATION);
                expect(result.allowed).toBe(true);
            }

            // Next request should be denied
            const deniedResult = checkRateLimit('ai-abuse-test', RATE_LIMITS.AI_OPERATION);
            expect(deniedResult.allowed).toBe(false);
            expect(deniedResult.message).toContain('AI');
        });

        it('should recover after window expires', () => {
            const config = RATE_LIMITS.AI_OPERATION;

            // Exhaust the limit
            for (let i = 0; i < config.maxRequests; i++) {
                checkRateLimit('ai-recovery', config);
            }

            expect(checkRateLimit('ai-recovery', config).allowed).toBe(false);

            // Advance time past window
            vi.advanceTimersByTime(config.windowMs + 100);

            expect(checkRateLimit('ai-recovery', config).allowed).toBe(true);
        });
    });

    describe('Form Submission Protection', () => {
        it('should prevent form spam', () => {
            const config = RATE_LIMITS.FORM_SUBMIT;

            // Rapid submissions
            for (let i = 0; i < config.maxRequests; i++) {
                expect(checkRateLimit('form-spam', config).allowed).toBe(true);
            }

            // Additional submissions blocked
            expect(checkRateLimit('form-spam', config).allowed).toBe(false);
        });

        it('should have short window for form submissions', () => {
            expect(RATE_LIMITS.FORM_SUBMIT.windowMs).toBeLessThanOrEqual(10000);
        });
    });

    describe('Search Abuse Prevention', () => {
        it('should limit search requests', () => {
            const config = RATE_LIMITS.SEARCH;

            for (let i = 0; i < config.maxRequests; i++) {
                checkRateLimit('search-abuse', config);
            }

            expect(checkRateLimit('search-abuse', config).allowed).toBe(false);
        });
    });

    describe('Points Update Gaming Prevention', () => {
        it('should limit point update requests', () => {
            const config = RATE_LIMITS.POINTS_UPDATE;

            for (let i = 0; i < config.maxRequests; i++) {
                checkRateLimit('points-gaming', config);
            }

            const result = checkRateLimit('points-gaming', config);
            expect(result.allowed).toBe(false);
            expect(result.message).toContain('point');
        });
    });

    describe('Rapid Request Flooding', () => {
        it('should handle burst of rapid requests', () => {
            const config = { maxRequests: 10, windowMs: 1000 };
            let allowed = 0;
            let denied = 0;

            // Simulate 100 rapid requests
            for (let i = 0; i < 100; i++) {
                const result = checkRateLimit('flood-test', config);
                if (result.allowed) allowed++;
                else denied++;
            }

            expect(allowed).toBe(config.maxRequests);
            expect(denied).toBe(90);
        });

        it('should count all requests in sliding window', () => {
            const config = { maxRequests: 5, windowMs: 1000 };

            // Make 3 requests
            for (let i = 0; i < 3; i++) {
                checkRateLimit('sliding-window', config);
            }

            // Advance half the window
            vi.advanceTimersByTime(500);

            // Make 2 more requests (should work - 5 total in window)
            expect(checkRateLimit('sliding-window', config).allowed).toBe(true);
            expect(checkRateLimit('sliding-window', config).allowed).toBe(true);

            // 6th request should be denied
            expect(checkRateLimit('sliding-window', config).allowed).toBe(false);

            // After first 3 expire, should allow again
            vi.advanceTimersByTime(501);
            expect(checkRateLimit('sliding-window', config).allowed).toBe(true);
        });
    });

    describe('Multi-key Isolation', () => {
        it('should maintain separate limits per key', () => {
            const config = { maxRequests: 2, windowMs: 1000 };

            // Exhaust limit for user A
            checkRateLimit('user-a', config);
            checkRateLimit('user-a', config);
            expect(checkRateLimit('user-a', config).allowed).toBe(false);

            // User B should still have their own quota
            expect(checkRateLimit('user-b', config).allowed).toBe(true);
            expect(checkRateLimit('user-b', config).allowed).toBe(true);
            expect(checkRateLimit('user-b', config).allowed).toBe(false);

            // User C unaffected
            expect(checkRateLimit('user-c', config).allowed).toBe(true);
        });
    });

    describe('Rate Limit Error Handling', () => {
        it('should throw identifiable rate limit errors', async () => {
            const config = { maxRequests: 1, windowMs: 1000 };
            const mockFn = vi.fn().mockResolvedValue('success');
            const wrapped = withRateLimit(mockFn, 'error-handling', config);

            // First call succeeds
            await wrapped();

            // Second call should throw a rate limit error
            try {
                await wrapped();
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(isRateLimitError(error)).toBe(true);
                expect((error as any).resetMs).toBeDefined();
            }
        });

        it('should provide accurate reset time in error', async () => {
            const config = { maxRequests: 1, windowMs: 5000 };
            const mockFn = vi.fn().mockResolvedValue('success');
            const wrapped = withRateLimit(mockFn, 'reset-time-error', config);

            await wrapped();

            // Advance 2 seconds
            vi.advanceTimersByTime(2000);

            try {
                await wrapped();
            } catch (error) {
                const resetMs = (error as any).resetMs;
                // Should have ~3 seconds left (5000 - 2000)
                expect(resetMs).toBeLessThanOrEqual(3100);
                expect(resetMs).toBeGreaterThanOrEqual(2900);
            }
        });
    });

    describe('Clear Rate Limits', () => {
        it('should completely reset all limits', () => {
            const config = { maxRequests: 1, windowMs: 60000 };

            // Exhaust multiple keys
            checkRateLimit('clear-1', config);
            checkRateLimit('clear-2', config);
            checkRateLimit('clear-3', config);

            // All should be blocked
            expect(checkRateLimit('clear-1', config).allowed).toBe(false);
            expect(checkRateLimit('clear-2', config).allowed).toBe(false);
            expect(checkRateLimit('clear-3', config).allowed).toBe(false);

            // Clear all limits
            clearRateLimits();

            // All should be allowed again
            expect(checkRateLimit('clear-1', config).allowed).toBe(true);
            expect(checkRateLimit('clear-2', config).allowed).toBe(true);
            expect(checkRateLimit('clear-3', config).allowed).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero max requests config', () => {
            const config = { maxRequests: 0, windowMs: 1000 };
            expect(checkRateLimit('zero-limit', config).allowed).toBe(false);
        });

        it('should handle very small window', () => {
            const config = { maxRequests: 1, windowMs: 1 };

            checkRateLimit('tiny-window', config);
            expect(checkRateLimit('tiny-window', config).allowed).toBe(false);

            vi.advanceTimersByTime(2);
            expect(checkRateLimit('tiny-window', config).allowed).toBe(true);
        });

        it('should handle empty key', () => {
            const config = { maxRequests: 1, windowMs: 1000 };
            const result = checkRateLimit('', config);
            expect(result).toBeDefined();
            expect(typeof result.allowed).toBe('boolean');
        });
    });
});
