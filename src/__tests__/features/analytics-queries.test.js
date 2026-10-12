import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { rpc } }));
import {
  ANALYTICS_SESSION_PAGE_SIZE,
  fetchSessions,
  fetchGrammarAttempts,
  getSessionFetchCutoff,
} from '@/features/analytics/hooks/analyticsQueries';
import { buildGrammarEvidence } from '@/features/analytics/hooks/analyticsDataModel';

describe('Analytics evidence queries', () => {
  beforeEach(() => rpc.mockReset());
  it('keeps every All time attempt with a stable date/id cursor instead of offsets', async () => {
    const page = Array.from({ length: ANALYTICS_SESSION_PAGE_SIZE }, (_, i) => ({
      id: `session-${i}`,
      cursor_date: '2026-08-01T00:00:00Z',
    }));
    rpc.mockResolvedValueOnce({ data: page }).mockResolvedValueOnce({ data: [{ id: 'last' }] });
    const sessions = await fetchSessions('user-1', 'all');
    expect(sessions).toHaveLength(ANALYTICS_SESSION_PAGE_SIZE + 1);
    expect(rpc).toHaveBeenNthCalledWith(
      2,
      'get_learner_analytics_page',
      expect.objectContaining({
        p_before_id: 'session-499',
        p_before_date: page[499].cursor_date,
        p_cutoff: null,
      })
    );
  });
  it('keeps both the current and comparison windows for bounded timeframes', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'first' }] });
    const now = Date.UTC(2026, 7, 8);
    expect(await fetchSessions('user-1', '30d', now)).toEqual([{ id: 'first' }]);
    expect(rpc).toHaveBeenCalledWith(
      'get_learner_analytics_page',
      expect.objectContaining({ p_cutoff: getSessionFetchCutoff('30d', now) })
    );
  });
  it('fails rather than silently duplicating history when a cursor is absent', async () => {
    rpc.mockResolvedValue({ data: Array.from({ length: 500 }, () => ({ id: 'no-date' })) });
    await expect(fetchSessions('user-1', 'all')).rejects.toThrow('invalid cursor');
  });
  it('calculates Grammar accuracy from exact database totals and the requested window', async () => {
    rpc.mockResolvedValue({
      data: { completedAttempts: 1200, correct: 10000, questions: 12000, transferAttempts: 15 },
    });
    const now = Date.UTC(2026, 7, 8);
    const evidence = await fetchGrammarAttempts('user-1', '7d', now);
    expect(rpc).toHaveBeenCalledWith('get_learner_grammar_summary', {
      p_user_id: 'user-1',
      p_cutoff: new Date(now - 7 * 86400000).toISOString(),
    });
    expect(buildGrammarEvidence(evidence, '7d')).toEqual({
      completedAttempts: 1200,
      accuracy: 83,
      transferAttempts: 15,
    });
  });
});
