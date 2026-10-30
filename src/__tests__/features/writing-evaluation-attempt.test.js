import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
  recordWritingEvaluationFailure,
  completeWritingEvaluation,
} from '@/features/testing/writing/writingEvaluationAttempt';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

const session = {
  id: 'writing-session',
  evaluation_status: 'pending',
  updated_at: '2026-10-30T00:00:00.000Z',
  content_data: {
    evaluationRequestedAt: '2026-10-30T00:00:00.000Z',
    ai_feedbacks: { 'Task 1': { overallBand: 7 } },
    time_remaining: 500,
  },
};
const providerError = Object.assign(new Error('Provider unavailable'), { status: 503 });
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function adapter(replies) {
  const fetch = vi.fn();
  for (const reply of replies) fetch.mockResolvedValueOnce(reply);
  const client = createClient('http://127.0.0.1:54321', 'local-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch },
  });
  return { client, fetch };
}

const attempt = (overrides = {}) => ({
  session,
  error: providerError,
  attemptedTasks: ['Task 1', 'Task 2'],
  ...overrides,
});

describe('Writing failure persistence through the Supabase adapter', () => {
  it('merges current saved parts and verifies a generation- and timestamp-guarded write', async () => {
    const latest = {
      ...session,
      updated_at: '2026-10-30T00:01:00.000Z',
      content_data: {
        ...session.content_data,
        workerProgress: 'Task 2 saved',
        ai_feedbacks: { 'Task 2': { overallBand: 8 } },
      },
    };
    const saved = { ...latest, evaluation_status: 'failed' };
    const { client, fetch } = adapter([response([latest]), response([saved])]);
    const result = await recordWritingEvaluationFailure(
      attempt({
        feedbacks: { 'Task 1': { overallBand: 7.5 } },
      }),
      client
    );
    expect(result).toEqual(saved);
    expect(fetch).toHaveBeenCalledTimes(2);
    const [url, options] = fetch.mock.calls[1];
    expect(options.method).toBe('PATCH');
    const filters = new URL(url).searchParams;
    expect(filters.get('id')).toBe(`eq.${session.id}`);
    expect(filters.get('evaluation_status')).toBe('eq.pending');
    expect(filters.get('content_data->>evaluationRequestedAt')).toBe(
      `eq.${session.content_data.evaluationRequestedAt}`
    );
    expect(filters.get('updated_at')).toBe(`eq.${latest.updated_at}`);
    expect(JSON.parse(options.body)).toMatchObject({
      evaluation_status: 'failed',
      content_data: {
        time_remaining: 500,
        workerProgress: 'Task 2 saved',
        ai_feedbacks: { 'Task 1': { overallBand: 7.5 }, 'Task 2': { overallBand: 8 } },
        evaluationFailure: {
          category: 'provider',
          status: 503,
          attemptedTasks: ['Task 1', 'Task 2'],
        },
      },
    });
  });

  it.each(['complete', 'failed'])(
    'does not update a session that is already %s',
    async (status) => {
      const { client, fetch } = adapter([response([{ ...session, evaluation_status: status }])]);
      expect(await recordWritingEvaluationFailure(attempt(), client)).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it('does not update another pending attempt', async () => {
    const latest = { ...session, content_data: { evaluationRequestedAt: 'new-generation' } };
    const { client, fetch } = adapter([response([latest])]);
    expect(await recordWritingEvaluationFailure(attempt(), client)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns no saved session if a worker changes the record after the read', async () => {
    const { client } = adapter([response([session]), response([])]);
    expect(await recordWritingEvaluationFailure(attempt(), client)).toBeNull();
  });

  it('does not invent a record when no session is returned', async () => {
    const { client, fetch } = adapter([response([])]);
    expect(await recordWritingEvaluationFailure(attempt(), client)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['read', 'write'])(
    'surfaces a database %s error instead of returning an optimistic session',
    async (stage) => {
      const failure = response({ message: 'Database denied this operation', code: '42501' }, 403);
      const { client } = adapter(stage === 'read' ? [failure] : [response([session]), failure]);
      await expect(recordWritingEvaluationFailure(attempt(), client)).rejects.toMatchObject({
        code: '42501',
      });
    }
  );

  it('guards the absence of a generation marker on older pending sessions', async () => {
    const legacy = { ...session, content_data: {}, updated_at: null };
    const { client, fetch } = adapter([response([legacy]), response([])]);
    expect(await recordWritingEvaluationFailure(attempt({ session: legacy }), client)).toBeNull();
    const filters = new URL(fetch.mock.calls[1][0]).searchParams;
    expect(filters.get('content_data->>evaluationRequestedAt')).toBe('is.null');
    expect(filters.get('updated_at')).toBe('is.null');
  });

  it('skips persistence when the caller has no pending session', async () => {
    const { client, fetch } = adapter([]);
    expect(await recordWritingEvaluationFailure(attempt({ session: null }), client)).toBeNull();
    expect(
      await recordWritingEvaluationFailure(
        attempt({ session: { ...session, evaluation_status: 'complete' } }),
        client
      )
    ).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('Writing completion through the Supabase adapter', () => {
  const completion = (overrides = {}) => ({
    session,
    feedbacks: { 'Task 1': { overallBand: 8 }, 'Task 2': { overallBand: 7 } },
    drafts: { 'Task 1': 'Original report', 'Task 2': 'Original essay' },
    wordCount: 420,
    timeRemaining: 1200,
    ...overrides,
  });

  it('saves the attempt snapshot and retains current metadata behind the same conditional write', async () => {
    const latest = {
      ...session,
      content_data: {
        ...session.content_data,
        workerMetadata: 'keep',
        evaluationFailure: { category: 'provider' },
      },
    };
    const { client, fetch } = adapter([response([latest])]);
    fetch.mockImplementationOnce(async (_url, options) =>
      response([{ ...latest, ...JSON.parse(options.body) }])
    );
    const saved = await completeWritingEvaluation(completion(), client);
    expect(saved).toMatchObject({ evaluation_status: 'complete', score: 7.5, is_completed: true });
    const [url, options] = fetch.mock.calls[1];
    const filters = new URL(url).searchParams;
    expect(filters.get('content_data->>evaluationRequestedAt')).toBe(
      `eq.${session.content_data.evaluationRequestedAt}`
    );
    expect(filters.get('updated_at')).toBe(`eq.${session.updated_at}`);
    expect(filters.get('evaluation_status')).toBe('eq.pending');
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({
      score: 7.5,
      actual_duration_seconds: 2400,
      user_responses: [
        { task1_response: 'Original report', task2_response: 'Original essay', word_count: 420 },
      ],
      content_data: {
        workerMetadata: 'keep',
        task1Band: 8,
        task2Band: 7,
        evaluationRequestedAt: session.content_data.evaluationRequestedAt,
      },
    });
    expect(payload.content_data).not.toHaveProperty('evaluationFailure');
  });

  it('does not complete a newer evaluation attempt', async () => {
    const { client, fetch } = adapter([
      response([
        {
          ...session,
          content_data: {
            evaluationRequestedAt: 'new-generation',
            ai_feedbacks: { 'Task 2': { overallBand: 9 } },
          },
        },
      ]),
    ]);
    expect(await completeWritingEvaluation(completion(), client)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not claim completion after losing the snapshot race', async () => {
    const { client } = adapter([response([session]), response([])]);
    expect(await completeWritingEvaluation(completion(), client)).toBeNull();
  });

  it('surfaces a failed completion write without inventing a saved result', async () => {
    const { client } = adapter([
      response([session]),
      response({ message: 'Database unavailable', code: 'XX000' }, 500),
    ]);
    await expect(completeWritingEvaluation(completion(), client)).rejects.toThrow(
      'Failed to save feedback: Database unavailable'
    );
  });
});
