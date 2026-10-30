import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupReadingDefinition } from '@/features/testing/reading/services/readingWordDefinition';
import { requestReadingAssistance } from '@/features/testing/reading/services/readingAiService';
import { fetchFastDefinition } from '@/features/vocabulary/utils/dictionaryLookup';

vi.mock('@/features/testing/reading/services/readingAiService', () => ({
  requestReadingAssistance: vi.fn(),
}));
vi.mock('@/features/vocabulary/utils/dictionaryLookup', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchFastDefinition: vi.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const context = { sessionId: 'session', action: 'dictionary' };
const meaning = { result: { meaning: 'Meaning in this passage.' } };

describe('Reading definition orchestration', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it.each(['resolve', 'reject'])(
    'keeps late AI when the dictionary subsequently %ss',
    async (outcome) => {
      vi.useFakeTimers();
      const ai = deferred();
      const dictionary = deferred();
      requestReadingAssistance.mockReturnValue(ai.promise);
      fetchFastDefinition.mockReturnValue(dictionary.promise);
      const onDefinition = vi.fn();
      const lookup = lookupReadingDefinition({
        word: 'plain',
        contextualRequest: context,
        signal: new AbortController().signal,
        onDefinition,
      });
      await vi.advanceTimersByTimeAsync(20000);
      expect(fetchFastDefinition).toHaveBeenCalledTimes(1);
      ai.resolve(meaning);
      await vi.advanceTimersByTimeAsync(0);
      if (outcome === 'resolve') dictionary.resolve({ definition: 'Ordinary.' });
      else dictionary.reject(new Error('Dictionary unavailable'));
      await expect(lookup).resolves.toBeUndefined();
      expect(onDefinition).toHaveBeenCalledTimes(1);
      expect(onDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          definition: meaning.result.meaning,
          contextual: true,
          error: false,
        })
      );
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('leaves AI visible when dictionary failure and AI success settle in the same turn', async () => {
    vi.useFakeTimers();
    const ai = deferred();
    const dictionary = deferred();
    requestReadingAssistance.mockReturnValue(ai.promise);
    fetchFastDefinition.mockReturnValue(dictionary.promise);
    const updates = [];
    const lookup = lookupReadingDefinition({
      word: 'plain',
      contextualRequest: context,
      signal: new AbortController().signal,
      onDefinition: (definition) => updates.push(definition),
      onError: () => updates.push({ definition: 'Definition not found.', error: true }),
    });
    await vi.advanceTimersByTimeAsync(20000);
    dictionary.reject(new Error('Dictionary unavailable'));
    ai.resolve(meaning);
    await lookup;
    expect(updates.at(-1)).toMatchObject({
      definition: meaning.result.meaning,
      contextual: true,
      error: false,
    });
  });

  it('falls back immediately when AI returns a placeholder meaning', async () => {
    vi.useFakeTimers();
    requestReadingAssistance.mockResolvedValue({ result: { meaning: 'Definition not found.' } });
    fetchFastDefinition.mockResolvedValue({ definition: 'Ordinary.', phonetic: '/pleɪn/' });
    const onDefinition = vi.fn();
    await lookupReadingDefinition({
      word: 'plain',
      contextualRequest: context,
      signal: new AbortController().signal,
      onDefinition,
    });
    expect(onDefinition).toHaveBeenCalledWith(
      expect.objectContaining({
        definition: 'Ordinary.',
        pronunciation: '/pleɪn/',
        contextual: false,
      })
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops late updates after the caller aborts a provisional card', async () => {
    vi.useFakeTimers();
    const ai = deferred();
    requestReadingAssistance.mockReturnValue(ai.promise);
    fetchFastDefinition.mockResolvedValue({ definition: 'Ordinary.' });
    const controller = new AbortController();
    const onDefinition = vi.fn();
    const lookup = lookupReadingDefinition({
      word: 'plain',
      contextualRequest: context,
      signal: controller.signal,
      onDefinition,
    });
    await vi.advanceTimersByTimeAsync(20000);
    await lookup;
    controller.abort();
    ai.resolve(meaning);
    await vi.advanceTimersByTimeAsync(0);
    expect(onDefinition).toHaveBeenCalledTimes(1);
    expect(onDefinition.mock.calls[0][0].contextual).toBe(false);
  });

  it('reports dictionary failure when no contextual meaning is available', async () => {
    const error = new Error('Dictionary unavailable');
    fetchFastDefinition.mockRejectedValue(error);
    const onDefinition = vi.fn();
    const onError = vi.fn();
    await lookupReadingDefinition({
      word: 'plain',
      contextualRequest: null,
      signal: new AbortController().signal,
      onDefinition,
      onError,
    });
    expect(onError).toHaveBeenCalledWith(error);
    expect(onDefinition).not.toHaveBeenCalled();
  });
});
