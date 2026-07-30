import { describe, expect, it } from 'vitest';
import { getVocabularyKitProgress } from '@/features/vocabulary/utils/kitProgress';

describe('Vocabulary Kit progress', () => {
  const kit = {
    word_count: 2,
    words: [{ word: 'in spite of' }, { word: 'consequently' }],
  };

  it('only completes when every kit word is saved', () => {
    expect(getVocabularyKitProgress(kit, [{ word: 'In spite of' }])).toMatchObject({
      savedCount: 1,
      percent: 50,
      isComplete: false,
    });
    expect(
      getVocabularyKitProgress(kit, [{ word: 'in   spite of' }, { word: 'consequently' }])
    ).toMatchObject({ savedCount: 2, percent: 100, isComplete: true });
  });
});
