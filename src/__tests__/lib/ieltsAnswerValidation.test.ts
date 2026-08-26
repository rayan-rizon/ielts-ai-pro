import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeAnswer,
  parseIeltsAnswerVariations,
  isAnswerCorrect,
  clearAnswerCache,
  getAnswerCacheStats,
} from '@/lib/ieltsAnswerValidation';

describe('IELTS Answer Validation', () => {
  beforeEach(() => {
    clearAnswerCache();
  });

  describe('normalizeAnswer', () => {
    it('should lowercase and trim answers', () => {
      expect(normalizeAnswer('  HELLO  ')).toBe('hello');
    });

    it('should normalize multiple spaces to single space', () => {
      expect(normalizeAnswer('hello   world')).toBe('hello world');
    });

    it('should return empty string for null/undefined', () => {
      expect(normalizeAnswer(null)).toBe('');
      expect(normalizeAnswer(undefined)).toBe('');
    });
  });

  describe('parseIeltsAnswerVariations', () => {
    it('should handle simple answers without patterns', () => {
      const variations = parseIeltsAnswerVariations('hello');
      expect(variations).toEqual(['hello']);
    });

    it('should handle main alternatives separated by " / "', () => {
      const variations = parseIeltsAnswerVariations('cat / dog');
      expect(variations).toContain('cat');
      expect(variations).toContain('dog');
    });

    it('should handle legacy admin alternatives separated by whitespace-wrapped commas', () => {
      const variations = parseIeltsAnswerVariations('fermentation , fermentation process');
      expect(variations).toEqual(['fermentation', 'fermentation process']);
    });

    it('should handle inline alternatives like "a/one"', () => {
      const variations = parseIeltsAnswerVariations('a/one hundred');
      expect(variations).toContain('a hundred');
      expect(variations).toContain('one hundred');
    });

    it('should handle optional content in parentheses', () => {
      const variations = parseIeltsAnswerVariations('(£) 115');
      expect(variations).toContain('115');
      expect(variations).toContain('£ 115');
    });

    it('should handle complex patterns with optionals and alternatives', () => {
      const variations = parseIeltsAnswerVariations('(£) a/one hundred (and) fifteen');
      expect(variations).toContain('a hundred fifteen');
      expect(variations).toContain('one hundred fifteen');
      expect(variations).toContain('a hundred and fifteen');
      expect(variations).toContain('one hundred and fifteen');
      expect(variations).toContain('£ a hundred fifteen');
      expect(variations).toContain('£ one hundred and fifteen');
    });

    it('should cache results for repeated queries', () => {
      parseIeltsAnswerVariations('test pattern');
      expect(getAnswerCacheStats().size).toBe(1);

      parseIeltsAnswerVariations('test pattern');
      expect(getAnswerCacheStats().size).toBe(1); // Still 1, not 2

      parseIeltsAnswerVariations('different pattern');
      expect(getAnswerCacheStats().size).toBe(2);
    });

    it('bounds pathological optional-answer expansion and cache growth', () => {
      const pattern = Array.from({ length: 20 }, (_, index) => `(option${index})`).join(' ');
      expect(parseIeltsAnswerVariations(pattern)).toHaveLength(256);

      for (let index = 0; index < 600; index += 1) {
        parseIeltsAnswerVariations(`answer-${index}`);
      }
      expect(getAnswerCacheStats().size).toBeLessThanOrEqual(500);
    });
  });

  describe('isAnswerCorrect', () => {
    it('should match exact answers (case-insensitive)', () => {
      expect(isAnswerCorrect('Hello', 'hello')).toBe(true);
      expect(isAnswerCorrect('WORLD', 'world')).toBe(true);
    });

    it('should accept answers matching main alternatives', () => {
      expect(isAnswerCorrect('cat', 'cat / dog')).toBe(true);
      expect(isAnswerCorrect('dog', 'cat / dog')).toBe(true);
      expect(isAnswerCorrect('bird', 'cat / dog')).toBe(false);
    });

    it('should accept either answer from legacy comma-separated admin data', () => {
      const correctAnswer = 'fermentation , fermentation process';
      expect(isAnswerCorrect('fermentation', correctAnswer)).toBe(true);
      expect(isAnswerCorrect('fermentation process', correctAnswer)).toBe(true);
    });

    it('should accept answers matching inline alternatives', () => {
      expect(isAnswerCorrect('a hundred', 'a/one hundred')).toBe(true);
      expect(isAnswerCorrect('one hundred', 'a/one hundred')).toBe(true);
      expect(isAnswerCorrect('the hundred', 'a/one hundred')).toBe(false);
    });

    it('should accept answers matching optional patterns', () => {
      expect(isAnswerCorrect('115', '(£) 115')).toBe(true);
      expect(isAnswerCorrect('£ 115', '(£) 115')).toBe(true);
    });

    it('should handle currency symbol flexibility', () => {
      expect(isAnswerCorrect('115', '£ 115')).toBe(true);
      expect(isAnswerCorrect('$200', '$ 200')).toBe(true);
      expect(isAnswerCorrect('200', '$200')).toBe(true);
    });

    it('should return false for empty answers', () => {
      expect(isAnswerCorrect('', 'hello')).toBe(false);
      expect(isAnswerCorrect(null, 'hello')).toBe(false);
      expect(isAnswerCorrect('hello', '')).toBe(false);
    });

    it('should handle whitespace variations', () => {
      expect(isAnswerCorrect('  hello  ', 'hello')).toBe(true);
      expect(isAnswerCorrect('hello world', 'hello   world')).toBe(true);
    });

    it('should handle alternatives inside optional parentheses', () => {
      // Format: (its/huarango/the) branches means:
      // - "branches" (without optional)
      // - "its branches", "huarango branches", "the branches" (with alternative)
      expect(isAnswerCorrect('branches', '(its/huarango/the) branches')).toBe(true);
      expect(isAnswerCorrect('its branches', '(its/huarango/the) branches')).toBe(true);
      expect(isAnswerCorrect('huarango branches', '(its/huarango/the) branches')).toBe(true);
      expect(isAnswerCorrect('the branches', '(its/huarango/the) branches')).toBe(true);
      expect(isAnswerCorrect('my branches', '(its/huarango/the) branches')).toBe(false);
    });

    it('should handle simple optional prefix', () => {
      // Format: (carbon) emissions means:
      // - "emissions" (without optional)
      // - "carbon emissions" (with optional)
      expect(isAnswerCorrect('emissions', '(carbon) emissions')).toBe(true);
      expect(isAnswerCorrect('carbon emissions', '(carbon) emissions')).toBe(true);
      expect(isAnswerCorrect('nitrogen emissions', '(carbon) emissions')).toBe(false);
    });

    it('should handle multi-way inline alternatives without parentheses', () => {
      // Format: a/one/1 hundred
      expect(isAnswerCorrect('a hundred', 'a/one/1 hundred')).toBe(true);
      expect(isAnswerCorrect('one hundred', 'a/one/1 hundred')).toBe(true);
      expect(isAnswerCorrect('1 hundred', 'a/one/1 hundred')).toBe(true);
      expect(isAnswerCorrect('two hundred', 'a/one/1 hundred')).toBe(false);
    });

    it('should handle hyphen vs space flexibility', () => {
      expect(isAnswerCorrect('forty eight', '48 / forty-eight')).toBe(true);
      expect(isAnswerCorrect('sixty seven fifty', '67.50 / sixty-seven fifty')).toBe(true);
      expect(isAnswerCorrect('wi-fi', 'wifi')).toBe(true);
    });

    it('should handle decimal numeric equivalence', () => {
      expect(isAnswerCorrect('67.5', '67.50 / sixty-seven fifty')).toBe(true);
      expect(isAnswerCorrect('67.50', '67.50')).toBe(true);
    });

    it('should handle date order inversion', () => {
      expect(isAnswerCorrect('January 13th', '(the) 13(th) (of) January / 13.01 / 13.1')).toBe(
        true
      );
      expect(isAnswerCorrect('April 6th', '(the) 6(th) (of) April / 06.04 / 6.4')).toBe(true);
    });
  });

  describe('clearAnswerCache', () => {
    it('should clear the cache', () => {
      parseIeltsAnswerVariations('pattern 1');
      parseIeltsAnswerVariations('pattern 2');
      expect(getAnswerCacheStats().size).toBe(2);

      clearAnswerCache();
      expect(getAnswerCacheStats().size).toBe(0);
    });
  });
});
