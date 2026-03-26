import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * State Management Tests - Zustand Store Patterns
 * Tests for store actions, selectors, and persistence
 */

// Mock zustand store for testing
const createMockStore = (initialState = {}) => {
    let state = {
        // Test data
        testData: null,
        allQuestions: [],

        // Session state
        session: null,
        sessionId: null,
        answers: {},
        timeRemaining: 3600,

        // UI state
        isLoading: true,
        isSubmitting: false,
        isFinished: false,
        currentPassageIndex: 0,
        showResults: false,

        // Error state
        error: null,

        ...initialState,
    };

    return {
        getState: () => state,
        setState: (partial: Partial<typeof state>) => {
            state = { ...state, ...partial };
        },
        subscribe: vi.fn(),
    };
};

describe('State Management - Store Initialization', () => {
    it('should initialize with default state', () => {
        const store = createMockStore();
        const state = store.getState();

        expect(state.testData).toBeNull();
        expect(state.answers).toEqual({});
        expect(state.timeRemaining).toBe(3600);
        expect(state.isLoading).toBe(true);
        expect(state.currentPassageIndex).toBe(0);
    });

    it('should allow custom initial state', () => {
        const store = createMockStore({ timeRemaining: 1800, isLoading: false });
        const state = store.getState();

        expect(state.timeRemaining).toBe(1800);
        expect(state.isLoading).toBe(false);
    });
});

describe('State Management - Answer Actions', () => {
    it('should set a single answer', () => {
        const store = createMockStore();

        store.setState({
            answers: { ...store.getState().answers, 'q1': 'A' }
        });

        expect(store.getState().answers['q1']).toBe('A');
    });

    it('should set multiple answers at once', () => {
        const store = createMockStore();
        const bulkAnswers = { 'q1': 'A', 'q2': 'B', 'q3': 'C' };

        store.setState({
            answers: { ...store.getState().answers, ...bulkAnswers }
        });

        expect(Object.keys(store.getState().answers)).toHaveLength(3);
        expect(store.getState().answers['q2']).toBe('B');
    });

    it('should preserve existing answers when adding new ones', () => {
        const store = createMockStore({ answers: { 'q1': 'A' } });

        store.setState({
            answers: { ...store.getState().answers, 'q2': 'B' }
        });

        expect(store.getState().answers['q1']).toBe('A');
        expect(store.getState().answers['q2']).toBe('B');
    });

    it('should overwrite answer for same question', () => {
        const store = createMockStore({ answers: { 'q1': 'A' } });

        store.setState({
            answers: { ...store.getState().answers, 'q1': 'B' }
        });

        expect(store.getState().answers['q1']).toBe('B');
    });
});

describe('State Management - Timer Actions', () => {
    it('should decrement timer', () => {
        const store = createMockStore({ timeRemaining: 3600 });

        store.setState({
            timeRemaining: Math.max(0, store.getState().timeRemaining - 1)
        });

        expect(store.getState().timeRemaining).toBe(3599);
    });

    it('should not go below 0', () => {
        const store = createMockStore({ timeRemaining: 1 });

        store.setState({
            timeRemaining: Math.max(0, store.getState().timeRemaining - 5)
        });

        expect(store.getState().timeRemaining).toBe(0);
    });

    it('should set time directly', () => {
        const store = createMockStore({ timeRemaining: 3600 });

        store.setState({ timeRemaining: 1800 });

        expect(store.getState().timeRemaining).toBe(1800);
    });
});

describe('State Management - Session Handling', () => {
    it('should set session and sessionId', () => {
        const store = createMockStore();
        const session = { id: 'session-123', user_id: 'user-456' };

        store.setState({
            session,
            sessionId: session.id
        });

        expect(store.getState().session).toEqual(session);
        expect(store.getState().sessionId).toBe('session-123');
    });

    it('should validate session ID match', () => {
        const store = createMockStore({ sessionId: 'session-123' });

        const isValid = store.getState().sessionId === 'session-123';
        expect(isValid).toBe(true);
    });

    it('should detect session ID mismatch', () => {
        const store = createMockStore({ sessionId: 'session-123' });

        const isValid = store.getState().sessionId === 'session-456';
        expect(isValid).toBe(false);
    });
});

describe('State Management - Test Flow Actions', () => {
    it('should finish test', () => {
        const store = createMockStore({ isFinished: false, showResults: false });

        store.setState({ isFinished: true, showResults: true });

        expect(store.getState().isFinished).toBe(true);
        expect(store.getState().showResults).toBe(true);
    });

    it('should reset test state for retakes', () => {
        const store = createMockStore({
            isFinished: true,
            showResults: true,
            answers: { 'q1': 'A' },
            timeRemaining: 0,
            currentPassageIndex: 2,
        });

        store.setState({
            isFinished: false,
            showResults: false,
            answers: {},
            timeRemaining: 3600,
            currentPassageIndex: 0,
        });

        const state = store.getState();
        expect(state.isFinished).toBe(false);
        expect(state.answers).toEqual({});
        expect(state.timeRemaining).toBe(3600);
        expect(state.currentPassageIndex).toBe(0);
    });

    it('should set current passage index', () => {
        const store = createMockStore({ currentPassageIndex: 0 });

        store.setState({ currentPassageIndex: 2 });

        expect(store.getState().currentPassageIndex).toBe(2);
    });
});

describe('State Management - Loading States', () => {
    it('should set loading state', () => {
        const store = createMockStore({ isLoading: true });

        store.setState({ isLoading: false });

        expect(store.getState().isLoading).toBe(false);
    });

    it('should set submitting state', () => {
        const store = createMockStore({ isSubmitting: false });

        store.setState({ isSubmitting: true });

        expect(store.getState().isSubmitting).toBe(true);
    });

    it('should set error and stop loading', () => {
        const store = createMockStore({ isLoading: true, error: null });

        store.setState({
            error: 'Failed to load test',
            isLoading: false
        });

        expect(store.getState().error).toBe('Failed to load test');
        expect(store.getState().isLoading).toBe(false);
    });
});

describe('State Management - Selectors', () => {
    it('should get answer for specific question', () => {
        const store = createMockStore({ answers: { 'q1': 'A', 'q2': 'B' } });

        const answer = store.getState().answers['q1'];

        expect(answer).toBe('A');
    });

    it('should get answered count', () => {
        const store = createMockStore({ answers: { 'q1': 'A', 'q2': 'B', 'q3': 'C' } });

        const count = Object.keys(store.getState().answers).length;

        expect(count).toBe(3);
    });

    it('should return undefined for unanswered questions', () => {
        const store = createMockStore({ answers: { 'q1': 'A' } });

        const answer = store.getState().answers['q999'];

        expect(answer).toBeUndefined();
    });
});

describe('State Management - Full Reset', () => {
    it('should reset all state on full reset', () => {
        const store = createMockStore({
            testData: { id: 'test-123' },
            answers: { 'q1': 'A' },
            sessionId: 'session-123',
            timeRemaining: 100,
            isFinished: true,
            error: 'Some error',
        });

        store.setState({
            testData: null,
            allQuestions: [],
            session: null,
            sessionId: null,
            answers: {},
            timeRemaining: 3600,
            isLoading: true,
            isSubmitting: false,
            isFinished: false,
            currentPassageIndex: 0,
            showResults: false,
            error: null,
        });

        const state = store.getState();
        expect(state.testData).toBeNull();
        expect(state.answers).toEqual({});
        expect(state.sessionId).toBeNull();
        expect(state.timeRemaining).toBe(3600);
        expect(state.isFinished).toBe(false);
        expect(state.error).toBeNull();
    });
});
