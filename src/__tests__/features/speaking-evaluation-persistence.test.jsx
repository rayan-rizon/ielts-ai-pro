import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/utils/api', () => ({
  callEdgeFunction: vi.fn(),
}));

import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import {
  buildCriteriaScores,
  persistSuccessfulEvaluation,
  releaseDeferredEvaluation,
  handleQuotaOrRateLimit,
  persistSpeakingEvaluationFailure,
} from '@/features/testing/speaking/hooks/speakingEvaluationHelpers';
import { persistDeepDiveAnalysis } from '@/features/testing/speaking/hooks/useDeepDive';
import useFinalEvaluation from '@/features/testing/speaking/hooks/useFinalEvaluation';
import { callEdgeFunction } from '@/utils/api';
import useSpeakingSessionPersistence from '@/features/testing/speaking/hooks/useSpeakingSessionPersistence';

function updateChain(result, capture) {
  const chain = {
    update: vi.fn((payload) => {
      capture.payload = payload;
      return chain;
    }),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  };
  return chain;
}

describe('Speaking evaluation persistence', () => {
  it('does not let a late failure downgrade an already completed evaluation', async () => {
    const capture = {};
    const chain = updateChain({ data: null, error: null }, capture);
    fromMock.mockReturnValue(chain);
    await persistSpeakingEvaluationFailure({
      session: { id: 'session-a' },
      conversationsToEvaluate: {},
      failure: { code: 'NetworkError' },
    });
    expect(chain.eq).toHaveBeenCalledWith('evaluation_status', 'pending');
    expect(capture.payload.content_data.evaluationFailure.code).toBe('NetworkError');
  });
  it('restricts delayed autosaves to incomplete sessions', async () => {
    const capture = {};
    const chain = updateChain({ data: null, error: null }, capture);
    fromMock.mockReturnValue(chain);
    const { result } = renderHook(() => useSpeakingSessionPersistence('session-a', {}));
    await act(async () => {
      await result.current({ content_data: { currentPart: 3 } });
    });
    expect(chain.eq).toHaveBeenCalledWith('id', 'session-a');
    expect(chain.eq).toHaveBeenCalledWith('is_completed', false);
  });
  beforeEach(() => {
    fromMock.mockReset();
    vi.mocked(callEdgeFunction).mockReset();
  });

  it('recovers a server-saved report when the evaluation response is lost', async () => {
    const saved = {
      overallBand: 7,
      evaluationVersion: CURRENT_EVALUATION_VERSION,
      speakingSessionId: 'session-a',
    };
    const read = {
      select: vi.fn(() => read),
      eq: vi.fn(() => read),
      maybeSingle: vi.fn(async () => ({
        data: { evaluation_status: 'complete', content_data: { finalEvaluation: saved } },
        error: null,
      })),
    };
    fromMock
      .mockReturnValueOnce(updateChain({ data: { id: 'session-a' }, error: null }, {}))
      .mockReturnValueOnce(read);
    vi.mocked(callEdgeFunction).mockRejectedValueOnce(new Error('Failed to fetch'));
    const saveSessionProgress = vi.fn();
    const awardXP = vi.fn();
    const { result } = renderHook(() =>
      useFinalEvaluation({
        testId: 'test-a',
        session: { id: 'session-a' },
        allParts: {},
        allPartsConversation: {},
        currentPartNumber: 3,
        conversation: [],
        acousticMetricsRef: { current: {} },
        saveSessionProgress,
        awardXP,
        setIsTestComplete: vi.fn(),
        setShowUpgradeDialog: vi.fn(),
        setProcessingStatus: vi.fn(),
      })
    );
    await act(async () => {
      await result.current.requestFinalEvaluation({});
    });
    expect(result.current.finalEvaluation).toEqual(saved);
    expect(result.current.evaluationError).toBeNull();
    expect(saveSessionProgress).not.toHaveBeenCalled();
    expect(awardXP).not.toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledTimes(2);
  });

  it('releases only a pending claim after a quota denial, without overwriting a report', async () => {
    const capture = {};
    const chain = updateChain({ data: null, error: null }, capture);
    fromMock.mockReturnValue(chain);
    await releaseDeferredEvaluation({ id: 'session-a' });
    expect(capture.payload).toEqual({ evaluation_status: 'not_requested' });
    expect(chain.eq).toHaveBeenCalledWith('id', 'session-a');
    expect(chain.eq).toHaveBeenCalledWith('evaluation_status', 'pending');
  });

  it('explains exhausted allowance without claiming speaking is excluded from the plan', () => {
    const setEvaluationError = vi.fn();
    const setShowUpgradeDialog = vi.fn();
    handleQuotaOrRateLimit({
      evalError: { status: 429, rateLimitType: 'quota' },
      setEvaluationError,
      setShowUpgradeDialog,
      setIsTestComplete: vi.fn(),
    });
    expect(setEvaluationError).toHaveBeenCalledWith(expect.stringContaining('allowance'));
    expect(setShowUpgradeDialog).toHaveBeenCalledWith(true);
    setShowUpgradeDialog.mockClear();
    handleQuotaOrRateLimit({
      evalError: { status: 403 },
      setEvaluationError,
      setShowUpgradeDialog,
      setIsTestComplete: vi.fn(),
    });
    expect(setShowUpgradeDialog).not.toHaveBeenCalled();
    expect(setEvaluationError).toHaveBeenLastCalledWith(expect.stringContaining('denied'));
  });

  it('stores the final evaluation with current version and exact session metadata', async () => {
    const capture = {};
    fromMock.mockReturnValue(updateChain({ data: { id: 'session-a' }, error: null }, capture));
    const evaluation = {
      overallBand: 7,
      fluency: 7,
      lexical: 6.5,
      grammar: 6,
      pronunciation: null,
    };

    const didPersist = await persistSuccessfulEvaluation({
      session: {
        id: 'session-a',
        started_at: new Date(Date.now() - 60_000).toISOString(),
        content_data: { existing: true },
      },
      evaluation,
      conversationsToEvaluate: { 1: [{ role: 'user', text: 'Response' }] },
    });

    expect(didPersist).toBe(true);
    expect(capture.payload).toMatchObject({
      evaluation_status: 'complete',
      evaluation_version: CURRENT_EVALUATION_VERSION,
      score: 7,
      content_data: {
        existing: true,
        criteriaScores: buildCriteriaScores(evaluation),
        finalEvaluation: {
          overallBand: 7,
          evaluationVersion: CURRENT_EVALUATION_VERSION,
          speakingSessionId: 'session-a',
        },
      },
    });
    expect(capture.payload.actual_duration_seconds).toBeGreaterThanOrEqual(59);
  });

  it('merges a deep dive into the current row without deleting the final report', async () => {
    const capture = {};
    const currentContent = {
      finalEvaluation: {
        overallBand: 7,
        evaluationVersion: CURRENT_EVALUATION_VERSION,
        speakingSessionId: 'session-a',
      },
    };
    const readChain = {
      select: vi.fn(() => readChain),
      eq: vi.fn(() => readChain),
      single: vi.fn(async () => ({
        data: {
          content_data: currentContent,
          evaluation_status: 'complete',
          evaluation_version: CURRENT_EVALUATION_VERSION,
        },
        error: null,
      })),
    };
    fromMock
      .mockReturnValueOnce(readChain)
      .mockReturnValueOnce(updateChain({ data: { id: 'session-a' }, error: null }, capture));

    await persistDeepDiveAnalysis(
      { id: 'session-a' },
      { summary: 'Focused feedback', evaluationVersion: CURRENT_EVALUATION_VERSION }
    );

    expect(capture.payload.content_data.finalEvaluation).toEqual(currentContent.finalEvaluation);
    expect(capture.payload.content_data.detailedFeedback).toMatchObject({
      summary: 'Focused feedback',
      evaluationVersion: CURRENT_EVALUATION_VERSION,
      speakingSessionId: 'session-a',
    });
  });

  it('resets restored feedback when the selected session changes', async () => {
    const sharedProps = {
      testId: 'speaking-test',
      allParts: [],
      allPartsConversation: {},
      currentPartNumber: 1,
      conversation: [],
      acousticMetricsRef: { current: {} },
      saveSessionProgress: vi.fn(),
      awardXP: vi.fn(),
      setIsTestComplete: vi.fn(),
      setShowUpgradeDialog: vi.fn(),
      setProcessingStatus: vi.fn(),
    };
    const first = {
      id: 'session-a',
      content_data: { finalEvaluation: { overallBand: 6, speakingSessionId: 'session-a' } },
    };
    const second = {
      id: 'session-b',
      content_data: { finalEvaluation: { overallBand: 7, speakingSessionId: 'session-b' } },
    };
    const { result, rerender } = renderHook(
      ({ session }) => useFinalEvaluation({ ...sharedProps, session }),
      { initialProps: { session: first } }
    );
    expect(result.current.finalEvaluation.overallBand).toBe(6);

    rerender({ session: second });
    await waitFor(() => expect(result.current.finalEvaluation.overallBand).toBe(7));
    expect(result.current.finalEvaluation.speakingSessionId).toBe('session-b');
  });
});
