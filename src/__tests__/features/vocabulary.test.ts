import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    SUPPORTED_LANGUAGES,
    getLanguageName,
    getCachedTranslation,
    clearTranslationCache,
} from '@/features/vocabulary/services/translateService';

/**
 * Vocabulary Unit Tests
 * Tests for translation service and learning progress
 */

describe('TranslateService - Supported Languages', () => {
    it('should have at least 10 supported languages', () => {
        expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(10);
    });

    it('should include English', () => {
        const english = SUPPORTED_LANGUAGES.find((l) => l.code === 'en');
        expect(english).toBeDefined();
        expect(english?.name).toBe('English');
    });

    it('should include common languages', () => {
        const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
        expect(codes).toContain('es'); // Spanish
        expect(codes).toContain('fr'); // French
        expect(codes).toContain('de'); // German
        expect(codes).toContain('zh-CN'); // Chinese
    });

    it('should have unique language codes', () => {
        const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBe(codes.length);
    });
});

describe('TranslateService - getLanguageName', () => {
    it('should return language name for valid code', () => {
        expect(getLanguageName('en')).toBe('English');
        expect(getLanguageName('es')).toBe('Spanish');
    });

    it('should return code for unknown language', () => {
        expect(getLanguageName('xyz')).toBe('xyz');
    });
});

describe('TranslateService - Cache Functions', () => {
    beforeEach(() => {
        clearTranslationCache();
    });

    it('should return null for uncached translation', () => {
        const result = getCachedTranslation('hello', 'es', 'en');
        expect(result).toBeNull();
    });

    it('should clear cache successfully', () => {
        // Just verify clearTranslationCache doesn't throw
        expect(() => clearTranslationCache()).not.toThrow();
    });
});

describe('Vocabulary Learning Progress', () => {
    interface VocabItem {
        word: string;
        learned: boolean;
        reviewCount: number;
        lastReviewed?: Date;
    }

    const calculateMasteryLevel = (item: VocabItem): 'new' | 'learning' | 'mastered' => {
        if (!item.learned && item.reviewCount === 0) return 'new';
        if (item.reviewCount >= 5 && item.learned) return 'mastered';
        return 'learning';
    };

    it('should mark new items correctly', () => {
        const item: VocabItem = { word: 'ephemeral', learned: false, reviewCount: 0 };
        expect(calculateMasteryLevel(item)).toBe('new');
    });

    it('should mark learning items correctly', () => {
        const item: VocabItem = { word: 'ephemeral', learned: true, reviewCount: 2 };
        expect(calculateMasteryLevel(item)).toBe('learning');
    });

    it('should mark mastered items correctly', () => {
        const item: VocabItem = { word: 'ephemeral', learned: true, reviewCount: 5 };
        expect(calculateMasteryLevel(item)).toBe('mastered');
    });
});

describe('Vocabulary - Spaced Repetition Logic', () => {
    const calculateNextReviewDate = (
        correctCount: number,
        lastReview: Date
    ): Date => {
        // Simple spaced repetition: double the interval with each correct answer
        const baseInterval = 1; // 1 day
        const multiplier = Math.pow(2, correctCount);
        const daysUntilReview = Math.min(baseInterval * multiplier, 30); // Cap at 30 days

        const nextDate = new Date(lastReview);
        nextDate.setDate(nextDate.getDate() + daysUntilReview);
        return nextDate;
    };

    it('should set next review to 1 day for new item', () => {
        const today = new Date('2024-01-15');
        const nextReview = calculateNextReviewDate(0, today);
        expect(nextReview.getDate()).toBe(16);
    });

    it('should double interval for each correct answer', () => {
        const today = new Date('2024-01-15');

        const afterOne = calculateNextReviewDate(1, today);
        expect(afterOne.getDate() - today.getDate()).toBe(2);

        const afterTwo = calculateNextReviewDate(2, today);
        expect(afterTwo.getDate() - today.getDate()).toBe(4);
    });

    it('should cap interval at 30 days', () => {
        const today = new Date('2024-01-15');
        const afterMany = calculateNextReviewDate(10, today);

        const daysDiff = Math.round(
            (afterMany.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(daysDiff).toBe(30);
    });
});

describe('Vocabulary - Word Filtering', () => {
    interface VocabWord {
        word: string;
        definition: string;
        difficulty: 'easy' | 'medium' | 'hard';
        category: string;
    }

    const filterByDifficulty = (
        words: VocabWord[],
        difficulty: 'easy' | 'medium' | 'hard'
    ): VocabWord[] => {
        return words.filter((w) => w.difficulty === difficulty);
    };

    const filterByCategory = (words: VocabWord[], category: string): VocabWord[] => {
        return words.filter((w) => w.category.toLowerCase() === category.toLowerCase());
    };

    it('should filter words by difficulty', () => {
        const words: VocabWord[] = [
            { word: 'cat', definition: 'animal', difficulty: 'easy', category: 'animals' },
            { word: 'ephemeral', definition: 'short-lived', difficulty: 'hard', category: 'academic' },
            { word: 'run', definition: 'move fast', difficulty: 'easy', category: 'verbs' },
        ];

        const easyWords = filterByDifficulty(words, 'easy');
        expect(easyWords).toHaveLength(2);
    });

    it('should filter words by category', () => {
        const words: VocabWord[] = [
            { word: 'cat', definition: 'animal', difficulty: 'easy', category: 'animals' },
            { word: 'dog', definition: 'animal', difficulty: 'easy', category: 'animals' },
            { word: 'run', definition: 'move fast', difficulty: 'easy', category: 'verbs' },
        ];

        const animalWords = filterByCategory(words, 'animals');
        expect(animalWords).toHaveLength(2);
    });
});
