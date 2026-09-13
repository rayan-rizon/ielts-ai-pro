import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThrottledWebStorage } from '@/lib/throttledWebStorage';

const KEY = 'listening-test-store';

describe('createThrottledWebStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces a burst of writes into a single storage commit', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    // Stand-in for the 1Hz timer tick + ~4Hz audio timeupdate during a test.
    for (let i = 0; i < 100; i += 1) {
      storage.setItem(KEY, JSON.stringify({ audioCurrentTime: i }));
    }
    expect(setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.sessionStorage.getItem(KEY))).toEqual({ audioCurrentTime: 99 });
    setItem.mockRestore();
  });

  it('reads back the pending value before it is committed', () => {
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    storage.setItem(KEY, 'pending');

    // Rehydration must never see a stale slice just because the write is queued.
    expect(storage.getItem(KEY)).toBe('pending');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();

    vi.advanceTimersByTime(5000);
    expect(storage.getItem(KEY)).toBe('pending');
  });

  it('falls through to the underlying storage when nothing is pending', () => {
    window.sessionStorage.setItem(KEY, 'committed');
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    expect(storage.getItem(KEY)).toBe('committed');
    expect(storage.getItem('absent')).toBeNull();
  });

  it('does not resurrect a cleared key from a queued write', () => {
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    storage.setItem(KEY, 'in-flight');
    storage.removeItem(KEY);
    vi.advanceTimersByTime(10000);

    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(storage.getItem(KEY)).toBeNull();
  });

  it('flushes synchronously on pagehide so a discarded tab keeps its progress', () => {
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    storage.setItem(KEY, 'latest');
    window.dispatchEvent(new Event('pagehide'));

    expect(window.sessionStorage.getItem(KEY)).toBe('latest');
  });

  it('starts a fresh window for writes that arrive after a commit', () => {
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    storage.setItem(KEY, 'first');
    vi.advanceTimersByTime(5000);
    expect(window.sessionStorage.getItem(KEY)).toBe('first');

    storage.setItem(KEY, 'second');
    expect(window.sessionStorage.getItem(KEY)).toBe('first');
    vi.advanceTimersByTime(5000);
    expect(window.sessionStorage.getItem(KEY)).toBe('second');
  });

  it('keeps the store usable when storage itself throws', () => {
    const storage = createThrottledWebStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    }, {});

    expect(() => storage.setItem(KEY, 'x')).not.toThrow();
    expect(storage.getItem(KEY)).toBe('x'); // pending value still readable
    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
    expect(() => storage.removeItem(KEY)).not.toThrow();
  });

  it('swallows quota errors raised on commit', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const storage = createThrottledWebStorage(() => window.sessionStorage, { intervalMs: 5000 });

    storage.setItem(KEY, 'x');
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    setItem.mockRestore();
  });
});
