import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearReadingAssistantCache,
  requestReadingAssistance,
} from '@/features/testing/reading/services/readingAiService';
import { callEdgeFunction } from '@/utils/api';

vi.mock('@/utils/api', () => ({ callEdgeFunction: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
  }),
}));

const payload = {
  sessionId: 's1',
  passageIndex: 0,
  selectionStart: 12,
  selectionEnd: 19,
  selectedText: 'example',
  action: 'dictionary',
};

describe('Reading assistant browser cache', () => {
  beforeEach(() => {
    clearReadingAssistantCache();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('deduplicates concurrent requests and reuses completed results', async () => {
    let resolveRequest;
    callEdgeFunction.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const first = requestReadingAssistance(payload);
    const second = requestReadingAssistance(payload);
    await vi.waitFor(() => expect(callEdgeFunction).toHaveBeenCalledTimes(1));
    resolveRequest({ state: 'complete', result: { meaning: 'A sample.' } });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    await requestReadingAssistance(payload);
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);
  });

  it('expires cached responses after an hour', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
    callEdgeFunction.mockResolvedValue({ state: 'complete', result: { meaning: 'A sample.' } });

    await requestReadingAssistance(payload);
    vi.setSystemTime(new Date('2026-09-10T12:59:00Z'));
    await requestReadingAssistance(payload);
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-09-10T13:00:01Z'));
    await requestReadingAssistance(payload);
    expect(callEdgeFunction).toHaveBeenCalledTimes(2);
  });

  it('survives a reload by restoring the cache from session storage', async () => {
    callEdgeFunction.mockResolvedValue({ state: 'complete', result: { meaning: 'A sample.' } });
    await requestReadingAssistance(payload);
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);

    // A reload drops the module state but not sessionStorage.
    const saved = window.sessionStorage.getItem('reading_assistant_cache_v4');
    clearReadingAssistantCache();
    window.sessionStorage.setItem('reading_assistant_cache_v4', saved);

    await requestReadingAssistance(payload);
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);
  });

  it('does not cache failed or incomplete responses', async () => {
    callEdgeFunction.mockResolvedValueOnce({ state: 'failed' }).mockResolvedValueOnce({
      state: 'complete',
      result: { meaning: 'A sample.' },
    });

    await requestReadingAssistance(payload);
    await requestReadingAssistance(payload);

    expect(callEdgeFunction).toHaveBeenCalledTimes(2);
  });
});
