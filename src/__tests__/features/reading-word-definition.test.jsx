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
  afterEach(() => vi.restoreAllMocks());

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
        part_of_speech: 'v',
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
