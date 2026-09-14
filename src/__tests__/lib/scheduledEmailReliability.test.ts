import { describe, expect, it, vi } from 'vitest';

import {
  buildScheduledEmailIdempotencyKey,
  isRetryableScheduledRun,
  retryTransientDatabaseOperation,
} from '../../../supabase/functions/_shared/scheduledEmailReliability';

describe('scheduled email reliability', () => {
  it('reclaims failed runs and stale running claims, but never completed or active runs', () => {
    const now = new Date('2026-09-14T01:00:00.000Z');

    expect(isRetryableScheduledRun({ status: 'failed' }, now)).toBe(true);
    expect(
      isRetryableScheduledRun({ status: 'running', started_at: '2026-09-14T00:00:00.000Z' }, now)
    ).toBe(true);
    expect(
      isRetryableScheduledRun({ status: 'running', started_at: '2026-09-14T00:50:00.000Z' }, now)
    ).toBe(false);
    expect(isRetryableScheduledRun({ status: 'completed' }, now)).toBe(false);
  });

  it('builds one stable provider idempotency key per date, email type, and learner', () => {
    expect(buildScheduledEmailIdempotencyKey('2026-09-14', 'trial_expiry', 'learner-123')).toBe(
      'scheduled/2026-09-14/trial_expiry/learner-123'
    );
  });

  it('retries transient database timeouts but does not retry permanent errors', async () => {
    const transient = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'Gateway Timeout' } })
      .mockResolvedValueOnce({ data: [{ id: 'ok' }], error: null });
    const permanent = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    });

    await expect(retryTransientDatabaseOperation(transient, { delaysMs: [0] })).resolves.toEqual({
      data: [{ id: 'ok' }],
      error: null,
    });
    await expect(retryTransientDatabaseOperation(permanent, { delaysMs: [0, 0] })).resolves.toEqual(
      { data: null, error: { code: '42501', message: 'permission denied' } }
    );
    expect(transient).toHaveBeenCalledTimes(2);
    expect(permanent).toHaveBeenCalledTimes(1);
  });
});
