import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { registerWritingDraftFlusher } from '@/features/testing/writing/writingDraftFlush';

const recovery = vi.hoisted(() => ({
  session: null,
  writes: [],
  saveNow: vi.fn(),
  evaluate: vi.fn(),
}));
vi.mock('@/features/testing/writing/components/WritingTest/context/WritingTestContext', () => ({
  useWritingTestDispatch: () => ({ saveNow: recovery.saveNow }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock('@/utils/api', () => ({
  generateDetailedFeedback: (...args) => recovery.evaluate(...args),
}));
vi.mock('@/hooks/useDataQuery', () => ({ removeFromCache: vi.fn() }));
vi.mock('@/lib/tracking', () => ({ trackAppEvent: vi.fn() }));
vi.mock('@/services/adaptiveLearningService', () => ({
  refreshLearningPathAfterTest: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'auth-1' } } }) },
    rpc: async () => ({ data: { allowed: false, daily_remaining: 0, monthly_remaining: 0 } }),
    from: (table) => {
      let payload;
      const query = {
        update: (value) => {
          payload = value;
          recovery.writes.push(value);
          return query;
        },
        eq: () => query,
        in: () => query,
        select: () => query,
        single: async () => ({ data: { id: 'learner-1', subscription_tier: 'free' } }),
        maybeSingle: async () => ({
          data:
            table === 'test_sessions'
              ? payload?.evaluation_status === 'complete'
                ? { id: recovery.session.id }
                : payload
                  ? null
                  : recovery.session
              : null,
          error: null,
        }),
      };
      return query;
    },
  },
}));

import { useWritingFeedback } from '@/features/testing/writing/components/WritingTest/hooks/useWritingFeedback';

describe('main Writing pending recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recovery.writes = [];
    recovery.session = {
      id: 'pending-session',
      test_type: 'writing',
      evaluation_status: 'pending',
      is_completed: false,
      content_data: {
        evaluationRequestedAt: new Date().toISOString(),
        ai_feedbacks: { 'Task 1': { overallBand: 8 } },
      },
    };
    useWritingTestStore.getState().fullReset();
    useWritingTestStore.setState({
      session: recovery.session,
      drafts: { 'Task 1': 'report '.repeat(160), 'Task 2': 'essay '.repeat(260) },
      compositeTasks: {
        'Task 1': { prompt: 'Chart prompt' },
        'Task 2': { prompt: 'Essay prompt' },
      },
      activeType: 'Task 2',
      feedbacks: recovery.session.content_data.ai_feedbacks,
    });
    recovery.evaluate.mockImplementation(async ({ taskType }) => ({
      success: true,
      data: {
        overallBand: taskType === 'Task 1' ? 8 : 7,
        evaluationVersion: CURRENT_EVALUATION_VERSION,
        criteriaScores: {
          TaskResponse: 7,
          TaskAchievement: 8,
          CoherenceAndCohesion: 7,
          LexicalResource: 7,
          GrammaticalRangeAndAccuracy: 7,
        },
      },
    }));
  });

  it('rejoins both jobs with their original generation and saves weighted completion despite exhausted quota', async () => {
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.saveNow).not.toHaveBeenCalled();
    expect(recovery.evaluate).toHaveBeenCalledTimes(2);
    for (const [payload] of recovery.evaluate.mock.calls) {
      expect(payload).toMatchObject({
        sessionId: 'pending-session',
        evaluationRequestedAt: recovery.session.content_data.evaluationRequestedAt,
      });
    }
    const completion = recovery.writes.find((value) => value.evaluation_status === 'complete');
    expect(completion).toMatchObject({
      is_completed: true,
      score: 7.5,
      content_data: { task1Band: 8, task2Band: 7 },
    });
    expect(useWritingTestStore.getState()).toMatchObject({
      isCompleted: true,
      showUpgradeDialog: false,
    });
    expect(awardXP).toHaveBeenCalledTimes(1);
  });

  it('includes the newly typed Task 2 even when its debounced store update has not run', async () => {
    const latestEssay = 'last words '.repeat(140);
    useWritingTestStore.getState().setDraft('Task 2', '');
    const unregister = registerWritingDraftFlusher(() =>
      useWritingTestStore.getState().setDraft('Task 2', latestEssay)
    );
    try {
      const { result } = renderHook(() => useWritingFeedback(vi.fn()));
      await act(async () => result.current.handleGetFeedback());
      const task2Call = recovery.evaluate.mock.calls.find(
        ([payload]) => payload.taskType === 'Task 2'
      );
      expect(task2Call?.[0].writingText).toBe(latestEssay.trim());
      expect(recovery.writes.find((value) => value.evaluation_status === 'complete')).toMatchObject(
        { content_data: { task1Band: 8, task2Band: 7 } }
      );
    } finally {
      unregister();
    }
  });
});
