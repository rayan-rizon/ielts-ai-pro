import { describe, expect, it } from 'vitest';
import {
  buildCloze,
  cardToItemFields,
  checkClozeAnswer,
  getItemTranslation,
  inflectionsOf,
  mergeEnrichment,
  needsEnrichment,
  pickDistractors,
  savedSenseHint,
} from '@/features/vocabulary/utils/vocabCard';
import { getPartOfSpeech } from '@/features/vocabulary/components/vocabularyUtils';

const CARD = {
  word: 'mitigate',
  partOfSpeech: 'verb',
  ipa: '/ˈmɪtɪɡeɪt/',
  level: 'C1',
  register: 'formal',
  meaning: 'To make something bad less serious.',
  translation: { language: 'bn', word: 'প্রশমিত করা', meaning: 'কম গুরুতর করা।' },
  examples: ['Trees mitigate the effects of heat.', 'Planning can mitigate risk.'],
  synonyms: ['reduce'],
  collocations: ['mitigate the risk'],
  wordFamily: [{ word: 'mitigation', pos: 'noun' }],
  commonMistake: 'Not "mitigate against".',
};

describe('cardToItemFields', () => {
  it('maps a card onto the saved columns', () => {
    const fields = cardToItemFields(CARD, 'bn');
    expect(fields).toMatchObject({
      part_of_speech: 'verb',
      ipa: '/ˈmɪtɪɡeɪt/',
      level: 'C1',
      synonyms: ['reduce'],
      translations: { bn: { word: 'প্রশমিত করা', meaning: 'কম গুরুতর করা।' } },
      details: {
        register: 'formal',
        collocations: ['mitigate the risk'],
        commonMistake: 'Not "mitigate against".',
      },
    });
    expect(Date.parse(fields.enriched_at)).not.toBeNaN();
  });

  it('keeps translations already stored for other languages', () => {
    const fields = cardToItemFields(CARD, 'bn', { translations: { hi: { meaning: 'x' } } });
    expect(Object.keys(fields.translations).sort()).toEqual(['bn', 'hi']);
  });

  it('adds no translation for English and no part of speech for "other"', () => {
    const fields = cardToItemFields({ ...CARD, partOfSpeech: 'other' }, 'en');
    expect(fields.translations).toEqual({});
    expect(fields.part_of_speech).toBeNull();
  });
});

describe('mergeEnrichment', () => {
  it('fills gaps and never overwrites what the learner already has', () => {
    const fields = cardToItemFields(CARD, 'bn');
    const patch = mergeEnrichment(
      { part_of_speech: 'noun', ipa: '', level: null, synonyms: ['curb'] },
      fields
    );
    expect(patch.part_of_speech).toBeUndefined();
    expect(patch.ipa).toBe('/ˈmɪtɪɡeɪt/');
    expect(patch.level).toBe('C1');
    expect(patch.synonyms).toBeUndefined();
    expect(patch.translations.bn.meaning).toBe('কম গুরুতর করা।');
    expect(patch.enriched_at).toBeTruthy();
  });
});

describe('saved words', () => {
  it('strips a part-of-speech prefix and refuses placeholders as a sense hint', () => {
    expect(savedSenseHint('(noun) a large area of water')).toBe('a large area of water');
    expect(savedSenseHint('Saved IELTS vocabulary word')).toBe('');
    expect(savedSenseHint('')).toBe('');
  });

  it('reads a stored translation, and only for a real language', () => {
    const item = { translations: { bn: { word: 'a', meaning: 'b' } } };
    expect(getItemTranslation(item, 'bn')).toEqual({ word: 'a', meaning: 'b' });
    expect(getItemTranslation(item, 'en')).toBeNull();
    expect(getItemTranslation(item, 'hi')).toBeNull();
  });

  it('asks for enrichment only when a card or the learner’s language is missing', () => {
    const done = { word: 'a', enriched_at: 'x', translations: { bn: { meaning: 'm' } } };
    expect(needsEnrichment({ word: 'a' }, 'bn')).toBe(true);
    expect(needsEnrichment(done, 'bn')).toBe(false);
    expect(needsEnrichment(done, 'hi')).toBe(true);
    expect(needsEnrichment(done, 'en')).toBe(false);
    expect(needsEnrichment({ word: 'a', enriched_at: 'x', translations: {} }, 'en')).toBe(false);
  });

  it('normalises a stored part of speech for display', () => {
    expect(getPartOfSpeech({ part_of_speech: 'verb' })).toBe('v.');
    expect(getPartOfSpeech({ part_of_speech: 'phrase' })).toBe('phrase');
  });
});

