import { describe, it, expect, vi } from 'vitest';

/**
 * Memory Management Tests
 * Tests for memory efficiency patterns and leak prevention
 */

describe('Memory - Object Pooling', () => {
    class ObjectPool<T> {
        private pool: T[] = [];
        private factory: () => T;
        private reset: (obj: T) => void;

        constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 0) {
            this.factory = factory;
            this.reset = reset;
            for (let i = 0; i < initialSize; i++) {
                this.pool.push(factory());
            }
        }

        acquire(): T {
            return this.pool.length > 0 ? this.pool.pop()! : this.factory();
        }

        release(obj: T): void {
            this.reset(obj);
            this.pool.push(obj);
        }

        get size(): number {
            return this.pool.length;
        }
    }

    it('should reuse objects from pool', () => {
        const factory = vi.fn(() => ({ value: 0 }));
        const pool = new ObjectPool(factory, (obj) => { obj.value = 0; }, 5);

        // Initial pool size
        expect(pool.size).toBe(5);
        expect(factory).toHaveBeenCalledTimes(5);

        // Acquire doesn't create new object
        const obj1 = pool.acquire();
        expect(pool.size).toBe(4);
        expect(factory).toHaveBeenCalledTimes(5);

        // Release returns to pool
        pool.release(obj1);
        expect(pool.size).toBe(5);
    });

    it('should create new objects when pool is empty', () => {
        const factory = vi.fn(() => ({ value: 0 }));
        const pool = new ObjectPool(factory, (obj) => { obj.value = 0; }, 0);

        const obj = pool.acquire();
        expect(factory).toHaveBeenCalledTimes(1);
        expect(obj).toBeDefined();
    });
});

describe('Memory - WeakMap for Object Metadata', () => {
    it('should store metadata without preventing garbage collection', () => {
        const metadata = new WeakMap<object, { timestamp: number }>();

        let obj: object | null = { id: 1 };
        metadata.set(obj, { timestamp: Date.now() });

        expect(metadata.get(obj!)).toBeDefined();

        // In real scenario, setting obj to null would allow GC
        // WeakMap doesn't prevent this
        obj = null;
    });

    it('should support custom key objects', () => {
        const cache = new WeakMap<object, string>();
        const key1 = { type: 'user' };
        const key2 = { type: 'session' };

        cache.set(key1, 'user-data');
        cache.set(key2, 'session-data');

        expect(cache.get(key1)).toBe('user-data');
        expect(cache.get(key2)).toBe('session-data');
    });
});

describe('Memory - Cache Eviction', () => {
    class LRUCache<K, V> {
        private cache = new Map<K, V>();
        private maxSize: number;

        constructor(maxSize: number) {
            this.maxSize = maxSize;
        }

        get(key: K): V | undefined {
            const value = this.cache.get(key);
            if (value !== undefined) {
                // Move to end (most recently used)
                this.cache.delete(key);
                this.cache.set(key, value);
            }
            return value;
        }

        set(key: K, value: V): void {
            if (this.cache.has(key)) {
                this.cache.delete(key);
            } else if (this.cache.size >= this.maxSize) {
                // Remove oldest (first) entry
                const firstKey = this.cache.keys().next().value;
                if (firstKey !== undefined) {
                    this.cache.delete(firstKey);
                }
            }
            this.cache.set(key, value);
        }

        get size(): number {
            return this.cache.size;
        }
    }

    it('should evict oldest entries when full', () => {
        const cache = new LRUCache<string, number>(3);

        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        cache.set('d', 4); // Should evict 'a'

        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('d')).toBe(4);
        expect(cache.size).toBe(3);
    });

    it('should update order on access', () => {
        const cache = new LRUCache<string, number>(3);

        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);

        cache.get('a'); // Move 'a' to most recent
        cache.set('d', 4); // Should evict 'b' now

        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBeUndefined();
    });
});

describe('Memory - Event Listener Cleanup', () => {
    it('should track and cleanup listeners', () => {
        class EventManager {
            private listeners: Map<string, Set<() => void>> = new Map();

            on(event: string, callback: () => void): void {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, new Set());
                }
                this.listeners.get(event)!.add(callback);
            }

            off(event: string, callback: () => void): void {
                this.listeners.get(event)?.delete(callback);
            }

            offAll(event: string): void {
                this.listeners.delete(event);
            }

            getListenerCount(event: string): number {
                return this.listeners.get(event)?.size || 0;
            }

            cleanup(): void {
                this.listeners.clear();
            }
        }

        const manager = new EventManager();
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        manager.on('test', callback1);
        manager.on('test', callback2);
        expect(manager.getListenerCount('test')).toBe(2);

        manager.off('test', callback1);
        expect(manager.getListenerCount('test')).toBe(1);

        manager.cleanup();
        expect(manager.getListenerCount('test')).toBe(0);
    });
});

describe('Memory - Subscription Cleanup', () => {
    interface Subscription {
        unsubscribe: () => void;
    }

    class SubscriptionManager {
        private subscriptions: Subscription[] = [];

        add(subscription: Subscription): void {
            this.subscriptions.push(subscription);
        }

        cleanup(): void {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions = [];
        }

        get count(): number {
            return this.subscriptions.length;
        }
    }

    it('should cleanup all subscriptions', () => {
        const manager = new SubscriptionManager();
        const unsubscribe1 = vi.fn();
        const unsubscribe2 = vi.fn();

        manager.add({ unsubscribe: unsubscribe1 });
        manager.add({ unsubscribe: unsubscribe2 });
        expect(manager.count).toBe(2);

        manager.cleanup();

        expect(unsubscribe1).toHaveBeenCalledTimes(1);
        expect(unsubscribe2).toHaveBeenCalledTimes(1);
        expect(manager.count).toBe(0);
    });
});

describe('Memory - Data Pagination', () => {
    interface PaginatedData<T> {
        items: T[];
        hasMore: boolean;
        cursor: string | null;
    }

    const paginate = <T>(
        allItems: T[],
        pageSize: number,
        cursor: number = 0
    ): PaginatedData<T> => {
        const startIndex = cursor;
        const endIndex = Math.min(startIndex + pageSize, allItems.length);
        const items = allItems.slice(startIndex, endIndex);
        const hasMore = endIndex < allItems.length;

        return {
            items,
            hasMore,
            cursor: hasMore ? String(endIndex) : null,
        };
    };

    it('should return first page', () => {
        const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result = paginate(items, 3, 0);

        expect(result.items).toEqual([1, 2, 3]);
        expect(result.hasMore).toBe(true);
        expect(result.cursor).toBe('3');
    });

    it('should return last page without more', () => {
        const items = [1, 2, 3, 4, 5];
        const result = paginate(items, 3, 3);

        expect(result.items).toEqual([4, 5]);
        expect(result.hasMore).toBe(false);
        expect(result.cursor).toBeNull();
    });
});

describe('Memory - String Interning', () => {
    const stringInterner = () => {
        const interned = new Map<string, string>();

        return {
            intern: (str: string): string => {
                if (interned.has(str)) {
                    return interned.get(str)!;
                }
                interned.set(str, str);
                return str;
            },
            size: () => interned.size,
            has: (str: string) => interned.has(str),
        };
    };

    it('should return same reference for identical strings', () => {
        const interner = stringInterner();

        const str1 = interner.intern('hello');
        const str2 = interner.intern('hello');

        expect(str1).toBe(str2);
        expect(interner.size()).toBe(1);
    });

    it('should store different strings separately', () => {
        const interner = stringInterner();

        interner.intern('hello');
        interner.intern('world');

        expect(interner.size()).toBe(2);
    });
});
