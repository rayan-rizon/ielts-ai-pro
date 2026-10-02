import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression cover for the vocabulary translation request layer.
 *
 * Each vocabulary row asks for its own definition translation on mount, so a
 * 30-row page used to open 30 parallel requests to a rate-limited public API and
 * repeat all of them on the next reload. These tests pin the properties that
 * fixed it: one request per distinct key, a cache that survives a reload and is
 * written once per burst rather than once per row, a ceiling on concurrent
 * requests, and a time bound so a stalled request cannot hold a slot forever.
 */

const MODULE = '@/features/vocabulary/services/translateService';

function mockTranslationResponse(text: string) {
  return {
    ok: true,
    json: async () => ({
      responseStatus: 200,
      responseData: { translatedText: `translated:${text}` },
    }),
  };
}

/** Each test needs a fresh module so the in-memory cache starts empty. */
async function freshModule() {
  vi.resetModules();
  return import(MODULE);
}

describe('translateService - request coalescing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('issues one network request when many rows ask for the same definition', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { translateText } = await freshModule();

    // 30 cells mounting at once, all showing the same definition.
    const results = await Promise.all(
      Array.from({ length: 30 }, () => translateText('a small flying insect', 'es', 'en'))
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Set(results)).toEqual(new Set(['translated:a small flying insect']));
  });

  it('does not refetch a definition that is already cached', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { translateText } = await freshModule();

    await translateText('resilient', 'fr', 'en');
    await translateText('resilient', 'fr', 'en');
    await translateText('resilient', 'fr', 'en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps distinct definitions separate', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { translateText } = await freshModule();

    const [a, b] = await Promise.all([
      translateText('alpha', 'de', 'en'),
      translateText('beta', 'de', 'en'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(a).toBe('translated:alpha');
    expect(b).toBe('translated:beta');
  });

  it('does not let a stalled request starve the rows queued behind it', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(
        (url: string, init?: RequestInit) =>
          new Promise<any>((resolve, reject) => {
            const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
            if (text === 'stalled-0') {
              // Never settles on its own — only the abort signal can end it.
              init?.signal?.addEventListener('abort', () =>
                reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
              );
              return;
            }
            resolve(mockTranslationResponse(text));
          })
      );
      vi.stubGlobal('fetch', fetchMock);
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { translateText } = await freshModule();

      // One request that hangs, plus more than a full slot's worth behind it.
      const pending = Promise.all([
        translateText('stalled-0', 'fi', 'en'),
        ...Array.from({ length: 10 }, (_, i) => translateText(`ok-${i}`, 'fi', 'en')),
      ]);

      await vi.advanceTimersByTimeAsync(11_000);
      const results = await pending;

      // The stalled one falls back to its own text; the rest still resolve.
      expect(results[0]).toBe('stalled-0');
      expect(results.slice(1)).toEqual(Array.from({ length: 10 }, (_, i) => `translated:ok-${i}`));
    } finally {
      vi.useRealTimers();
    }
  });

  it('caps how many requests are open at the same time', async () => {
    let open = 0;
    let peak = 0;
    const release: Array<() => void> = [];

    const fetchMock = vi.fn(async (url: string) => {
      open += 1;
      peak = Math.max(peak, open);
      // Hold the request open until the test lets it finish.
      await new Promise<void>((resolve) => release.push(resolve));
      open -= 1;
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const { translateText } = await freshModule();

    const pending = Promise.all(
      Array.from({ length: 30 }, (_, i) => translateText(`word-${i}`, 'ja', 'en'))
    );

    // Drain: repeatedly let every currently-open request finish.
    for (let i = 0; i < 40 && release.length; i += 1) {
      release.splice(0).forEach((fn) => fn());
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    }

    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(30);
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });
});

describe('translateService - cache persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('serves a reload from localStorage without hitting the network', async () => {
    const firstFetch = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', firstFetch);

    const first = await freshModule();
    await first.translateText('ephemeral', 'it', 'en');
    expect(firstFetch).toHaveBeenCalledTimes(1);

    // Writes are coalesced, so take the barrier rather than sleeping.
    first.flushTranslationCache();

    // Simulate a page reload: new module instance, empty in-memory cache,
    // same localStorage.
    const secondFetch = vi.fn(async () => {
      throw new Error('a reload must not re-request a cached translation');
    });
    vi.stubGlobal('fetch', secondFetch);

    const second = await freshModule();
    const value = await second.translateText('ephemeral', 'it', 'en');

    expect(secondFetch).not.toHaveBeenCalled();
    expect(value).toBe('translated:ephemeral');
    expect(second.getCachedTranslation('ephemeral', 'it', 'en')).toBe('translated:ephemeral');
  });

  it('clearTranslationCache empties both memory and storage', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const mod = await freshModule();
    await mod.translateText('transient', 'ko', 'en');
    mod.flushTranslationCache();
    expect(mod.getCachedTranslation('transient', 'ko', 'en')).toBe('translated:transient');

    mod.clearTranslationCache();

    expect(mod.getCachedTranslation('transient', 'ko', 'en')).toBeNull();
    const reloaded = await freshModule();
    expect(reloaded.getCachedTranslation('transient', 'ko', 'en')).toBeNull();
  });

  it('coalesces a page of translations into a single storage write', async () => {
    // A loaded CI worker may exceed the real debounce window while draining
    // mocked requests. Keep the batch inside that window deliberately.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const fetchMock = vi.fn(async (url: string) => {
        const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
        return mockTranslationResponse(text) as any;
      });
      vi.stubGlobal('fetch', fetchMock);

      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const mod = await freshModule();

      // A full page of distinct rows resolving together.
      await Promise.all(
        Array.from({ length: 30 }, (_, i) => mod.translateText(`row-${i}`, 'nl', 'en'))
      );
      mod.flushTranslationCache();

      const cacheWrites = setItem.mock.calls.filter(([key]) =>
        String(key).includes('TranslationCache')
      );
      // Serialising the whole cache is O(cache size); doing it per row would be
      // 30 full rewrites on the main thread.
      expect(cacheWrites.length).toBeLessThanOrEqual(2);
      expect(mod.getCachedTranslation('row-29', 'nl', 'en')).toBe('translated:row-29');

      setItem.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes pending writes when the page is hidden', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const mod = await freshModule();
    await mod.translateText('closing', 'tr', 'en');

    // Nothing written yet — the debounce window is still open.
    window.dispatchEvent(new Event('pagehide'));

    const reloaded = await freshModule();
    expect(reloaded.getCachedTranslation('closing', 'tr', 'en')).toBe('translated:closing');
  });

  it('still resolves when localStorage throws, as in private mode', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const fetchMock = vi.fn(async (url: string) => {
      const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
      return mockTranslationResponse(text) as any;
    });
    vi.stubGlobal('fetch', fetchMock);

    const mod = await freshModule();
    await expect(mod.translateText('private', 'pt', 'en')).resolves.toBe('translated:private');

    getItem.mockRestore();
    setItem.mockRestore();
  });
});

describe('translateService - failure handling', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the original text on failure and does not cache it', async () => {
    const failing = vi.fn(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', failing);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const mod = await freshModule();
    await expect(mod.translateText('unreachable', 'ru', 'en')).resolves.toBe('unreachable');
    expect(mod.getCachedTranslation('unreachable', 'ru', 'en')).toBeNull();

    // A later attempt is free to succeed.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const text = decodeURIComponent(String(url).match(/q=([^&]*)/)![1]);
        return mockTranslationResponse(text) as any;
      })
    );
    await expect(mod.translateText('unreachable', 'ru', 'en')).resolves.toBe(
      'translated:unreachable'
    );
  });

  it('skips the network entirely when the target matches the source', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const mod = await freshModule();
    await expect(mod.translateText('unchanged', 'en', 'en')).resolves.toBe('unchanged');
    await expect(mod.translateText('', 'es', 'en')).resolves.toBe('');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
