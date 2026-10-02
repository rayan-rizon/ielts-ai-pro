import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  routeId: 'test-1',
  initialize: vi.fn(),
  start: vi.fn(),
  navigate: vi.fn(),
  user: { id: 'learner-1', settings: {} },
}));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: mocks.routeId }),
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ userProfile: mocks.user, loading: false }),
}));
vi.mock('@/features/testing/paired/PairedContext', () => ({ usePairedTest: () => null }));
vi.mock('@/lib/testInitializer', () => ({
  initializeTest: mocks.initialize,
  createTestSession: mocks.start,
  getObjectiveStartErrorMessage: (error) => error.message,
}));
vi.mock('@/features/testing/shared/services/TestSession', () => ({ TestSession: {} }));
vi.mock('@/features/testing/shared/services/objectiveTests', () => ({
  objectiveRequest: vi.fn(),
  serverScoringEnabled: () => false,
}));
vi.mock('@/services/adaptiveLearningService', () => ({ refreshLearningPathAfterTest: vi.fn() }));
vi.mock('@/lib/queryClient', () => ({ invalidateLearnerPracticeQueries: vi.fn() }));
vi.mock('@/lib/tracking', () => ({ trackAppEvent: vi.fn() }));
vi.mock('@/lib/apiCache', () => ({ removeFromCache: vi.fn() }));
vi.mock(
  '@/features/testing/listening/components/ListeningTest/context/ListeningTestContext',
  async () => {
    const { useListeningTestStore: store } =
      await import('@/features/testing/listening/store/useListeningTestStore');
    const { dispatchListeningAction, LISTENING_ACTIONS } =
      await import('@/features/testing/listening/store/listeningTestDispatcher');
    const controls = {
      dispatch: (action) => dispatchListeningAction(store, action),
      ACTIONS: LISTENING_ACTIONS,
      setAudioTimeRef: vi.fn(),
    };
    return { useListeningTestState: () => store(), useListeningTestDispatch: () => controls };
  }
);

import { useListeningTestLogic } from '@/features/testing/listening/components/ListeningTest/hooks/useListeningTestLogic';
import { useListeningTestStore as store } from '@/features/testing/listening/store/useListeningTestStore';

const testData = {
  id: 'test-1',
  content: [1, 2, 3, 4].map((section_number) => ({
    section_number,
    audio_url: `/part-${section_number}.mp3`,
  })),
};
const questions = Array.from({ length: 40 }, (_, index) => ({
  id: `q-${index + 1}`,
  type: 'multiple_choice',
  section: Math.floor(index / 10) + 1,
  question_number: index + 1,
}));

describe('Listening exam start and progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.routeId = 'test-1';
    mocks.navigate.mockImplementation((url) => {
      mocks.routeId = url.split('/').pop();
    });
    store.getState().resetTest();
    store.getState().setSession(null);
    store.getState().setError(null);
    vi.stubGlobal(
      'Audio',
      class {
        duration = 450;
        removeAttribute() {}
        load() {
          this.duration = NaN;
        }
        set src(value) {
          queueMicrotask(() => this.onloadedmetadata?.());
        }
      }
    );
    window.history.replaceState({}, '', '/listening-test/test-1');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts at Part 1 and advances through every part before review', async () => {
    mocks.initialize.mockResolvedValue({ testData, questions, session: null, user: mocks.user });
    mocks.start.mockImplementation(async (options) => ({
      id: 'new-session',
      test_mode: 'mock',
      created_at: new Date().toISOString(),
      content_data: {
        audio_durations: options.audioDurations,
        duration_seconds: options.durationSeconds,
      },
    }));
    const { result } = renderHook(() => useListeningTestLogic());
    await waitFor(() => expect(result.current.isAwaitingStart).toBe(true));
    await act(async () => {
      await result.current.handleStartTest('exam');
    });
    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({ audioDurations: [450, 450, 450, 450], durationSeconds: 1920 })
    );
    expect(store.getState().activePart).toBe(0);
    for (const part of [1, 2, 3]) {
      act(() => result.current.handleExamAudioEnded());
      expect(store.getState().activePart).toBe(part);
      expect(result.current.examReview).toBe(false);
    }
    act(() => result.current.handleExamAudioEnded());
    expect(result.current.examReview).toBe(true);
  });

  it.each([
    [15, 0, false],
    [470, 1, false],
    [950, 2, false],
    [1400, 3, false],
    [1815, 3, true],
  ])(
    'resumes null-duration attempts after %s seconds at part index %s',
    async (elapsed, expectedPart, review) => {
      mocks.initialize.mockResolvedValue({
        testData,
        questions,
        user: mocks.user,
        session: {
          id: 'broken-session',
          test_mode: 'mock',
          created_at: new Date(Date.now() - elapsed * 1000).toISOString(),
          duration_minutes: null,
          user_responses: { 'q-1': 'answer' },
          content_data: { audio_durations: [null, null, null, null], duration_seconds: null },
        },
      });
      const { result } = renderHook(() => useListeningTestLogic());
      await waitFor(() => expect(store.getState().session?.id).toBe('broken-session'));
      expect(store.getState().activePart).toBe(expectedPart);
      expect(store.getState().answers).toEqual({ 'q-1': 'answer' });
      expect(result.current.examReview).toBe(review);
      expect(store.getState().timeRemaining).toBeGreaterThanOrEqual(1920 - elapsed - 1);
      expect(mocks.start).not.toHaveBeenCalled();
    }
  );
});
