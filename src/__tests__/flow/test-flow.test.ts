import { describe, it, expect } from 'vitest';

/**
 * Flow Logic Tests
 * Tests for test-taking flow, navigation, and submission logic
 */

describe('Test Flow - Navigation Logic', () => {
    interface TestState {
        currentPassageIndex: number;
        totalPassages: number;
        isFinished: boolean;
    }

    const canNavigateNext = (state: TestState): boolean => {
        return state.currentPassageIndex < state.totalPassages - 1 && !state.isFinished;
    };

    const canNavigatePrevious = (state: TestState): boolean => {
        return state.currentPassageIndex > 0 && !state.isFinished;
    };

    it('should allow next navigation when not at end', () => {
        const state: TestState = { currentPassageIndex: 0, totalPassages: 3, isFinished: false };
        expect(canNavigateNext(state)).toBe(true);
    });

    it('should block next navigation at last passage', () => {
        const state: TestState = { currentPassageIndex: 2, totalPassages: 3, isFinished: false };
        expect(canNavigateNext(state)).toBe(false);
    });

    it('should allow previous navigation when not at start', () => {
        const state: TestState = { currentPassageIndex: 1, totalPassages: 3, isFinished: false };
        expect(canNavigatePrevious(state)).toBe(true);
    });

    it('should block previous navigation at first passage', () => {
        const state: TestState = { currentPassageIndex: 0, totalPassages: 3, isFinished: false };
        expect(canNavigatePrevious(state)).toBe(false);
    });

    it('should block all navigation when test is finished', () => {
        const state: TestState = { currentPassageIndex: 1, totalPassages: 3, isFinished: true };
        expect(canNavigateNext(state)).toBe(false);
        expect(canNavigatePrevious(state)).toBe(false);
    });
});

describe('Test Flow - Timer Logic', () => {
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isTimeWarning = (timeRemaining: number, thresholdMinutes: number = 5): boolean => {
        return timeRemaining <= thresholdMinutes * 60 && timeRemaining > 0;
    };

    const isTimeExpired = (timeRemaining: number): boolean => {
        return timeRemaining <= 0;
    };

    it('should format time correctly', () => {
        expect(formatTime(3600)).toBe('60:00');
        expect(formatTime(125)).toBe('02:05');
        expect(formatTime(0)).toBe('00:00');
    });

    it('should detect time warning period', () => {
        expect(isTimeWarning(300)).toBe(true);  // 5 minutes
        expect(isTimeWarning(60)).toBe(true);   // 1 minute
        expect(isTimeWarning(600)).toBe(false); // 10 minutes
        expect(isTimeWarning(0)).toBe(false);   // Expired
    });

    it('should detect expired time', () => {
        expect(isTimeExpired(0)).toBe(true);
        expect(isTimeExpired(-1)).toBe(true);
        expect(isTimeExpired(1)).toBe(false);
    });
});

describe('Test Flow - Answer Validation', () => {
    interface Question {
        id: string;
        type: string;
        required: boolean;
    }

    const validateAnswer = (answer: any, questionType: string): boolean => {
        if (answer === undefined || answer === null) return false;

        switch (questionType) {
            case 'multiple_choice':
                return typeof answer === 'string' && ['A', 'B', 'C', 'D'].includes(answer);
            case 'true_false_not_given':
                return typeof answer === 'string' && ['TRUE', 'FALSE', 'NOT GIVEN'].includes(answer);
            case 'gap_fill':
                return typeof answer === 'string' && answer.trim().length > 0;
            case 'matching':
                return typeof answer === 'string' || typeof answer === 'number';
            default:
                return answer !== undefined && answer !== null;
        }
    };

    it('should validate multiple choice answers', () => {
        expect(validateAnswer('A', 'multiple_choice')).toBe(true);
        expect(validateAnswer('E', 'multiple_choice')).toBe(false);
        expect(validateAnswer(null, 'multiple_choice')).toBe(false);
    });

    it('should validate true/false/not given answers', () => {
        expect(validateAnswer('TRUE', 'true_false_not_given')).toBe(true);
        expect(validateAnswer('FALSE', 'true_false_not_given')).toBe(true);
        expect(validateAnswer('NOT GIVEN', 'true_false_not_given')).toBe(true);
        expect(validateAnswer('MAYBE', 'true_false_not_given')).toBe(false);
    });

    it('should validate gap fill answers', () => {
        expect(validateAnswer('answer text', 'gap_fill')).toBe(true);
        expect(validateAnswer('', 'gap_fill')).toBe(false);
        expect(validateAnswer('   ', 'gap_fill')).toBe(false);
    });

    it('should validate matching answers', () => {
        expect(validateAnswer('A', 'matching')).toBe(true);
        expect(validateAnswer(1, 'matching')).toBe(true);
    });
});

