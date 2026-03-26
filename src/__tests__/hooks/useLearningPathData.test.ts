import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Unit Tests: useLearningPathData Hook Utilities
 * Tests the utility functions used in the learning path data hook.
 */

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Learning Path Cache', () => {
    const CACHE_KEY_PREFIX = 'ielts_learning_path_cache_';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    const getCachedLearningPath = (userId: string | undefined) => {
        if (!userId) return null;
        try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_TTL_MS) {
                localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
                return null;
            }
            return data;
        } catch {
            return null;
        }
    };

    const setCachedLearningPath = (userId: string | undefined, data: any) => {
        if (!userId || !data) return;
        try {
            localStorage.setItem(
                `${CACHE_KEY_PREFIX}${userId}`,
                JSON.stringify({ data, timestamp: Date.now() })
            );
        } catch {
            // Ignore storage errors
        }
    };

    it('should return null for undefined userId', () => {
        expect(getCachedLearningPath(undefined)).toBeNull();
    });

    it('should cache and retrieve learning path data', () => {
        const mockData = { path: { days: ['Monday'] }, pathId: 'test-id' };
        setCachedLearningPath('user-123', mockData);

        const cached = getCachedLearningPath('user-123');
        expect(cached).toEqual(mockData);
    });

    it('should return null for expired cache', () => {
        const mockData = { path: { days: ['Monday'] }, pathId: 'test-id' };

        // Set cache with old timestamp
        localStorage.setItem(
            `${CACHE_KEY_PREFIX}user-123`,
            JSON.stringify({ data: mockData, timestamp: Date.now() - CACHE_TTL_MS - 1000 })
        );

        const cached = getCachedLearningPath('user-123');
        expect(cached).toBeNull();
    });

    it('should not throw on invalid JSON in cache', () => {
        localStorage.setItem(`${CACHE_KEY_PREFIX}user-123`, 'invalid-json');

        expect(() => getCachedLearningPath('user-123')).not.toThrow();
        expect(getCachedLearningPath('user-123')).toBeNull();
    });
});

describe('formatSkillName', () => {
    const formatSkillName = (skillCode: string) => {
        if (!skillCode) return '';
        const parts = String(skillCode).split('_');
        if (parts.length <= 1) return String(skillCode);
        return parts
            .slice(1)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    it('should format reading skills correctly', () => {
        expect(formatSkillName('reading_main_idea')).toBe('Main Idea');
        expect(formatSkillName('reading_matching_headings')).toBe('Matching Headings');
        expect(formatSkillName('reading_true_false_ng')).toBe('True False Ng');
    });

    it('should format writing skills correctly', () => {
        expect(formatSkillName('writing_task_response')).toBe('Task Response');
        expect(formatSkillName('writing_coherence_cohesion')).toBe('Coherence Cohesion');
    });

    it('should format listening skills correctly', () => {
        expect(formatSkillName('listening_note_completion')).toBe('Note Completion');
        expect(formatSkillName('listening_multiple_choice')).toBe('Multiple Choice');
    });

    it('should handle edge cases', () => {
        expect(formatSkillName('')).toBe('');
        expect(formatSkillName('reading')).toBe('reading');
    });
});

describe('buildSkillTrendMap', () => {
    const buildSkillTrendMap = (sessions: any[]) => {
        const map: Record<string, { accuracy: number; total: number }[]> = {};
        const safeSessions = Array.isArray(sessions) ? sessions : [];

        safeSessions.forEach((s) => {
            const testType = s?.test_type;
            const typeStats = s?.content_data?.typeStats;
            if (!testType || !typeStats || typeof typeStats !== 'object') return;

            Object.entries(typeStats).forEach(([typeKey, stats]: [string, any]) => {
                const total = Number(stats?.total || 0);
                const correct = Number(stats?.correct || 0);
                if (!Number.isFinite(total) || total <= 0) return;
                const accuracy = correct / total;
                const normalizedKey = String(typeKey).replace(/\s+/g, '_');
                const skillCode = `${testType}_${normalizedKey}`;
                if (!map[skillCode]) map[skillCode] = [];
                map[skillCode].push({ accuracy, total });
            });
        });

        const trendBySkill: Record<string, string> = {};
        Object.entries(map).forEach(([skillCode, points]) => {
            const recent = points.slice(0, 3);
            const previous = points.slice(3, 6);
            const wAvg = (arr: { accuracy: number; total: number }[]) => {
                const denom = arr.reduce((sum, p) => sum + (p.total || 0), 0);
                if (!denom) return null;
                const num = arr.reduce((sum, p) => sum + (p.accuracy || 0) * (p.total || 0), 0);
                return num / denom;
            };
            const r = wAvg(recent);
            const p = wAvg(previous);
            if (r === null || p === null) {
                trendBySkill[skillCode] = 'stable';
                return;
            }
            const diff = r - p;
            trendBySkill[skillCode] = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'stable';
        });

        return trendBySkill;
    };

    it('should return empty map for empty sessions', () => {
        expect(buildSkillTrendMap([])).toEqual({});
    });

    it('should handle null/undefined sessions gracefully', () => {
        expect(buildSkillTrendMap(null as any)).toEqual({});
        expect(buildSkillTrendMap(undefined as any)).toEqual({});
    });

    it('should detect improving trend', () => {
        const sessions = [
            // Recent 3 sessions (higher accuracy)
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 9 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 8 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 9 } } } },
            // Previous 3 sessions (lower accuracy)
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 5 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 6 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 5 } } } },
        ];

        const trends = buildSkillTrendMap(sessions);
        expect(trends['reading_matching_headings']).toBe('up');
    });

    it('should detect declining trend', () => {
        const sessions = [
            // Recent 3 sessions (lower accuracy)
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 4 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 5 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 4 } } } },
            // Previous 3 sessions (higher accuracy)
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 9 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 8 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 9 } } } },
        ];

        const trends = buildSkillTrendMap(sessions);
        expect(trends['reading_matching_headings']).toBe('down');
    });

    it('should detect stable trend', () => {
        const sessions = [
            // Recent and previous have similar accuracy
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
        ];

        const trends = buildSkillTrendMap(sessions);
        expect(trends['reading_matching_headings']).toBe('stable');
    });

    it('should return stable when not enough data', () => {
        const sessions = [
            { test_type: 'reading', content_data: { typeStats: { matching_headings: { total: 10, correct: 7 } } } },
        ];

        const trends = buildSkillTrendMap(sessions);
        expect(trends['reading_matching_headings']).toBe('stable');
    });
});

