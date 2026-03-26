import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Performance Tests
 * Tests for render performance, memory efficiency, and optimization patterns
 */

describe('Performance - Memoization', () => {
    // Simulating expensive computation
    const expensiveCalculation = (n: number): number => {
        let result = 0;
        for (let i = 0; i < n; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        return result;
    };

    // Memoization helper
    const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
        const cache = new Map<string, ReturnType<T>>();
        return ((...args: Parameters<T>) => {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn(...args);
            cache.set(key, result);
            return result;
        }) as T;
    };

    it('should cache expensive calculations', () => {
        const memoizedCalc = memoize(expensiveCalculation);

        // First call - calculates
        const start1 = performance.now();
        const result1 = memoizedCalc(10000);
        const time1 = performance.now() - start1;

        // Second call - from cache
        const start2 = performance.now();
        const result2 = memoizedCalc(10000);
        const time2 = performance.now() - start2;

        expect(result1).toBe(result2);
        expect(time2).toBeLessThan(time1);
    });

    it('should cache different arguments separately', () => {
        const memoizedCalc = memoize(expensiveCalculation);

        const result1 = memoizedCalc(100);
        const result2 = memoizedCalc(200);
        const result1Again = memoizedCalc(100);

        expect(result1Again).toBe(result1);
        expect(result1).not.toBe(result2);
    });
});

describe('Performance - Debouncing', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const debounce = <T extends (...args: any[]) => any>(
        fn: T,
        delay: number
    ): ((...args: Parameters<T>) => void) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    it('should only call function after delay', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 300);

        debouncedFn();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on rapid calls', () => {
        const fn = vi.fn();
        const debouncedFn = debounce(fn, 300);

        debouncedFn();
        vi.advanceTimersByTime(100);
        debouncedFn();
        vi.advanceTimersByTime(100);
        debouncedFn();
        vi.advanceTimersByTime(100);

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('Performance - Throttling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const throttle = <T extends (...args: any[]) => any>(
        fn: T,
        limit: number
    ): ((...args: Parameters<T>) => void) => {
        let inThrottle = false;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    it('should call function immediately on first call', () => {
        const fn = vi.fn();
        const throttledFn = throttle(fn, 300);

        throttledFn();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should limit calls within throttle period', () => {
        const fn = vi.fn();
        const throttledFn = throttle(fn, 300);

        throttledFn();
        throttledFn();
        throttledFn();

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
        const fn = vi.fn();
        const throttledFn = throttle(fn, 300);

        throttledFn();
        vi.advanceTimersByTime(300);
        throttledFn();

        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('Performance - Lazy Loading', () => {
    interface LazyModule<T> {
        loaded: boolean;
        value: T | null;
        load: () => Promise<T>;
    }

    const createLazyModule = <T>(loader: () => Promise<T>): LazyModule<T> => ({
        loaded: false,
        value: null,
        load: async function () {
            if (!this.loaded) {
                this.value = await loader();
                this.loaded = true;
            }
            return this.value as T;
        }
    });

    it('should not load until requested', () => {
        const loader = vi.fn().mockResolvedValue({ data: 'test' });
        const lazyModule = createLazyModule(loader);

        expect(lazyModule.loaded).toBe(false);
        expect(loader).not.toHaveBeenCalled();
    });

    it('should load once when requested', async () => {
        const loader = vi.fn().mockResolvedValue({ data: 'test' });
        const lazyModule = createLazyModule(loader);

        await lazyModule.load();
        await lazyModule.load(); // Second call

        expect(loader).toHaveBeenCalledTimes(1);
        expect(lazyModule.loaded).toBe(true);
    });
});

describe('Performance - Batch Processing', () => {
    const processBatch = <T, R>(
        items: T[],
        processor: (item: T) => R,
        batchSize: number
    ): R[][] => {
        const results: R[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            results.push(batch.map(processor));
        }
        return results;
    };

    it('should process items in batches', () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const results = processBatch(items, (n) => n * 2, 3);

        expect(results).toHaveLength(4);
        expect(results[0]).toEqual([2, 4, 6]);
        expect(results[1]).toEqual([8, 10, 12]);
    });

    it('should handle incomplete final batch', () => {
        const items = [1, 2, 3, 4, 5];
        const results = processBatch(items, (n) => n * 2, 3);

        expect(results).toHaveLength(2);
        expect(results[1]).toEqual([8, 10]);
    });
});

describe('Performance - Virtual Scrolling Calculation', () => {
    interface VirtualScrollState {
        containerHeight: number;
        itemHeight: number;
        totalItems: number;
        scrollTop: number;
    }

    const calculateVisibleRange = (state: VirtualScrollState) => {
        const startIndex = Math.floor(state.scrollTop / state.itemHeight);
        const visibleCount = Math.ceil(state.containerHeight / state.itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + 1, state.totalItems);

        return {
            startIndex,
            endIndex,
            visibleCount,
            offsetY: startIndex * state.itemHeight,
        };
    };

    it('should calculate initial visible range', () => {
        const state: VirtualScrollState = {
            containerHeight: 500,
            itemHeight: 50,
            totalItems: 1000,
            scrollTop: 0
        };

        const range = calculateVisibleRange(state);
        expect(range.startIndex).toBe(0);
        expect(range.visibleCount).toBe(10);
    });

    it('should calculate offset for scrolled position', () => {
        const state: VirtualScrollState = {
            containerHeight: 500,
            itemHeight: 50,
            totalItems: 1000,
            scrollTop: 250
        };

        const range = calculateVisibleRange(state);
        expect(range.startIndex).toBe(5);
        expect(range.offsetY).toBe(250);
    });

    it('should not exceed total items', () => {
        const state: VirtualScrollState = {
            containerHeight: 500,
            itemHeight: 50,
            totalItems: 10,
            scrollTop: 400
        };

        const range = calculateVisibleRange(state);
        expect(range.endIndex).toBeLessThanOrEqual(10);
    });
});

describe('Performance - Data Deduplication', () => {
    const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    };

    it('should remove duplicate items', () => {
        const items = [
            { id: '1', name: 'A' },
            { id: '2', name: 'B' },
            { id: '1', name: 'A duplicate' },
            { id: '3', name: 'C' },
        ];

        const unique = deduplicateById(items);
        expect(unique).toHaveLength(3);
    });

    it('should keep first occurrence', () => {
        const items = [
            { id: '1', name: 'First' },
            { id: '1', name: 'Second' },
        ];

        const unique = deduplicateById(items);
        expect(unique[0].name).toBe('First');
    });
});

describe('Performance - Request Coalescing', () => {
    const createRequestCoalescer = <T>() => {
        const pendingRequests = new Map<string, Promise<T>>();

        return async (key: string, fetcher: () => Promise<T>): Promise<T> => {
            if (pendingRequests.has(key)) {
                return pendingRequests.get(key)!;
            }

            const promise = fetcher().finally(() => {
                pendingRequests.delete(key);
            });

            pendingRequests.set(key, promise);
            return promise;
        };
    };

    it('should coalesce concurrent requests', async () => {
        const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
        const coalesce = createRequestCoalescer();

        const [result1, result2] = await Promise.all([
            coalesce('key1', fetcher),
            coalesce('key1', fetcher),
        ]);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(result1).toBe(result2);
    });

    it('should make separate requests for different keys', async () => {
        const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
        const coalesce = createRequestCoalescer();

        await Promise.all([
            coalesce('key1', fetcher),
            coalesce('key2', fetcher),
        ]);

        expect(fetcher).toHaveBeenCalledTimes(2);
    });
});
