import { beforeEach, describe, expect, it, vi } from 'vitest';

const callEdgeFunction = vi.fn();
vi.mock('@/utils/api', () => ({ callEdgeFunction: (...args) => callEdgeFunction(...args) }));

const { requestReportAssist, forgetReportAssist } =
  await import('@/features/testing/writing/report/reportAssistClient');

const request = { sessionId: 's1', taskType: 'Task 2', operation: 'translate', language: 'bn' };
const failure = (status, code) =>
  Object.assign(new Error('x'), { status, details: code ? { code } : null });

describe('asking for report extras', () => {
  beforeEach(() => {
    callEdgeFunction.mockReset();
    forgetReportAssist();
  });

  it('calls the writing-report-assist function once and reuses the answer', async () => {
    callEdgeFunction.mockResolvedValue({ success: true, data: { translations: {} } });

    const first = await requestReportAssist(request);
    const second = await requestReportAssist({ ...request });

    expect(first).toEqual({ translations: {} });
    expect(second).toBe(first);
    expect(callEdgeFunction).toHaveBeenCalledTimes(1);
    expect(callEdgeFunction).toHaveBeenCalledWith('writing-report-assist', request);
  });

  it('asks again after a failure', async () => {
    callEdgeFunction.mockRejectedValueOnce(failure(502, 'provider_failed'));
    callEdgeFunction.mockResolvedValueOnce({ data: { ok: true } });

    await expect(requestReportAssist(request)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(requestReportAssist(request)).resolves.toEqual({ ok: true });
  });

  it.each([
    ['the hourly limit', failure(429, 'rate_limited'), 'rate_limited'],
    ['the shared AI limit without a code', failure(429), 'rate_limited'],
    [
      'an essay with no comparable paragraph',
      failure(422, 'no_comparable_paragraph'),
      'no_comparable_paragraph',
    ],
    ['a function that is not deployed yet', failure(404), 'unavailable'],
    ['a lost connection', new TypeError('Failed to fetch'), 'unavailable'],
  ])('names %s', async (_, error, code) => {
    callEdgeFunction.mockRejectedValue(error);
    await expect(requestReportAssist(request)).rejects.toMatchObject({ code });
  });

  it('treats an empty answer as unavailable', async () => {
    callEdgeFunction.mockResolvedValue({ success: true });
    await expect(requestReportAssist(request)).rejects.toMatchObject({ code: 'unavailable' });
  });
});
