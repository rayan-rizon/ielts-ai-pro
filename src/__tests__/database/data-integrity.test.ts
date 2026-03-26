import { describe, it, expect } from 'vitest';

/**
 * Database Data Integrity Tests
 * Tests for data validation, constraints, and business rules
 */

describe('Data Validation - User Fields', () => {
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateRole = (role: string): boolean => {
        const validRoles = ['user', 'admin', 'premium'];
        return validRoles.includes(role);
    };

    const validateSubscriptionTier = (tier: string): boolean => {
        const validTiers = ['free', 'basic', 'pro', 'premium'];
        return validTiers.includes(tier);
    };

    const validateBandScore = (score: number): boolean => {
        return score >= 1 && score <= 9 && (score * 2) % 1 === 0;
    };

    it('should validate email format', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('')).toBe(false);
    });

    it('should validate user role', () => {
        expect(validateRole('user')).toBe(true);
        expect(validateRole('admin')).toBe(true);
        expect(validateRole('superuser')).toBe(false);
    });

    it('should validate subscription tier', () => {
        expect(validateSubscriptionTier('free')).toBe(true);
        expect(validateSubscriptionTier('premium')).toBe(true);
        expect(validateSubscriptionTier('enterprise')).toBe(false);
    });

    it('should validate IELTS band scores (1-9, half increments)', () => {
        expect(validateBandScore(7.5)).toBe(true);
        expect(validateBandScore(9)).toBe(true);
        expect(validateBandScore(1)).toBe(true);
        expect(validateBandScore(10)).toBe(false);
        expect(validateBandScore(0)).toBe(false);
        expect(validateBandScore(7.3)).toBe(false);
    });
});

describe('Data Validation - Test Sessions', () => {
    const validateTestType = (type: string): boolean => {
        const validTypes = ['reading', 'writing', 'listening', 'speaking'];
        return validTypes.includes(type.toLowerCase());
    };

    const validateScore = (score: number | null): boolean => {
        if (score === null) return true; // Not yet scored
        return score >= 0 && score <= 9;
    };

    const validateAnswers = (answers: any): boolean => {
        if (!answers) return true; // Empty answers allowed
        if (typeof answers !== 'object') return false;
        return true;
    };

    it('should validate test type', () => {
        expect(validateTestType('reading')).toBe(true);
        expect(validateTestType('WRITING')).toBe(true);
        expect(validateTestType('grammar')).toBe(false);
    });

    it('should validate score range', () => {
        expect(validateScore(7.5)).toBe(true);
        expect(validateScore(0)).toBe(true);
        expect(validateScore(null)).toBe(true);
        expect(validateScore(10)).toBe(false);
        expect(validateScore(-1)).toBe(false);
    });

    it('should validate answers JSONB structure', () => {
        expect(validateAnswers({ q1: 'A', q2: 'B' })).toBe(true);
        expect(validateAnswers(null)).toBe(true);
        expect(validateAnswers('invalid')).toBe(false);
    });
});

describe('Data Validation - Passages', () => {
    const validatePassage = (passage: {
        title: string;
        test_type: string;
        test_format: string;
        topic: string;
    }): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!passage.title || passage.title.trim().length === 0) {
            errors.push('Title is required');
        }

        const validTestTypes = ['reading', 'writing', 'listening', 'speaking'];
        if (!validTestTypes.includes(passage.test_type)) {
            errors.push('Invalid test type');
        }

        const validFormats = ['academic', 'general'];
        if (!validFormats.includes(passage.test_format)) {
            errors.push('Invalid test format');
        }

        if (!passage.topic || passage.topic.trim().length === 0) {
            errors.push('Topic is required');
        }

        return { valid: errors.length === 0, errors };
    };

    it('should validate complete passage data', () => {
        const passage = {
            title: 'Cambridge Test 1 - Passage 1',
            test_type: 'reading',
            test_format: 'academic',
            topic: 'science',
        };

        const result = validatePassage(passage);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject passage with missing title', () => {
        const passage = {
            title: '',
            test_type: 'reading',
            test_format: 'academic',
            topic: 'science',
        };

        const result = validatePassage(passage);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Title is required');
    });

    it('should reject passage with invalid test type', () => {
        const passage = {
            title: 'Test Passage',
            test_type: 'grammar',
            test_format: 'academic',
            topic: 'science',
        };

        const result = validatePassage(passage);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid test type');
    });
});

