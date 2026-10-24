import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('@/utils/api', () => ({ callEdgeFunction: (...args) => mocked.call(...args) }));

import {
  defineWord,
  getBlockedSeconds,
  getCachedCard,
  getLatestQuota,
  resetDefineState,
  resolveDefineLanguage,
  VocabDefineError,
} from '@/features/vocabulary/services/vocabDefineService';

const CARD = { word: 'mitigate', meaning: 'To make less serious.', examples: ['x'] };
const ok = (card = CARD, extra = {}) => ({
  state: 'complete',
  result: card,
  source: 'generated',
  remainingDailyQuota: 20,
  quotaResetsAt: '2026-10-25T00:00:00Z',
  ...extra,
});
const failure = (status, details = {}, extra = {}) =>
  Object.assign(new Error(details.error || `HTTP ${status}`), { status, details, ...extra });

beforeEach(() => {
  resetDefineState();
  mocked.call.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('defineWord', () => {
  it('sends the word, sense and language and returns the card with the quota', async () => {
    mocked.call.mockResolvedValue(ok());
    const result = await defineWord('  Mitigate ', { hint: 'make less bad', language: 'bn' });
    expect(mocked.call).toHaveBeenCalledWith(
      'vocab-define',
      expect.objectContaining({ word: 'Mitigate', hint: 'make less bad', language: 'bn' })
    );
    expect(mocked.call.mock.calls[0][1].requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result).toMatchObject({ card: CARD, source: 'generated', remainingDailyQuota: 20 });
    expect(getLatestQuota()).toMatchObject({ remaining: 20 });
  });

  it('never asks twice for the same card', async () => {
    mocked.call.mockResolvedValue(ok());
    await defineWord('mitigate', { language: 'bn' });
    const again = await defineWord('MITIGATE', { language: 'bn' });
    expect(mocked.call).toHaveBeenCalledTimes(1);
    expect(again.source).toBe('local');
    expect(getCachedCard('mitigate', { language: 'bn' })).toEqual(CARD);
  });

  it('treats language and saved sense as part of the card', async () => {
    mocked.call.mockResolvedValue(ok());
    await defineWord('bank', { language: 'bn' });
    await defineWord('bank', { language: 'hi' });
    await defineWord('bank', { language: 'bn', hint: 'side of a river' });
    expect(mocked.call).toHaveBeenCalledTimes(3);
  });

  it('shares one request between concurrent callers', async () => {
    let finish;
    mocked.call.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const first = defineWord('mitigate');
    const second = defineWord('mitigate');
    finish(ok());
    await Promise.all([first, second]);
    expect(mocked.call).toHaveBeenCalledTimes(1);
  });

  it('keeps cards in localStorage for the next visit', async () => {
    vi.useFakeTimers();
    mocked.call.mockResolvedValue(ok());
    await defineWord('mitigate', { language: 'bn' });
    await vi.advanceTimersByTimeAsync(300);
    const saved = JSON.parse(localStorage.getItem('vocabDefineCache:v1'));
    expect(saved).toHaveLength(1);
    expect(saved[0][0]).toBe('mitigate||bn');
  });

  it('rejects an empty entry without calling the server', async () => {
    await expect(defineWord('   ')).rejects.toMatchObject({ kind: 'invalid' });
    expect(mocked.call).not.toHaveBeenCalled();
  });

  it('rejects an empty server answer instead of caching it', async () => {
    mocked.call.mockResolvedValue({ state: 'complete', result: {} });
    await expect(defineWord('mitigate')).rejects.toMatchObject({ kind: 'unavailable' });
    expect(getCachedCard('mitigate')).toBeNull();
  });
});

describe('server refusals', () => {
  it('stops sending requests during a burst wait, then resumes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
    mocked.call.mockRejectedValueOnce(
      failure(429, { error: 'slow down', rateLimitType: 'burst', retryAfterSeconds: 20 })
    );
    await expect(defineWord('mitigate')).rejects.toMatchObject({
      kind: 'burst',
      retryAfterSeconds: 20,
    });
    expect(getBlockedSeconds()).toBe(20);

    // Another word, inside the wait: refused locally, no request leaves the browser.
    await expect(defineWord('ameliorate')).rejects.toMatchObject({ kind: 'burst' });
    expect(mocked.call).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-10-24T10:00:21Z'));
    expect(getBlockedSeconds()).toBe(0);
    mocked.call.mockResolvedValueOnce(ok());
    await expect(defineWord('ameliorate')).resolves.toBeTruthy();
    expect(mocked.call).toHaveBeenCalledTimes(2);
  });

  it('serves a card already in the cache even while blocked', async () => {
    mocked.call.mockResolvedValueOnce(ok());
    await defineWord('mitigate');
    mocked.call.mockRejectedValueOnce(
      failure(429, { rateLimitType: 'quota', retryAfterSeconds: 3600 })
    );
    await expect(defineWord('other')).rejects.toMatchObject({ kind: 'quota' });
    await expect(defineWord('mitigate')).resolves.toMatchObject({ source: 'local' });
  });

  it('records a spent daily allowance', async () => {
    mocked.call.mockRejectedValue(
      failure(429, {
        rateLimitType: 'quota',
        retryAfterSeconds: 7200,
        quotaResetsAt: '2026-10-25T00:00:00Z',
      })
    );
    await expect(defineWord('mitigate')).rejects.toMatchObject({
      kind: 'quota',
      quotaResetsAt: '2026-10-25T00:00:00Z',
    });
    expect(getLatestQuota()).toEqual({ remaining: 0, resetsAt: '2026-10-25T00:00:00Z' });
    expect(getBlockedSeconds()).toBeGreaterThan(7000);
  });

  it('pauses for a few minutes when the shared budget is spent', async () => {
    mocked.call.mockRejectedValue(failure(503, { code: 'budget', error: 'taking a break' }));
    await expect(defineWord('mitigate')).rejects.toMatchObject({ kind: 'budget' });
    expect(getBlockedSeconds()).toBeGreaterThan(250);
  });

  it('does not block on a word that is simply not a word', async () => {
    mocked.call.mockRejectedValue(failure(422, { code: 'not_a_word', error: 'nope' }));
    await expect(defineWord('asdfgh')).rejects.toMatchObject({ kind: 'not_a_word' });
    expect(getBlockedSeconds()).toBe(0);
  });

  it('treats a busy server as a short, non-blocking retry', async () => {
    mocked.call.mockRejectedValue(
      failure(429, { rateLimitType: 'capacity', retryAfterSeconds: 3 })
    );
    await expect(defineWord('mitigate')).rejects.toMatchObject({ kind: 'busy' });
    expect(getBlockedSeconds()).toBe(0);
  });

  it.each([
    ['offline', Object.assign(new Error('x'), { isNetworkError: true, name: 'NetworkError' })],
    ['auth', failure(401)],
    ['invalid', failure(400, { error: 'Enter a word' })],
    ['unavailable', failure(503, { code: 'provider' })],
  ])('maps %s without blocking later lookups', async (kind, error) => {
    mocked.call.mockRejectedValue(error);
    await expect(defineWord('mitigate')).rejects.toMatchObject({ kind });
    expect(getBlockedSeconds()).toBe(0);
  });

  it('gives up on a request that never answers', async () => {
    vi.useFakeTimers();
    mocked.call.mockImplementation(() => new Promise(() => {}));
    const pending = defineWord('mitigate');
    const assertion = expect(pending).rejects.toBeInstanceOf(VocabDefineError);
    await vi.advanceTimersByTimeAsync(25_001);
    await assertion;
  });

  it('lets the caller walk away without cancelling the shared request', async () => {
    let finish;
    mocked.call.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const controller = new AbortController();
    const pending = defineWord('mitigate', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    finish(ok());
    await vi.waitFor(() => expect(getCachedCard('mitigate')).toEqual(CARD));
  });
});

describe('resolveDefineLanguage', () => {
  it('writes in every offered language and falls back to English for an unknown code', () => {
    for (const code of ['bn', 'uz', 'ja', 'ru', 'zh-TW', 'id']) {
      expect(resolveDefineLanguage(code)).toBe(code);
    }
    expect(resolveDefineLanguage('en')).toBe('en');
    expect(resolveDefineLanguage('xx')).toBe('en');
  });
});
