import { describe, it, expect, vi } from 'vitest';
import {
  runReport,
  reportWindow,
  rankBriefing,
  emailPreview,
  learnerTimeline,
} from '../../../supabase/functions/_shared/adminMarketingReports';

function database(results: Record<string, any>) {
  const calls: any[] = [];
  const db = {
    from: vi.fn((table: string) => {
      const query: any = {};
      for (const method of ['select', 'eq', 'gte', 'lt', 'order', 'limit', 'in', 'ilike'])
        query[method] = vi.fn((...args: any[]) => {
          calls.push({ table, method, args });
          return query;
        });
      query.then = (resolve: any) =>
        Promise.resolve(results[table] || { data: [], error: null, count: 0 }).then(resolve);
      return query;
    }),
  };
  return { db, calls };
}
describe('Admin reporting boundaries', () => {
  it('uses a fixed UTC interval and rejects arbitrary ranges', () => {
    expect(reportWindow(7, new Date('2026-09-06T12:00:00Z')).since).toBe(
      '2026-08-30T12:00:00.000Z'
    );
    expect(() => reportWindow(10000)).toThrow();
  });
  it('rejects unknown report keys before touching the database', async () => {
    const { db } = database({});
    await expect(runReport(db, 'DROP TABLE users', 30)).rejects.toThrow('Unsupported');
    expect(db.from).not.toHaveBeenCalled();
  });
  it('gets exact counts rather than counting a truncated row sample', async () => {
    const { db, calls } = database({ marketing_deliveries: { count: 1234, error: null } });
    const result = await runReport(db, 'delivery_health', 30);
    expect(result.facts).toHaveLength(32);
    expect(result.facts[0].value).toBe(1234);
    expect(
      calls
        .filter((x) => x.method === 'select')
        .every((x) => x.args[1].count === 'exact' && x.args[1].head)
    ).toBe(true);
    expect(result.limitation).toContain('not cumulative funnel');
  });
  it('does not turn query failure into zero', async () => {
    const { db } = database({
      marketing_checkout_intents: { error: { message: 'denied' }, count: null },
    });
    await expect(runReport(db, 'checkout_progress', 7)).rejects.toThrow('unavailable');
  });
  it('ranks, deduplicates, and excludes dismissed or unsupported findings', () => {
    const base = {
      sample_size: 10,
      status: 'new',
      created_at: '2026-09-05',
      title: 'Check delivery',
      fingerprint: 'same',
    };
    const result = rankBriefing([
      { ...base, id: 'low', severity: 'opportunity' },
      { ...base, id: 'high', severity: 'urgent' },
      { ...base, id: 'dismissed', fingerprint: 'x', status: 'dismissed' },
      { ...base, id: 'empty', fingerprint: 'y', sample_size: 0 },
    ]);
    expect(result.map((x) => x.id)).toEqual(['high']);
  });
  it('checks message ownership before requesting email content', async () => {
    const { db, calls } = database({});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = '11111111-1111-1111-1111-111111111111';
    const result = await emailPreview(
      db,
      user,
      '22222222-2222-2222-2222-222222222222',
      'deliveries',
      'test'
    );
    expect(result.available).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(calls).toContainEqual({
      table: 'marketing_deliveries',
      method: 'eq',
      args: ['user_id', user],
    });
    fetchSpy.mockRestore();
  });
  it('merges linked email records once and labels truncated history', async () => {
    const uid = '11111111-1111-1111-1111-111111111111';
    const { db } = database({
      users: { data: [{ id: uid, email: 'admin@example.com' }] },
      marketing_deliveries: {
        data: [{ id: 'd', provider_message_id: 'p', created_at: '2026-09-05' }],
      },
      email_delivery_events: {
        data: [{ id: 'e', provider_message_id: 'p', created_at: '2026-09-05' }],
      },
      marketing_contact_feedback: {
        data: Array.from({ length: 201 }, (_, i) => ({ id: String(i), created_at: '2026-09-05' })),
      },
    });
    const result = await learnerTimeline(db, uid, 30);
    expect(result.items.filter((x) => x.kind === 'emails')).toHaveLength(0);
    expect(result.items.filter((x) => x.kind === 'feedback')).toHaveLength(200);
    expect(result.truncated_sources).toEqual(['feedback']);
  });
});
