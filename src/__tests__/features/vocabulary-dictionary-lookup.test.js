import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearDefinitionCache,
  fetchFastDefinition,
  isUsableDefinition,
} from '@/features/vocabulary/utils/dictionaryLookup';

const reply = (data) => Promise.resolve({ ok: true, json: async () => data });
describe('shared vocabulary dictionary lookup', () => {
  afterEach(() => {
    clearDefinitionCache();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it('finds the correct verb for trivialized while the primary service stalls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? new Promise(() => {})
          : reply([
              {
                word: 'trivialized',
                defHeadword: 'trivialization',
                defs: ['n\tThe act of trivializing.'],
              },
              { word: 'trivialize', defs: ['v\tTo make something appear trivial.'] },
            ])
      )
    );
    const result = await fetchFastDefinition('trivialized', new AbortController().signal);
    expect(result.word).toBe('trivialized');
    expect(result.partOfSpeech).toBe('verb');
    expect(result.definition).toBe(
      'Past tense and past participle of trivialize: To make something appear trivial.'
    );
  });
  it('rejects unrelated suggestions instead of defining a different word', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? Promise.reject(new Error('Unavailable'))
          : reply([{ word: 'tester', defs: ['n\tA person who tests.'] }])
      )
    );
    await expect(fetchFastDefinition('tryster', new AbortController().signal)).rejects.toThrow();
  });
  it('searches every dictionary meaning for a real definition', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? reply([
              {
                word: 'read',
                meanings: [
                  { partOfSpeech: 'noun', definitions: [] },
                  {
                    partOfSpeech: 'verb',
                    definitions: [{ definition: 'Interpret written words.' }],
                  },
                ],
              },
            ])
          : Promise.reject(new Error('Unavailable'))
      )
    );
    expect((await fetchFastDefinition('read', new AbortController().signal)).definition).toBe(
      'Interpret written words.'
    );
  });
  it('serves a repeat lookup from cache without calling either provider', async () => {
    const fetchMock = vi.fn((url) =>
      url.includes('dictionaryapi.dev')
        ? reply([
            {
              word: 'vivid',
              phonetic: '/ˈvɪvɪd/',
              meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Bright.' }] }],
            },
          ])
        : Promise.reject(new Error('Unavailable'))
    );
    vi.stubGlobal('fetch', fetchMock);
    const first = await fetchFastDefinition('Vivid', new AbortController().signal);
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await fetchFastDefinition(' vivid ', new AbortController().signal);
    expect(second).toEqual(first);
    expect(second.phonetic).toBe('/ˈvɪvɪd/');
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterFirst);
  });
  it('does not cache a failed lookup, so a later attempt can succeed', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Unavailable'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchFastDefinition('vivid', new AbortController().signal)).rejects.toThrow();
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? reply([
              {
                word: 'vivid',
                meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Bright.' }] }],
              },
            ])
          : Promise.reject(new Error('Unavailable'))
      )
    );
    expect((await fetchFastDefinition('vivid', new AbortController().signal)).definition).toBe(
      'Bright.'
    );
  });
  it('rejects placeholder definitions including punctuation', () => {
    for (const value of [
      '',
      'Definition unavailable.',
      'Definition not found.',
      'Saved IELTS vocabulary word',
    ]) {
      expect(isUsableDefinition(value)).toBe(false);
    }
  });
});