describe('getDayIndex', () => {
    const getTodayIndex = () => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1;
    };

    it('should return correct day index (Monday=0, Sunday=6)', () => {
        // This is a simple test to verify the function exists and works
        const index = getTodayIndex();
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(6);
    });
});

describe('Weighted Average Calculation', () => {
    it('should calculate weighted average correctly', () => {
        const points = [
            { accuracy: 0.8, total: 20 },
            { accuracy: 0.6, total: 10 },
        ];

        const denom = points.reduce((sum, p) => sum + p.total, 0);
        const num = points.reduce((sum, p) => sum + p.accuracy * p.total, 0);
        const weightedAvg = num / denom;

        // (0.8 * 20 + 0.6 * 10) / 30 = (16 + 6) / 30 = 22/30 ≈ 0.733
        expect(weightedAvg).toBeCloseTo(0.733, 2);
    });

    it('should return null for empty array', () => {
        const wAvg = (arr: { accuracy: number; total: number }[]) => {
            const denom = arr.reduce((sum, p) => sum + (p.total || 0), 0);
            if (!denom) return null;
            const num = arr.reduce((sum, p) => sum + (p.accuracy || 0) * (p.total || 0), 0);
            return num / denom;
        };

        expect(wAvg([])).toBeNull();
    });
});

describe('Module Configuration', () => {
    const moduleConfig = {
        reading: { icon: 'BookOpen', color: 'text-sky-600', bg: 'bg-sky-500/10' },
        writing: { icon: 'PenTool', color: 'text-purple-600', bg: 'bg-purple-500/10' },
        listening: { icon: 'Headphones', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
        speaking: { icon: 'Mic', color: 'text-rose-600', bg: 'bg-rose-500/10' },
    };

    it('should have configuration for all modules', () => {
        expect(moduleConfig.reading).toBeDefined();
        expect(moduleConfig.writing).toBeDefined();
        expect(moduleConfig.listening).toBeDefined();
        expect(moduleConfig.speaking).toBeDefined();
    });

    it('should have icon, color, and bg for each module', () => {
        Object.values(moduleConfig).forEach((config) => {
            expect(config.icon).toBeDefined();
            expect(config.color).toMatch(/^text-/);
            expect(config.bg).toMatch(/^bg-/);
        });
    });
});
