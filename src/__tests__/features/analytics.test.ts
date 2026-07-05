import { describe, it, expect } from 'vitest';
import { calculateScoreForecast } from '@/features/analytics/utils';
import { calculateErrorPatterns } from '@/services/testMetricsService';

/**
 * Analytics Unit Tests
 * Tests for score trending, skill analysis, and data processing
 */

describe('Analytics - Band Score Calculations', () => {
    // Helper functions to test analytics logic
    const calculateBandScore = (correct: number, total: number): number => {
        const percentage = total > 0 ? (correct / total) * 100 : 0;

        if (percentage >= 90) return 9;
        if (percentage >= 80) return 8;
        if (percentage >= 70) return 7;
        if (percentage >= 60) return 6;
        if (percentage >= 50) return 5;
        if (percentage >= 40) return 4;
        return 3;
    };

    it('should calculate band 9 for 90%+ correct', () => {
        expect(calculateBandScore(36, 40)).toBe(9);
    });

    it('should calculate band 7 for 70-79% correct', () => {
        expect(calculateBandScore(28, 40)).toBe(7);
    });

    it('should calculate band 5 for 50-59% correct', () => {
        expect(calculateBandScore(20, 40)).toBe(5);
    });

    it('should handle edge case of 0 questions', () => {
        expect(calculateBandScore(0, 0)).toBe(3);
    });
});

describe('Analytics - Moving Average', () => {
    const calculateMovingAverage = (scores: number[], window: number = 5): number => {
        if (scores.length === 0) return 0;
        const subset = scores.slice(-window);
        return subset.reduce((acc, val) => acc + val, 0) / subset.length;
    };

    it('should calculate moving average of last 5 scores', () => {
        const scores = [6, 6.5, 7, 7.5, 8];
        expect(calculateMovingAverage(scores)).toBe(7);
    });

    it('should handle fewer than 5 scores', () => {
        const scores = [6, 7, 8];
        expect(calculateMovingAverage(scores)).toBe(7);
    });

    it('should return 0 for empty scores', () => {
        expect(calculateMovingAverage([])).toBe(0);
    });

    it('should only use last N scores', () => {
        const scores = [5, 5, 5, 7, 8, 9, 10];
        expect(calculateMovingAverage(scores, 3)).toBeCloseTo(9);
    });
});

describe('Analytics - Skill Identification', () => {
    interface SkillScores {
        reading: number;
        writing: number;
        listening: number;
        speaking: number;
    }

    const identifyWeakestSkill = (scores: SkillScores): string => {
        const skills = Object.entries(scores);
        if (skills.length === 0) return 'unknown';

        return skills.reduce((weakest, current) => {
            return current[1] < weakest[1] ? current : weakest;
        })[0];
    };

    const identifyStrongestSkill = (scores: SkillScores): string => {
        const skills = Object.entries(scores);
        if (skills.length === 0) return 'unknown';

        return skills.reduce((strongest, current) => {
            return current[1] > strongest[1] ? current : strongest;
        })[0];
    };

    it('should identify reading as weakest skill', () => {
        const scores: SkillScores = { reading: 5.5, writing: 7, listening: 7.5, speaking: 6.5 };
        expect(identifyWeakestSkill(scores)).toBe('reading');
    });

    it('should identify listening as strongest skill', () => {
        const scores: SkillScores = { reading: 6, writing: 7, listening: 8, speaking: 6.5 };
        expect(identifyStrongestSkill(scores)).toBe('listening');
    });

    it('should handle equal scores (returns first match)', () => {
        const scores: SkillScores = { reading: 7, writing: 7, listening: 7, speaking: 7 };
        // When all equal, returns first in iteration order
        expect(typeof identifyWeakestSkill(scores)).toBe('string');
    });
});

describe('Analytics - Progress Tracking', () => {
    interface TestResult {
        date: string;
        score: number;
        skill: string;
    }

    const calculateProgressTrend = (
        results: TestResult[]
    ): 'improving' | 'declining' | 'stable' => {
        if (results.length < 2) return 'stable';

        const recentResults = results.slice(-5);
        const firstHalf = recentResults.slice(0, Math.floor(recentResults.length / 2));
        const secondHalf = recentResults.slice(Math.floor(recentResults.length / 2));

        const firstAvg = firstHalf.reduce((acc, r) => acc + r.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((acc, r) => acc + r.score, 0) / secondHalf.length;

        if (secondAvg - firstAvg >= 0.5) return 'improving';
        if (firstAvg - secondAvg >= 0.5) return 'declining';
        return 'stable';
    };

    it('should identify improving trend', () => {
        const results: TestResult[] = [
            { date: '2024-01-01', score: 5, skill: 'reading' },
            { date: '2024-01-02', score: 5.5, skill: 'reading' },
            { date: '2024-01-03', score: 6, skill: 'reading' },
            { date: '2024-01-04', score: 7, skill: 'reading' },
        ];
        expect(calculateProgressTrend(results)).toBe('improving');
    });

    it('should identify declining trend', () => {
        const results: TestResult[] = [
            { date: '2024-01-01', score: 8, skill: 'reading' },
            { date: '2024-01-02', score: 7, skill: 'reading' },
            { date: '2024-01-03', score: 6, skill: 'reading' },
            { date: '2024-01-04', score: 5, skill: 'reading' },
        ];
        expect(calculateProgressTrend(results)).toBe('declining');
    });

    it('should identify stable trend', () => {
        const results: TestResult[] = [
            { date: '2024-01-01', score: 7, skill: 'reading' },
            { date: '2024-01-02', score: 7.1, skill: 'reading' },
            { date: '2024-01-03', score: 6.9, skill: 'reading' },
            { date: '2024-01-04', score: 7, skill: 'reading' },
        ];
        expect(calculateProgressTrend(results)).toBe('stable');
    });

    it('should return stable for insufficient data', () => {
        const results: TestResult[] = [{ date: '2024-01-01', score: 7, skill: 'reading' }];
        expect(calculateProgressTrend(results)).toBe('stable');
    });
});

describe('Analytics - Time Analysis', () => {
    const calculateAverageTestTime = (testTimes: number[]): number => {
        if (testTimes.length === 0) return 0;
        return testTimes.reduce((acc, time) => acc + time, 0) / testTimes.length;
    };

    const isUnderTimeLimit = (time: number, limit: number): boolean => {
        return time <= limit;
    };

    it('should calculate average test time', () => {
        const times = [55, 58, 60, 62, 65]; // minutes
        expect(calculateAverageTestTime(times)).toBe(60);
    });

    it('should identify test under time limit', () => {
        expect(isUnderTimeLimit(55, 60)).toBe(true);
    });

    it('should identify test over time limit', () => {
        expect(isUnderTimeLimit(65, 60)).toBe(false);
    });
});

describe('Analytics - Data Quality Guards', () => {
    it('should include a real zero band score in score forecasts', () => {
        const sessions = [
            { score: 0, completed_at: '2026-01-01T00:00:00Z' },
            { score: 3, completed_at: '2026-01-02T00:00:00Z' },
            { score: 6, completed_at: '2026-01-03T00:00:00Z' },
        ];

        const forecast = calculateScoreForecast(sessions, 3, 7);

        expect(forecast).toHaveLength(3);
        expect(forecast[0]).toMatchObject({ date: 'Now', score: 3, isForecast: false });
    });

    it('should never return a negative unanswered count', () => {
        const patterns = calculateErrorPatterns(
            { answer_a: 'one', answer_b: 'two' },
            { answer_a: 'three', answer_b: 'four' },
            1,
            {},
            null
        );

        expect(patterns.unansweredCount).toBe(0);
    });
});
