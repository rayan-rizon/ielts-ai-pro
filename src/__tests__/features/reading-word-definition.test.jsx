import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WordDefinitionPopover from '@/features/testing/reading/components/WordDefinitionPopover';
import { useWordDefinition } from '@/features/testing/reading/components/ReadingTest/hooks/useWordDefinition';

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
});