describe('fill-the-gap', () => {
  it.each([
    ['mitigate', 'Trees mitigate the effects of heat.', 'mitigate'],
    ['mitigate', 'Trees can be mitigating the heat.', 'mitigating'],
    ['mitigate', 'Planning mitigated the risk.', 'mitigated'],
    ['study', 'She studies every night.', 'studies'],
    ['stop', 'He stopped quickly.', 'stopped'],
    ['clear', 'It is clearly wrong.', 'clearly'],
    ['carry out', 'They carry out tests.', 'carry out'],
  ])('finds %s in "%s"', (word, example, answer) => {
    const cloze = buildCloze({ word, example });
    expect(cloze.answer).toBe(answer);
    expect(cloze.prompt).toContain('_____');
    expect(cloze.prompt).not.toContain(answer);
  });

  it('does not blank part of a longer word', () => {
    expect(buildCloze({ word: 'art', example: 'The party started late.' })).toBeNull();
    expect(buildCloze({ word: 'mitigate', example: 'Nothing relevant here.' })).toBeNull();
    expect(buildCloze({ word: 'mitigate', example: '' })).toBeNull();
  });

  it('falls back to the extra AI examples', () => {
    const cloze = buildCloze({
      word: 'mitigate',
      example: 'Unrelated.',
      details: { examples: ['Planning can mitigate risk.'] },
    });
    expect(cloze.answer).toBe('mitigate');
  });

  it('accepts the form in the sentence or the headword, ignoring case and spacing', () => {
    const cloze = buildCloze({ word: 'mitigate', example: 'Planning mitigated the risk.' });
    expect(checkClozeAnswer(' Mitigated ', cloze)).toBe(true);
    expect(checkClozeAnswer('MITIGATE', cloze)).toBe(true);
    expect(checkClozeAnswer('mitigates', cloze)).toBe(false);
    expect(checkClozeAnswer('', cloze)).toBe(false);
    expect(checkClozeAnswer('x', null)).toBe(false);
  });

  it('lists the longest forms first so "mitigating" is not cut short', () => {
    const forms = inflectionsOf('mitigate');
    expect(forms.indexOf('mitigating')).toBeLessThan(forms.indexOf('mitigate'));
  });
});

describe('quiz distractors', () => {
  const pool = [
    { id: 1, definition: 'target def', part_of_speech: 'verb' },
    { id: 2, definition: 'verb two', part_of_speech: 'verb' },
    { id: 3, definition: 'verb three', part_of_speech: 'verb' },
    { id: 4, definition: 'noun one', part_of_speech: 'noun' },
    { id: 5, definition: 'verb four', part_of_speech: 'verb' },
    { id: 6, definition: 'noun one', part_of_speech: 'noun' },
  ];

  it('prefers the same part of speech and never repeats or includes the answer', () => {
    const picked = pickDistractors(pool[0], pool, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    expect(picked).not.toContain('target def');
    expect(picked.every((definition) => definition.startsWith('verb'))).toBe(true);
  });

  it('tops up from other parts of speech and skips duplicate definitions', () => {
    const picked = pickDistractors(pool[0], pool.slice(0, 4).concat(pool[5]), 3);
    expect(picked).toHaveLength(3);
    expect(picked.filter((definition) => definition === 'noun one')).toHaveLength(1);
  });

  it('works for words with no stored part of speech', () => {
    const plain = [
      { id: 1, definition: 'a' },
      { id: 2, definition: 'b' },
      { id: 3, definition: 'c' },
    ];
    expect(pickDistractors(plain[0], plain, 3).sort()).toEqual(['b', 'c']);
  });
});
