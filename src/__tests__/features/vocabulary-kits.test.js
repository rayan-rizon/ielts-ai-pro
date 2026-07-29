import { describe, expect, it } from 'vitest';
import {
  FEATURED_VOCABULARY_KITS,
  FREE_VOCABULARY_KIT_SLUGS,
  VOCABULARY_KITS,
  getVocabularyKit,
} from '@/features/vocabulary/data/vocabularyKits';

describe('source-derived Vocabulary Kits', () => {
  it('creates the complete skill, band, and topic kit library', () => {
    expect(VOCABULARY_KITS).toHaveLength(35);
    expect(VOCABULARY_KITS.filter((kit) => kit.category === 'Topic vocabulary')).toHaveLength(20);
    expect(
      VOCABULARY_KITS.filter((kit) => kit.category === 'Vocabulary by target band')
    ).toHaveLength(3);
    expect(VOCABULARY_KITS.filter((kit) => kit.category.endsWith('vocabulary'))).toHaveLength(32);
  });

  it('gives every kit a bookmarkable slug and substantive structured content', () => {
    const slugs = new Set(VOCABULARY_KITS.map((kit) => kit.slug));
    expect(slugs.size).toBe(VOCABULARY_KITS.length);

    VOCABULARY_KITS.forEach((kit) => {
      expect(kit.title).not.toMatch(/demo/i);
      expect(kit.word_count).toBeGreaterThanOrEqual(10);
      expect(kit.words[0]).toMatchObject({
        word: expect.any(String),
        definition: expect.any(String),
        example: expect.any(String),
      });
      expect(JSON.parse(kit.content)).toHaveLength(kit.word_count);
      expect(getVocabularyKit(kit.slug)?.id).toBe(kit.id);
    });
  });

  it('uses real source kits in the Smart Vocabulary section', () => {
    expect(FEATURED_VOCABULARY_KITS).toHaveLength(4);
    expect(FEATURED_VOCABULARY_KITS.map((kit) => kit.title)).toEqual([
      'IELTS Speaking: Giving and developing opinions',
      'IELTS Writing: Analysis, cause and consequence',
      'Education Vocabulary for IELTS',
      'Environment Vocabulary for IELTS',
    ]);
  });

  it('keeps five balanced starter kits free and tiers the remaining library', () => {
    const freeKits = VOCABULARY_KITS.filter((kit) => kit.access_tier === 'free');

    expect(freeKits).toHaveLength(5);
    expect(new Set(freeKits.map((kit) => kit.slug))).toEqual(FREE_VOCABULARY_KIT_SLUGS);
    expect(
      VOCABULARY_KITS.find((kit) => kit.slug === 'band-7-vocabulary-builder')?.access_tier
    ).toBe('pro');
    expect(
      VOCABULARY_KITS.find((kit) => kit.slug === 'band-8-vocabulary-builder')?.access_tier
    ).toBe('premium');
    expect(
      VOCABULARY_KITS.find((kit) => kit.slug === 'technology-vocabulary-for-ielts')?.access_tier
    ).toBe('premium');
  });
});
