import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FORCE_REFRESH_KEY,
  RELOAD_LOOP_WINDOW_MS,
  isChunkLoadError,
  recoverFromChunkLoadError,
  resetChunkRecoveryForTests,
} from '@/lib/chunkLoadRecovery';

describe('isChunkLoadError', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://example.test/assets/dashboard.js',
    'Importing a module script failed.',
    'error loading dynamically imported module',
    'Unable to preload CSS for /assets/Dashboard-abc.css',
  ])('recognises a stale dynamic import: %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('does not reload the app for an ordinary route TypeError', () => {
    expect(
      isChunkLoadError(new TypeError("Cannot read properties of null (reading 'useRef')"))
    ).toBe(false);
  });
});

describe('recoverFromChunkLoadError', () => {
  const stale = (name) =>
    new TypeError(`Failed to fetch dynamically imported module: /assets/${name}-old.js`);
  const memoryStorage = () => {
    const values = new Map();
    return {
      getItem: (key) => (values.has(key) ? values.get(key) : null),
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    };
  };

  beforeEach(() => {
    resetChunkRecoveryForTests();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('reloads once when several chunks of an old deployment fail together', () => {
    // After login the dashboard route asks for Dashboard, UserSidebar,
    // PaidFeatureGate… at once; every one 404s on the new deployment.
    const storage = memoryStorage();
    const reload = vi.fn();
    const now = 1_000_000;
    const results = ['Dashboard', 'UserSidebar', 'PaidFeatureGate', 'Resource'].map((name) =>
      recoverFromChunkLoadError(stale(name), { storage, reload, now })
    );

    // None of them may fall through to the 500 page while the reload runs.
    expect(results).toEqual([true, true, true, true]);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.getItem(FORCE_REFRESH_KEY)).toBe(String(now));
  });

  it('shows the real error when the fresh page still cannot load a chunk', () => {
    const storage = memoryStorage();
    storage.setItem(FORCE_REFRESH_KEY, '1000000');
    const reload = vi.fn();
    expect(
      recoverFromChunkLoadError(stale('Dashboard'), { storage, reload, now: 1_000_000 + 5_000 })
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('recovers again for a later deployment in the same tab', () => {
    const storage = memoryStorage();
    storage.setItem(FORCE_REFRESH_KEY, '1000000');
    const reload = vi.fn();
    expect(
      recoverFromChunkLoadError(stale('Dashboard'), {
        storage,
        reload,
        now: 1_000_000 + RELOAD_LOOP_WINDOW_MS + 1,
      })
    ).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('ignores the boolean flag older bundles left in the tab', () => {
    const storage = memoryStorage();
    storage.setItem(FORCE_REFRESH_KEY, 'true');
    const reload = vi.fn();
    expect(recoverFromChunkLoadError(stale('Dashboard'), { storage, reload, now: 1_000_000 })).toBe(
      true
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads for an ordinary error', () => {
    const reload = vi.fn();
    expect(
      recoverFromChunkLoadError(new TypeError('x is not a function'), {
        storage: memoryStorage(),
        reload,
      })
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