describe('Test Flow - Progress Calculation', () => {
    interface ProgressState {
        answers: Record<string, any>;
        totalQuestions: number;
    }

    const calculateProgress = (state: ProgressState): number => {
        const answered = Object.keys(state.answers).length;
        return state.totalQuestions > 0 ? (answered / state.totalQuestions) * 100 : 0;
    };

    const getUnansweredQuestions = (
        questionIds: string[],
        answers: Record<string, any>
    ): string[] => {
        return questionIds.filter(id => !answers[id]);
    };

    it('should calculate progress percentage', () => {
        const state: ProgressState = {
            answers: { 'q1': 'A', 'q2': 'B' },
            totalQuestions: 10
        };
        expect(calculateProgress(state)).toBe(20);
    });

    it('should return 0 for no answers', () => {
        const state: ProgressState = { answers: {}, totalQuestions: 10 };
        expect(calculateProgress(state)).toBe(0);
    });

    it('should return 100 for all answered', () => {
        const state: ProgressState = {
            answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C' },
            totalQuestions: 3
        };
        expect(calculateProgress(state)).toBe(100);
    });

    it('should find unanswered questions', () => {
        const questionIds = ['q1', 'q2', 'q3', 'q4'];
        const answers = { 'q1': 'A', 'q3': 'C' };

        const unanswered = getUnansweredQuestions(questionIds, answers);
        expect(unanswered).toEqual(['q2', 'q4']);
    });
});

describe('Test Flow - Submission Logic', () => {
    interface SubmissionState {
        answers: Record<string, any>;
        totalQuestions: number;
        timeRemaining: number;
        isSubmitting: boolean;
    }

    const canSubmit = (state: SubmissionState): { allowed: boolean; reason?: string } => {
        if (state.isSubmitting) {
            return { allowed: false, reason: 'Already submitting' };
        }

        const answeredCount = Object.keys(state.answers).length;
        const progress = (answeredCount / state.totalQuestions) * 100;

        // Allow submit if time expired OR user has answered at least some questions
        if (state.timeRemaining <= 0) {
            return { allowed: true, reason: 'Time expired' };
        }

        if (progress < 100) {
            return {
                allowed: true,
                reason: `${100 - progress}% unanswered`
            };
        }

        return { allowed: true };
    };

    it('should allow submission when all answered', () => {
        const state: SubmissionState = {
            answers: { 'q1': 'A', 'q2': 'B' },
            totalQuestions: 2,
            timeRemaining: 1000,
            isSubmitting: false
        };
        expect(canSubmit(state).allowed).toBe(true);
    });

    it('should allow submission with partial answers', () => {
        const state: SubmissionState = {
            answers: { 'q1': 'A' },
            totalQuestions: 10,
            timeRemaining: 1000,
            isSubmitting: false
        };
        const result = canSubmit(state);
        expect(result.allowed).toBe(true);
        expect(result.reason).toContain('unanswered');
    });

    it('should allow submission when time expires', () => {
        const state: SubmissionState = {
            answers: {},
            totalQuestions: 10,
            timeRemaining: 0,
            isSubmitting: false
        };
        const result = canSubmit(state);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe('Time expired');
    });

    it('should block submission while already submitting', () => {
        const state: SubmissionState = {
            answers: { 'q1': 'A' },
            totalQuestions: 1,
            timeRemaining: 1000,
            isSubmitting: true
        };
        expect(canSubmit(state).allowed).toBe(false);
    });
});

describe('Test Flow - Scoring Logic', () => {
    interface ScoringResult {
        correct: number;
        total: number;
        percentage: number;
        bandScore: number;
    }

    const calculateScore = (
        answers: Record<string, string>,
        correctAnswers: Record<string, string>
    ): ScoringResult => {
        let correct = 0;
        const total = Object.keys(correctAnswers).length;

        for (const [questionId, correctAnswer] of Object.entries(correctAnswers)) {
            const userAnswer = answers[questionId];
            if (userAnswer && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
                correct++;
            }
        }

        const percentage = total > 0 ? (correct / total) * 100 : 0;

        // IELTS band score conversion (simplified)
        let bandScore: number;
        if (percentage >= 90) bandScore = 9;
        else if (percentage >= 80) bandScore = 8;
        else if (percentage >= 70) bandScore = 7;
        else if (percentage >= 60) bandScore = 6;
        else if (percentage >= 50) bandScore = 5;
        else if (percentage >= 40) bandScore = 4;
        else bandScore = 3;

        return { correct, total, percentage, bandScore };
    };

    it('should calculate perfect score', () => {
        const answers = { 'q1': 'A', 'q2': 'B' };
        const correct = { 'q1': 'A', 'q2': 'B' };

        const result = calculateScore(answers, correct);
        expect(result.correct).toBe(2);
        expect(result.percentage).toBe(100);
        expect(result.bandScore).toBe(9);
    });

    it('should calculate partial score', () => {
        const answers = { 'q1': 'A', 'q2': 'C' };
        const correct = { 'q1': 'A', 'q2': 'B' };

        const result = calculateScore(answers, correct);
        expect(result.correct).toBe(1);
        expect(result.percentage).toBe(50);
        expect(result.bandScore).toBe(5);
    });

    it('should handle case-insensitive matching', () => {
        const answers = { 'q1': 'cat' };
        const correct = { 'q1': 'CAT' };

        const result = calculateScore(answers, correct);
        expect(result.correct).toBe(1);
    });

    it('should handle missing answers', () => {
        const answers = { 'q1': 'A' };
        const correct = { 'q1': 'A', 'q2': 'B', 'q3': 'C' };

        const result = calculateScore(answers, correct);
        expect(result.correct).toBe(1);
        expect(result.total).toBe(3);
    });
});
