import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WordDefinitionPopover from '@/features/testing/reading/components/WordDefinitionPopover';
import { useWordDefinition } from '@/features/testing/reading/components/ReadingTest/hooks/useWordDefinition';
import { requestReadingAssistance } from '@/features/testing/reading/services/readingAiService';

vi.mock('@/features/testing/reading/services/readingAiService', () => ({
  requestReadingAssistance: vi.fn(),
}));

vi.mock('@/features/gamification/services/UserPoints', () => ({
  UserPoints: { addPoints: vi.fn() },
}));

vi.mock('@/features/vocabulary/services/VocabularyItem', () => ({
  VocabularyItem: { create: vi.fn(), list: vi.fn() },
}));

describe('reading word definitions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('falls back to Datamuse when the primary dictionary is unavailable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            word: 'obstructing',
            defs: ['v\tTo block a passage with an obstacle.'],
          },
        ],
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useWordDefinition(null, null, 0));

    await act(async () => {
      await result.current.fetchWordDefinition('obstructing');
    });

    await waitFor(() =>
      expect(result.current.wordDefinition).toMatchObject({
        word: 'obstructing',
        definition: 'To block a passage with an obstacle.',
        part_of_speech: 'verb',
      })
    );
    expect(fetchMock.mock.calls[1][0]).toContain('api.datamuse.com/words?sp=obstructing');
  });

  it('does not wait for a stalled primary dictionary before showing a fallback definition', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('dictionaryapi.dev')) return new Promise(() => {});
      return Promise.resolve({
        ok: true,
        json: async () => [{ word: 'vivid', defs: ['adj\tProducing strong, clear images.'] }],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const started = performance.now();
    const { result } = renderHook(() => useWordDefinition(null, null, 0));

    await act(async () => result.current.fetchWordDefinition('vivid'));

    expect(result.current.wordDefinition).toMatchObject({
      word: 'vivid',
      definition: 'Producing strong, clear images.',
    });
    expect(performance.now() - started).toBeLessThan(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('preserves the popover anchor when serving a cached definition', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          word: 'clear',
          meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Easy to see.' }] }],
          phonetics: [],
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useWordDefinition(null, null, 0));
    await act(async () => result.current.fetchWordDefinition('clear'));
    act(() =>
      result.current.setWordDefinition({
        word: 'clear',
        definition: 'Loading...',
        position: { x: 52, y: 91 },
      })
    );
    await act(async () => result.current.fetchWordDefinition('clear'));

    expect(result.current.wordDefinition).toMatchObject({
      definition: 'Easy to see.',
      position: { x: 52, y: 91 },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('renders resolved definitions in the learner panel card treatment', () => {
    const { container } = render(
      <WordDefinitionPopover
        wordDefinition={{
          word: 'obstructing',
          definition: 'To impede or block progress.',
          part_of_speech: 'verb',
          position: { x: 220, y: 180 },
        }}
        addToVocabulary={vi.fn()}
      />
    );

    expect(screen.getByText('Dictionary')).toBeInTheDocument();
    expect(screen.getByText('To impede or block progress.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Word Bank' })).toBeEnabled();
    expect(container.querySelector('.backdrop-blur-2xl')).toBeNull();
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
  });

  it('shows a neutral contextual loader without mounting an old definition card', () => {
    render(
      <WordDefinitionPopover
        wordDefinition={{
          word: 'evidence',
          definition: 'Loading...',
          position: { x: 220, y: 180 },
        }}
        addToVocabulary={vi.fn()}
      />
    );

    expect(screen.getByText('Finding meaning here…')).toBeInTheDocument();
    expect(screen.queryByText('Dictionary')).not.toBeInTheDocument();
    expect(screen.queryByText('Meaning')).not.toBeInTheDocument();
  });

  it('shows one contextual definition first when AI succeeds', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          word: 'plain',
          meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Clear.' }] }],
          phonetics: [],
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    requestReadingAssistance.mockResolvedValue({
      result: {
        meaning: 'Easy to understand in this sentence.',
        partOfSpeech: 'adjective',
        synonyms: ['clear'],
      },
    });

    const { result } = renderHook(() =>
      useWordDefinition(null, null, 0, 'c8100000-0000-4000-8000-000000000001', true)
    );
    await act(async () =>
      result.current.fetchWordDefinition('plain', { start: 0, end: 5, text: 'plain' })
    );

    expect(result.current.wordDefinition).toMatchObject({
      definition: 'Easy to understand in this sentence.',
      contextual: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps waiting for a valid AI meaning beyond the old five-second deadline', async () => {
    vi.useFakeTimers();
    let resolveAI;
    requestReadingAssistance.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAI = resolve;
        })
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWordDefinition(null, null, 0, 'session', true));
    let lookup;
    act(() => {
      lookup = result.current.fetchWordDefinition('delayed', { start: 0, end: 7 });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      resolveAI({ result: { meaning: 'The correct meaning in the passage.' } });
      await lookup;
    });
    expect(result.current.wordDefinition).toMatchObject({
      contextual: true,
      definition: 'The correct meaning in the passage.',
    });
  });

  it('upgrades a provisional dictionary result when AI arrives after the longer deadline', async () => {
    vi.useFakeTimers();
    let resolveAI;
    requestReadingAssistance.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAI = resolve;
        })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? Promise.reject(new Error('Unavailable'))
          : Promise.resolve({
              ok: true,
              json: async () => [{ word: 'late', defs: ['adj\tAfter the usual time.'] }],
            })
      )
    );
    const { result } = renderHook(() => useWordDefinition(null, null, 0, 'session', true));
    act(() => {
      result.current.fetchWordDefinition('late', { start: 0, end: 4 });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20001);
    });
    expect(result.current.wordDefinition.contextual).toBe(false);
    await act(async () => {
      resolveAI({ result: { meaning: 'Late in this passage.' } });
    });
    expect(result.current.wordDefinition).toMatchObject({
      contextual: true,
      definition: 'Late in this passage.',
    });
  });

  it('does not reopen a dismissed card when the AI request finishes', async () => {
    let resolveAI;
    requestReadingAssistance.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAI = resolve;
        })
    );
    const { result } = renderHook(() => useWordDefinition(null, null, 0, 'session', true));
    let lookup;
    act(() => {
      lookup = result.current.fetchWordDefinition('dismissed', { start: 0, end: 9 });
    });
    act(() => result.current.setWordDefinition(null));
    await act(async () => {
      resolveAI({ result: { meaning: 'Should stay closed.' } });
      await lookup;
    });
    expect(result.current.wordDefinition).toBeNull();
  });

  it('does not let an older AI selection overwrite the current word', async () => {
    let resolveOld;
    requestReadingAssistance
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          })
      )
      .mockResolvedValueOnce({ result: { meaning: 'Meaning of the current word.' } });
    const { result } = renderHook(() => useWordDefinition(null, null, 0, 'session', true));
    let olderLookup;
    act(() => {
      olderLookup = result.current.fetchWordDefinition('older', { start: 0, end: 5 });
    });
    await act(async () => result.current.fetchWordDefinition('current', { start: 6, end: 13 }));
    await act(async () => {
      resolveOld({ result: { meaning: 'Stale meaning.' } });
      await olderLookup;
    });
    expect(result.current.wordDefinition).toMatchObject({
      word: 'current',
      definition: 'Meaning of the current word.',
      contextual: true,
    });
  });

  it('clears contextual and error flags when AI fails and a dictionary meaning succeeds', async () => {
    requestReadingAssistance.mockRejectedValue(new Error('AI unavailable'));
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url.includes('dictionaryapi.dev')
          ? Promise.reject(new Error('Unavailable'))
          : Promise.resolve({
              ok: true,
              json: async () => [{ word: 'fallback', defs: ['n\tAn alternative.'] }],
            })
      )
    );
    const { result } = renderHook(() => useWordDefinition(null, null, 0, 'session', true));
    act(() =>
      result.current.setWordDefinition({
        word: 'fallback',
        contextual: true,
        error: true,
        position: { x: 10, y: 20 },
      })
    );
    await act(async () => result.current.fetchWordDefinition('fallback', { start: 0, end: 8 }));
    expect(result.current.wordDefinition).toMatchObject({
      definition: 'An alternative.',
      contextual: false,
      error: false,
      position: { x: 10, y: 20 },
    });
  });

  it('labels contextual meanings while preserving pronunciation controls', () => {
    render(
      <WordDefinitionPopover
        wordDefinition={{
          word: 'plain',
          definition: 'Easy to understand in this sentence.',
          contextual: true,
          pronunciation: '/pleɪn/',
          audio: 'https://audio.example/plain.mp3',
          position: { x: 220, y: 180 },
        }}
        addToVocabulary={vi.fn()}
      />
    );
    expect(screen.getByText('Meaning here')).toBeInTheDocument();
    expect(screen.getByText('Contextual AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play pronunciation of plain' })).toBeEnabled();
  });
});
