import { describe, expect, it, vi } from 'vitest';
import { recoverWritingFeedback } from '../../../supabase/functions/_shared/writingFeedbackRecovery.ts';

function makeDb(status: string, response?: unknown, cached?: unknown) {
  const from = vi.fn((table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () =>
          table === 'ai_api_usage'
            ? {
                data: {
                  request_metadata: {
                    inputHash: 'essay-hash',
                    reservationStatus: status,
                    response,
                  },
                },
                error: null,
              }
            : { data: cached ? { feedback_json: cached } : null, error: null },
      }),
    }),
  }));
  return { from };
}

describe('Writing feedback retry recovery', () => {
  it('returns a completed response without another model call', async () => {
    const saved = { overallBand: 7 };
    const db = makeDb('completed', { success: true, data: saved });
    expect(await recoverWritingFeedback(db, 'reservation-id', 'essay-hash')).toEqual({
      state: 'available',
      response: { success: true, data: saved, cached: true },
    });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it('recovers older completed reviews from the feedback cache', async () => {
    const saved = { overallBand: 7 };
    expect(
      await recoverWritingFeedback(makeDb('completed', undefined, saved), 'id', 'essay-hash')
    ).toEqual({ state: 'available', response: { success: true, data: saved, cached: true } });
  });

  it('does not claim an unfinished review has a result', async () => {
    const db = makeDb('reserved');
    expect(await recoverWritingFeedback(db, 'id', 'essay-hash')).toEqual({ state: 'pending' });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it('refuses a result for a different answer hash', async () => {
    const db = makeDb('completed', { success: true, data: { overallBand: 7 } });
    expect(await recoverWritingFeedback(db, 'id', 'other-hash')).toEqual({ state: 'missing' });
    expect(db.from).toHaveBeenCalledTimes(1);
  });
});
