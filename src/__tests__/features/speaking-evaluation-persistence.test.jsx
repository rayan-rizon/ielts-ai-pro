import { renderHook, waitFor } from '@testing-library/react';
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
} from '@/features/testing/speaking/hooks/speakingEvaluationHelpers';
import { persistDeepDiveAnalysis } from '@/features/testing/speaking/hooks/useDeepDive';
import useFinalEvaluation from '@/features/testing/speaking/hooks/useFinalEvaluation';

function updateChain(result, capture) {
  const chain = {
    update: vi.fn((payload) => {
      capture.payload = payload;
      return chain;
    }),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  };
  return chain;
}

describe('Speaking evaluation persistence', () => {
  beforeEach(() => {
    fromMock.mockReset();
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
