import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { callEdgeFunction, getPassageById, prefetchSpeakingTts, testSessionUpdate } = vi.hoisted(
  () => ({
    callEdgeFunction: vi.fn(),
    getPassageById: vi.fn(),
    prefetchSpeakingTts: vi.fn(),
    testSessionUpdate: vi.fn(),
  })
);

vi.mock('@/features/testing/shared/services/Passage', () => ({
  Passage: { getById: getPassageById },
}));
vi.mock('@/features/testing/shared/services/TestSession', () => ({
  TestSession: { update: testSessionUpdate },
}));
vi.mock('@/utils/api', () => ({ callEdgeFunction }));
vi.mock('@/features/testing/speaking/utils/speakingTtsPrefetch', () => ({
  prefetchSpeakingTts,
}));

const completedSession = {
  id: 'completed-speaking-session-00000001',
  passage_id: 'speaking-passage-1',
  test_type: 'speaking',
  is_completed: true,
  score: 6,
  evaluation_status: 'complete',
  answers: { timeLeft: 0, conversation: [] },
  content_data: {
    speakingVersion: 'v2',
    speakingMode: 'exam',
    finalEvaluation: { overallBand: 6, feedback: 'Saved report.' },
    allPartsConversation: { 1: [], 2: [], 3: [] },
  },
};

function buildSupabase() {
  return {
    from(table) {
      if (table === 'test_sessions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: completedSession, error: null }),
            }),
          }),
        };
      }
      if (table === 'questions') {
        return {
          select: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'part-1',
                    question_number: 1,
                    question_text: 'Introduction & Interview',
                    correct_answer: 'Do you work or study?',
                    table_data: { duration_minutes: 5 },
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

vi.mock('@/lib/supabase', () => ({ supabase: buildSupabase() }));

import useSpeakingTestInitialization from '@/features/testing/speaking/hooks/useSpeakingTestInitialization';

function createProps() {
  const setterNames = [
    'setAllParts',
    'setAllPartsAcousticMetrics',
    'setAllPartsConversation',
    'setConversation',
    'setCueCardTopic',
    'setCurrentPartNumber',
    'setCurrentQuestionIndex',
    'setError',
    'setFinalEvaluation',
    'setIsLoading',
    'setIsPart2Intro',
    'setIsPart2Prep',
    'setIsPartComplete',
    'setIsTestComplete',
    'setPrepTimeLeft',
    'setSession',
    'setSpeakingMode',
    'setSpeakingV2State',
    'setTestStarted',
    'setTestTitle',
    'setTimeLeft',
  ];
  const props = Object.fromEntries(setterNames.map((name) => [name, vi.fn()]));
  return {
    ...props,
    testId: completedSession.id,
    authLoading: false,
    authUser: { id: 'auth-user-1' },
    acousticMetricsRef: { current: {} },
    pendingGreetingRef: { current: null },
    checkCurrentQuota: vi.fn(),
    requestAutoStart: vi.fn(),
    requestFinalEvaluation: vi.fn(),
    speakText: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Speaking test initialization', () => {
  it('never reopens the microphone for an expired practice session', async () => {
    completedSession.is_completed = false;
    callEdgeFunction.mockResolvedValue({
      state: { status: 'expired', part: 1, revision: 0, remainingActiveSeconds: 466 },
      examinerText: 'Where did you grow up?',
    });
    const props = createProps();
    try {
      renderHook(() => useSpeakingTestInitialization(props));
      await waitFor(() => expect(props.setIsLoading).toHaveBeenCalledWith(false));
      expect(props.setError).toHaveBeenCalledWith(expect.stringMatching(/expired/i));
      expect(props.setTestStarted).not.toHaveBeenCalledWith(true);
      expect(props.requestAutoStart).not.toHaveBeenCalled();
    } finally {
      completedSession.is_completed = true;
    }
  });
  beforeEach(() => {
    window.history.replaceState({}, '', `/${completedSession.id}?view-score=true`);
    getPassageById.mockResolvedValue({ title: 'IELTS 21 Speaking 2026 Test 3' });
    callEdgeFunction.mockResolvedValue({
      state: { status: 'active', part: 3, revision: 8, expiresAt: '2026-08-31T00:00:00Z' },
      examinerText: 'An old examiner question',
    });
    vi.clearAllMocks();
  });

  it('opens the saved report for a completed V2 session without resuming the test', async () => {
    const props = createProps();
    renderHook(() => useSpeakingTestInitialization(props));

    await waitFor(() => expect(props.setIsTestComplete).toHaveBeenCalledWith(true));

    expect(props.setFinalEvaluation).toHaveBeenCalledWith(
      completedSession.content_data.finalEvaluation
    );
    expect(props.setIsLoading).toHaveBeenCalledWith(false);
    expect(props.setTestStarted).not.toHaveBeenCalledWith(true);
    expect(props.speakText).not.toHaveBeenCalled();
    expect(callEdgeFunction).not.toHaveBeenCalled();
  });
});
