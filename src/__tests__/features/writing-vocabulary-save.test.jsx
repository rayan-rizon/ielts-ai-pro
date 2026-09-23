import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findByWord: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  toastError: vi.fn(),
  toastMessage: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/features/vocabulary/services/VocabularyItem', () => ({
  VocabularyItem: {
    findByWord: mocks.findByWord,
    count: mocks.count,
    create: mocks.create,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    message: mocks.toastMessage,
    success: mocks.toastSuccess,
  },
}));

import { useWritingVocabularySave } from '@/features/testing/writing/hooks/useWritingVocabularySave';

describe('Writing vocabulary save action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findByWord.mockResolvedValue(null);
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue({ id: 'saved-word', word: 'driven upwards' });
  });

  it('saves the alternative with its usage note and full example', async () => {
    const { result } = renderHook(() =>
      useWritingVocabularySave({ id: 'learner-1', subscription_tier: 'free' })
    );

    await act(async () => {
      await result.current.onSaveVocabularyWord({
        word: 'driven upwards',
        original: 'forced upward',
        context: 'Keeps the meaning that the mountain forces the air to rise.',
        example: 'Moist air is driven upwards over the mountain.',
      });
    });

    expect(mocks.findByWord).toHaveBeenCalledWith('learner-1', 'driven upwards');
    expect(mocks.count).toHaveBeenCalledWith({ user_id: 'learner-1' });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        word: 'driven upwards',
        definition:
          'Writing usage note: Keeps the meaning that the mountain forces the air to rise.',
        example: 'Moist air is driven upwards over the mountain.',
        user_id: 'learner-1',
        source: 'Writing',
        mastery_level: 0,
      })
    );
    expect(result.current.savedVocabularyTerms.has('driven upwards')).toBe(true);
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });

  it('marks an existing word as saved without creating a duplicate', async () => {
    mocks.findByWord.mockResolvedValue({ id: 'existing', word: 'Driven Upwards' });
    const { result } = renderHook(() =>
      useWritingVocabularySave({ id: 'learner-1', subscription_tier: 'free' })
    );

    await act(async () => {
      await result.current.onSaveVocabularyWord({ word: 'driven upwards' });
    });

    expect(result.current.savedVocabularyTerms.has('driven upwards')).toBe(true);
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('keeps the vocabulary tier limit and does not save beyond it', async () => {
    mocks.count.mockResolvedValue(100);
    const { result } = renderHook(() =>
      useWritingVocabularySave({ id: 'learner-1', subscription_tier: 'free' })
    );

    let response;
    await act(async () => {
      response = await result.current.onSaveVocabularyWord({ word: 'a useful phrase' });
    });

    expect(response.success).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Your free vocabulary limit of 100 words has been reached.'
    );
  });
});
