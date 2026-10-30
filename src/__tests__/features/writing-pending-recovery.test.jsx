import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { registerWritingDraftFlusher } from '@/features/testing/writing/writingDraftFlush';
import { trackAppEvent } from '@/lib/tracking';

const recovery = vi.hoisted(() => ({
  session: null,
  writes: [],
  saveNow: vi.fn(),
  evaluate: vi.fn(),
  failureWriteError: null,
  rejectFailureWrite: false,
  onFailureWrite: null,
  completionWriteError: null,
  onCompletionWrite: null,
  onClaimWrite: null,
  quotaAllowed: false,
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
vi.mock('@/lib/supabase', () => {
  function sessionField(key) {
    return key.includes('->>')
      ? recovery.session?.content_data?.[key.split('->>')[1]]
      : recovery.session?.[key];
  }

  async function beforeFailureWrite() {
    await recovery.onFailureWrite?.();
    if (recovery.rejectFailureWrite) throw new Error('Failure persistence disconnected');
    return recovery.failureWriteError;
  }

  async function beforeCompletionWrite() {
    await recovery.onCompletionWrite?.();
    return recovery.completionWriteError;
  }

  async function beforeClaimWrite() {
    await recovery.onClaimWrite?.();
    return null;
  }

  const beforeWrite = {
    pending: beforeClaimWrite,
    failed: beforeFailureWrite,
    complete: beforeCompletionWrite,
  };

  function publishWrite(payload) {
    if (!payload) return;
    recovery.writes.push(payload);
    recovery.session = { ...recovery.session, ...payload };
  }

  function createQuery(table) {
    let payload;
    const filters = [];
    const matches = () => filters.every(([key, values]) => values.includes(sessionField(key)));
    const execute = async () => {
      if (table !== 'test_sessions') return { data: null, error: null };
      const error = await beforeWrite[payload?.evaluation_status]?.();
      if (error) return { data: null, error };
      if (!matches()) return { data: null, error: null };
      publishWrite(payload);
      return { data: structuredClone(recovery.session), error: null };
    };
    const query = {
      update: (value) => {
        payload = value;
        return query;
      },
      eq: (key, value) => {
        filters.push([key, [value]]);
        return query;
      },
      is: (key, value) => {
        filters.push([key, [value]]);
        return query;
      },
      in: (key, values) => {
        filters.push([key, values]);
        return query;
      },
      select: () => query,
      single: async () => ({ data: { id: 'learner-1', subscription_tier: 'free' } }),
      maybeSingle: execute,
      then: (resolve, reject) => execute().then(resolve, reject),
    };
    return query;
  }

  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'auth-1' } } }) },
      rpc: async () => ({
        data: {
          allowed: recovery.quotaAllowed,
          daily_remaining: recovery.quotaAllowed ? 10 : 0,
          monthly_remaining: recovery.quotaAllowed ? 20 : 0,
        },
      }),
      from: createQuery,
    },
  };
});

import { useWritingFeedback } from '@/features/testing/writing/components/WritingTest/hooks/useWritingFeedback';