describe('Data Validation - Questions', () => {
    const validateQuestion = (question: {
        question_text: string;
        type: string;
        options?: any;
        correct_answer?: string;
    }): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!question.question_text || question.question_text.trim().length === 0) {
            errors.push('Question text is required');
        }

        const validTypes = [
            'multiple_choice',
            'true_false_not_given',
            'matching',
            'gap_fill',
            'short_answer',
            'sentence_completion',
            'table_completion',
            'flowchart',
        ];
        if (!validTypes.includes(question.type)) {
            errors.push('Invalid question type');
        }

        // Multiple choice questions need options
        if (question.type === 'multiple_choice' && !question.options) {
            errors.push('Multiple choice questions require options');
        }

        return { valid: errors.length === 0, errors };
    };

    it('should validate multiple choice question', () => {
        const question = {
            question_text: 'What is the main idea?',
            type: 'multiple_choice',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
        };

        const result = validateQuestion(question);
        expect(result.valid).toBe(true);
    });

    it('should reject multiple choice without options', () => {
        const question = {
            question_text: 'What is the main idea?',
            type: 'multiple_choice',
        };

        const result = validateQuestion(question);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Multiple choice questions require options');
    });

    it('should validate gap fill question', () => {
        const question = {
            question_text: 'The _____ jumped over the fence.',
            type: 'gap_fill',
            correct_answer: 'cat',
        };

        const result = validateQuestion(question);
        expect(result.valid).toBe(true);
    });
});

describe('Data Validation - Promo Codes', () => {
    const validatePromoCode = (code: string): boolean => {
        // Code should be 4-20 chars, alphanumeric and dashes only
        const codeRegex = /^[A-Z0-9-]{4,20}$/;
        return codeRegex.test(code.toUpperCase());
    };

    const validateDiscount = (discount: number): boolean => {
        return discount > 0 && discount <= 100;
    };

    it('should validate promo code format', () => {
        expect(validatePromoCode('SAVE20')).toBe(true);
        expect(validatePromoCode('IELTS-PRO-50')).toBe(true);
        expect(validatePromoCode('AB')).toBe(false); // Too short
        expect(validatePromoCode('invalid code!')).toBe(false); // Special chars
    });

    it('should validate discount percentage', () => {
        expect(validateDiscount(20)).toBe(true);
        expect(validateDiscount(100)).toBe(true);
        expect(validateDiscount(0)).toBe(false);
        expect(validateDiscount(150)).toBe(false);
    });
});

describe('Data Integrity - UUID Format', () => {
    const isValidUUID = (id: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    };

    it('should validate UUID v4 format', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isValidUUID('invalid-uuid')).toBe(false);
        expect(isValidUUID('')).toBe(false);
    });
});

describe('Data Integrity - Timestamps', () => {
    const isValidISODate = (dateStr: string): boolean => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    };

    const isCreatedBeforeUpdated = (created: string, updated: string): boolean => {
        return new Date(created) <= new Date(updated);
    };

    it('should validate ISO date format', () => {
        expect(isValidISODate('2024-01-15T10:30:00Z')).toBe(true);
        expect(isValidISODate('invalid-date')).toBe(false);
    });

    it('should ensure created_at <= updated_at', () => {
        expect(isCreatedBeforeUpdated('2024-01-01', '2024-01-15')).toBe(true);
        expect(isCreatedBeforeUpdated('2024-01-15', '2024-01-01')).toBe(false);
    });
});
