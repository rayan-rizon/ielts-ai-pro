import { describe, expect, it, vi } from 'vitest';
import { waitForWritingJob } from '@/utils/writingJobClient';

function harness(saved) {
  let time = 0;
  const values = new Map(saved ? [['job', JSON.stringify(saved)]] : []);
  return {
    key: 'job',
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
    storage: {
      getItem: (k) => values.get(k),
      setItem: (k, v) => values.set(k, v),
      removeItem: (k) => values.delete(k),
    },
    values,
  };
}
describe('Durable Writing client', () => {
  it('recovers after a refresh without starting or charging another review', async () => {
    const h = harness({ jobId: 'existing', createdAt: 0 });
    const start = vi.fn();
    const result = {
      success: true,
      data: { overallBand: 7.5, criteriaScores: { TaskResponse: 7 } },
    };
    const getStatus = vi
      .fn()
      .mockResolvedValueOnce({ state: 'processing' })
      .mockResolvedValueOnce({ state: 'completed', response: result });
    expect(await waitForWritingJob({ ...h, start, getStatus })).toBe(result);
    expect(start).not.toHaveBeenCalled();
    expect(h.values.size).toBe(0);
  });
  it('preserves the pending identifier across a network failure', async () => {
    const h = harness();
    const getStatus = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(
      waitForWritingJob({ ...h, start: async () => ({ pending: true, jobId: 'new' }), getStatus })
    ).rejects.toThrow('offline');
    expect(JSON.parse(h.values.get('job')).jobId).toBe('new');
  });
  it('passes quota and provider errors back to the existing UX without replacing scores', async () => {
    const h = harness();
    const result = waitForWritingJob({
      ...h,
      start: async () => ({ pending: true, jobId: 'new' }),
      getStatus: async () => ({
        state: 'failed',
        responseStatus: 429,
        response: { error: 'Quota exhausted', dailyUsed: 3, rateLimitType: 'quota' },
      }),
    });
    await expect(result).rejects.toMatchObject({
      status: 429,
      rateLimitType: 'quota',
      quotaInfo: { dailyUsed: 3 },
    });
    expect(h.values.size).toBe(0);
  });
  it('keeps a queued review recoverable after the browser wait budget expires', async () => {
    const h = harness();
    await expect(
      waitForWritingJob({
        ...h,
        start: async () => ({ pending: true, jobId: 'new' }),
        getStatus: async () => ({ state: 'queued' }),
        timeoutMs: 1000,
      })
    ).rejects.toMatchObject({ name: 'WritingPendingError' });
    expect(h.values.size).toBe(1);
  });
  it('returns an already cached result immediately', async () => {
    const h = harness();
    const getStatus = vi.fn();
    const result = { success: true, data: { overallBand: 8 } };
    expect(await waitForWritingJob({ ...h, start: async () => result, getStatus })).toBe(result);
    expect(getStatus).not.toHaveBeenCalled();
  });
});