describe('main Writing pending recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recovery.writes = [];
    recovery.failureWriteError = null;
    recovery.rejectFailureWrite = false;
    recovery.onFailureWrite = null;
    recovery.completionWriteError = null;
    recovery.onCompletionWrite = null;
    recovery.onClaimWrite = null;
    recovery.quotaAllowed = false;
    recovery.session = {
      id: 'pending-session',
      test_type: 'writing',
      evaluation_status: 'pending',
      is_completed: false,
      updated_at: '2026-10-30T00:00:00.000Z',
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

  function failTask2(error, beforeFailure) {
    const succeed = recovery.evaluate.getMockImplementation();
    recovery.evaluate.mockImplementation(async (payload) => {
      if (payload.taskType === 'Task 2') {
        beforeFailure?.();
        throw error;
      }
      return succeed(payload);
    });
  }

  it('preserves successful partial feedback when the other task has a provider failure', async () => {
    const error = Object.assign(new Error('Provider temporarily unavailable'), {
      status: 429,
      rateLimitType: 'provider',
    });
    failTask2(error);
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.session).toMatchObject({
      evaluation_status: 'failed',
      content_data: {
        ai_feedbacks: {
          'Task 1': { overallBand: 8, evaluationVersion: CURRENT_EVALUATION_VERSION },
        },
        evaluationFailure: { category: 'provider', attemptedTasks: ['Task 1', 'Task 2'] },
      },
    });
    expect(useWritingTestStore.getState()).toMatchObject({
      session: { evaluation_status: 'failed' },
      feedbacks: { 'Task 1': { overallBand: 8, evaluationVersion: CURRENT_EVALUATION_VERSION } },
      feedbackError: error.message,
      showUpgradeDialog: false,
      isAnalyzing: false,
    });
    expect(recovery.writes.filter((write) => write.evaluation_status === 'failed')).toHaveLength(1);
    expect(awardXP).not.toHaveBeenCalled();
  });

  it('still shows the upgrade dialog for learner quota failure', async () => {
    failTask2(
      Object.assign(new Error('Writing allowance exhausted'), {
        status: 429,
        rateLimitType: 'quota',
      })
    );
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(useWritingTestStore.getState().showUpgradeDialog).toBe(true);
    expect(recovery.session.content_data.evaluationFailure.category).toBe('quota');
    expect(awardXP).not.toHaveBeenCalled();
  });

  it.each(['resolved error', 'rejected promise'])(
    'contains failure persistence %s and preserves the original learner error',
    async (mode) => {
      if (mode === 'resolved error')
        recovery.failureWriteError = { message: 'Database unavailable' };
      else recovery.rejectFailureWrite = true;
      failTask2(new Error('Original provider failure'));
      const { result } = renderHook(() => useWritingFeedback(vi.fn()));
      await act(async () => {
        await expect(result.current.handleGetFeedback()).resolves.toBeUndefined();
      });
      expect(useWritingTestStore.getState()).toMatchObject({
        session: { evaluation_status: 'pending' },
        feedbackError: 'Original provider failure',
        isAnalyzing: false,
      });
      expect(recovery.writes.filter((write) => write.evaluation_status === 'failed')).toHaveLength(
        0
      );
      // A persistence failure must also release the in-memory click mutex.
      const calls = recovery.evaluate.mock.calls.length;
      await act(async () => result.current.handleGetFeedback());
      expect(recovery.evaluate.mock.calls.length).toBeGreaterThan(calls);
    }
  );

  it('does not overwrite a completed session when the guarded failure write loses a race', async () => {
    failTask2(new Error('Provider failed'));
    recovery.onFailureWrite = () => {
      recovery.session = { ...recovery.session, evaluation_status: 'complete' };
      useWritingTestStore.getState().setSession(recovery.session);
    };
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.session.evaluation_status).toBe('complete');
    expect(useWritingTestStore.getState().session.evaluation_status).toBe('complete');
    expect(recovery.writes.filter((write) => write.evaluation_status === 'failed')).toHaveLength(0);
  });

  it('does not persist failure against another pending generation', async () => {
    const originalRequestedAt = recovery.session.content_data.evaluationRequestedAt;
    failTask2(new Error('Old generation failed'), () => {
      recovery.session = {
        ...recovery.session,
        content_data: {
          ...recovery.session.content_data,
          evaluationRequestedAt: '2099-01-01T00:00:00.000Z',
        },
      };
    });
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(originalRequestedAt).not.toBe(recovery.session.content_data.evaluationRequestedAt);
    expect(recovery.session.evaluation_status).toBe('pending');
    expect(useWritingTestStore.getState().session.evaluation_status).toBe('pending');
    expect(recovery.writes.filter((write) => write.evaluation_status === 'failed')).toHaveLength(0);
  });

  it('preserves both generated parts if saving completion fails', async () => {
    recovery.completionWriteError = { message: 'Completion save unavailable' };
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.session).toMatchObject({
      evaluation_status: 'failed',
      content_data: {
        ai_feedbacks: {
          'Task 1': { overallBand: 8 },
          'Task 2': { overallBand: 7 },
        },
      },
    });
    expect(useWritingTestStore.getState()).toMatchObject({
      isCompleted: false,
      feedbackError: 'Failed to save feedback: Completion save unavailable',
      feedbacks: { 'Task 1': { overallBand: 8 }, 'Task 2': { overallBand: 7 } },
    });
    expect(awardXP).not.toHaveBeenCalled();
  });

  it('merges a server-saved partial report and metadata with locally generated feedback', async () => {
    const serverTask2 = { overallBand: 6.5, summary: 'Server saved Task 2' };
    failTask2(new Error('Client disconnected'), () => {
      recovery.session = {
        ...recovery.session,
        content_data: {
          ...recovery.session.content_data,
          workerMetadata: { retained: true },
          ai_feedbacks: { 'Task 2': serverTask2 },
        },
      };
    });
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.session).toMatchObject({
      evaluation_status: 'failed',
      content_data: {
        workerMetadata: { retained: true },
        ai_feedbacks: { 'Task 1': { overallBand: 8 }, 'Task 2': serverTask2 },
      },
    });
    expect(useWritingTestStore.getState().feedbacks['Task 2']).toEqual(serverTask2);
  });

  it('cannot replace the active session when it switches during failure persistence', async () => {
    failTask2(new Error('Old session provider failure'));
    let releaseWrite;
    let notifyWriteStarted;
    const writeStarted = new Promise((resolve) => {
      notifyWriteStarted = resolve;
    });
    recovery.onFailureWrite = () => {
      notifyWriteStarted();
      return new Promise((resolve) => {
        releaseWrite = resolve;
      });
    };
    const nextSession = {
      id: 'next-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: '2099-01-01T00:00:00.000Z' },
    };
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => {
      const pending = result.current.handleGetFeedback();
      await writeStarted;
      useWritingTestStore.getState().setSession(nextSession);
      useWritingTestStore.getState().setFeedbackError('Next session message');
      releaseWrite();
      await pending;
    });
    expect(recovery.session.evaluation_status).toBe('failed');
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbackError: 'Next session message',
      showUpgradeDialog: false,
    });
  });

  it.each(['generation', 'updated_at'])(
    'does not overwrite a worker update to %s between reading and writing failure',
    async (field) => {
      failTask2(new Error('Provider failed'));
      recovery.onFailureWrite = () => {
        recovery.session =
          field === 'generation'
            ? {
                ...recovery.session,
                content_data: {
                  ...recovery.session.content_data,
                  evaluationRequestedAt: '2099-01-01T00:00:00.000Z',
                },
              }
            : {
                ...recovery.session,
                updated_at: '2099-01-01T00:00:00.000Z',
                content_data: {
                  ...recovery.session.content_data,
                  workerPartial: 'must survive',
                },
              };
      };
      const { result } = renderHook(() => useWritingFeedback(vi.fn()));
      await act(async () => result.current.handleGetFeedback());
      expect(recovery.session.evaluation_status).toBe('pending');
      expect(useWritingTestStore.getState().session.evaluation_status).toBe('pending');
      expect(recovery.writes.filter((write) => write.evaluation_status === 'failed')).toHaveLength(
        0
      );
      if (field === 'updated_at')
        expect(recovery.session.content_data.workerPartial).toBe('must survive');
    }
  );
  it.each(['generation', 'updated_at'])(
    'does not complete an obsolete snapshot when the worker changes %s',
    async (field) => {
      recovery.onCompletionWrite = () => {
        recovery.session = {
          ...recovery.session,
          ...(field === 'updated_at' ? { updated_at: '2099-01-01T00:00:00.000Z' } : {}),
          content_data: {
            ...recovery.session.content_data,
            ...(field === 'generation' ? { evaluationRequestedAt: 'new-attempt' } : {}),
            workerPartial: 'keep this',
          },
        };
      };
      const awardXP = vi.fn();
      const { result } = renderHook(() => useWritingFeedback(awardXP));
      await act(async () => result.current.handleGetFeedback());
      expect(recovery.session.evaluation_status).toBe('pending');
      expect(recovery.session.content_data.workerPartial).toBe('keep this');
      expect(useWritingTestStore.getState().isCompleted).toBe(false);
      expect(
        recovery.writes.filter((write) => write.evaluation_status === 'complete')
      ).toHaveLength(0);
      expect(awardXP).not.toHaveBeenCalled();
      expect(trackAppEvent).not.toHaveBeenCalled();
    }
  );

  it('does not publish old successful feedback into a session selected during generation', async () => {
    const nextSession = {
      id: 'next-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: 'next-attempt' },
    };
    const succeed = recovery.evaluate.getMockImplementation();
    recovery.evaluate.mockImplementation(async (payload) => {
      const response = await succeed(payload);
      if (payload.taskType === 'Task 2') {
        useWritingTestStore.setState({
          session: nextSession,
          feedbacks: {},
          currentFeedback: null,
          feedbackError: 'Next session message',
        });
      }
      return response;
    });
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbacks: {},
      currentFeedback: null,
      feedbackError: 'Next session message',
      isCompleted: false,
    });
    expect(recovery.writes.filter((write) => write.evaluation_status === 'complete')).toHaveLength(
      0
    );
    expect(awardXP).not.toHaveBeenCalled();
    expect(trackAppEvent).not.toHaveBeenCalled();
  });

  it('does not replace the active session after an old completion write finishes', async () => {
    const nextSession = {
      id: 'next-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: 'next-attempt' },
    };
    recovery.onCompletionWrite = () => {
      useWritingTestStore.setState({
        session: nextSession,
        feedbacks: {},
        currentFeedback: null,
        feedbackError: 'Next session message',
      });
    };
    const awardXP = vi.fn();
    const { result } = renderHook(() => useWritingFeedback(awardXP));
    await act(async () => result.current.handleGetFeedback());
    expect(recovery.session.evaluation_status).toBe('complete');
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbacks: {},
      currentFeedback: null,
      feedbackError: 'Next session message',
      isCompleted: false,
    });
    expect(awardXP).not.toHaveBeenCalled();
    expect(trackAppEvent).not.toHaveBeenCalled();
  });

  it('keeps the newly claimed attempt marker in the completed record', async () => {
    recovery.session = { ...recovery.session, evaluation_status: 'failed' };
    useWritingTestStore.getState().setSession(recovery.session);
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    const marker = recovery.evaluate.mock.calls[0][0].evaluationRequestedAt;
    expect(marker).toBeTruthy();
    expect(recovery.session.content_data.evaluationRequestedAt).toBe(marker);
  });
  it.each(['save', 'claim'])(
    'does not restore the old session after switching during %s',
    async (phase) => {
      const nextSession = {
        id: 'next-session',
        evaluation_status: 'pending',
        content_data: { evaluationRequestedAt: 'next-attempt' },
      };
      const switchSession = () =>
        useWritingTestStore.setState({
          session: nextSession,
          feedbacks: {},
          currentFeedback: null,
          feedbackError: 'Next session message',
        });
      if (phase === 'save') {
        recovery.session = { ...recovery.session, evaluation_status: 'failed' };
        useWritingTestStore.getState().setSession(recovery.session);
        recovery.saveNow.mockImplementationOnce(async () => switchSession());
      } else recovery.onClaimWrite = switchSession;
      const awardXP = vi.fn();
      const { result } = renderHook(() => useWritingFeedback(awardXP));
      await act(async () => result.current.handleGetFeedback());
      expect(useWritingTestStore.getState()).toMatchObject({
        session: nextSession,
        feedbacks: {},
        feedbackError: 'Next session message',
        isCompleted: false,
      });
      expect(recovery.evaluate).not.toHaveBeenCalled();
      expect(awardXP).not.toHaveBeenCalled();
    }
  );

  it('does not publish sessionless feedback after a session is selected', async () => {
    recovery.quotaAllowed = true;
    useWritingTestStore.getState().setSession(null);
    const nextSession = {
      id: 'new-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: 'next' },
    };
    const succeed = recovery.evaluate.getMockImplementation();
    recovery.evaluate.mockImplementation(async (payload) => {
      const response = await succeed(payload);
      if (payload.taskType === 'Task 2')
        useWritingTestStore.setState({
          session: nextSession,
          feedbacks: {},
          currentFeedback: null,
        });
      return response;
    });
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbacks: {},
      currentFeedback: null,
    });
  });
  it('does not publish sessionless failure into a subsequently selected session', async () => {
    recovery.quotaAllowed = true;
    useWritingTestStore.getState().setSession(null);
    const nextSession = {
      id: 'next-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: 'next' },
    };
    recovery.evaluate.mockImplementation(async () => {
      useWritingTestStore.setState({ session: nextSession, feedbackError: 'Next session message' });
      throw Object.assign(new Error('Old quota failure'), { status: 429, rateLimitType: 'quota' });
    });
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbackError: 'Next session message',
      showUpgradeDialog: false,
    });
  });

  it('does not publish stale-recovery messages after a switch during the replacement claim', async () => {
    recovery.session.content_data.evaluationRequestedAt = new Date(
      Date.now() - 180000
    ).toISOString();
    const nextSession = {
      id: 'next-session',
      evaluation_status: 'pending',
      content_data: { evaluationRequestedAt: 'next' },
    };
    let claims = 0;
    recovery.onClaimWrite = () => {
      if (++claims === 2)
        useWritingTestStore.setState({
          session: nextSession,
          feedbackError: 'Next session message',
        });
    };
    const { result } = renderHook(() => useWritingFeedback(vi.fn()));
    await act(async () => result.current.handleGetFeedback());
    expect(claims).toBe(2);
    expect(useWritingTestStore.getState()).toMatchObject({
      session: nextSession,
      feedbackError: 'Next session message',
    });
    expect(recovery.evaluate).not.toHaveBeenCalled();
  });
});
