import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), invoke: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from, functions: { invoke: mocks.invoke } },
}));
import { Resource } from '@/features/learning/services/Resource';
import { Notification } from '@/features/core/services/Notification';
import { ReferralSettings } from '@/features/admin/services/ReferralSettings';
import { PaymentHistoryService } from '@/features/admin/services/PaymentHistoryService';

describe('bounded admin services', () => {
  beforeEach(() => vi.resetAllMocks());
  it('exports all content beyond 1000 rows using fixed ID pages and an insertion cutoff', async () => {
    const rows = Array.from({ length: 1001 }, (_, i) => ({
      id: String(i).padStart(5, '0'),
      content: `<p>Article ${i}</p>`,
    }));
    const queries: any[] = [];
    mocks.from.mockImplementation(() => {
      let after = '';
      const q: any = {
        select: vi.fn(() => q),
        lte: vi.fn(() => q),
        order: vi.fn(() => q),
        limit: vi.fn(() => q),
        gt: vi.fn((_: string, id: string) => {
          after = id;
          return q;
        }),
        then: (resolve: any) =>
          Promise.resolve({
            data: rows.filter((r) => r.id > after).slice(0, 250),
            error: null,
          }).then(resolve),
      };
      queries.push(q);
      return q;
    });
    expect(await Resource.exportAll()).toEqual(rows);
    expect(queries).toHaveLength(5);
    queries.forEach((q) => {
      expect(q.select).toHaveBeenCalledWith('*');
      expect(q.limit).toHaveBeenCalledWith(250);
      expect(q.order).toHaveBeenCalledWith('id', { ascending: true });
      expect(q.lte).toHaveBeenCalledWith('created_at', expect.any(String));
    });
    expect(new Set(queries.map((q) => q.lte.mock.calls[0][1])).size).toBe(1);
    expect(queries[1].gt).toHaveBeenCalledWith('id', '00249');
  });
  it('fails an export instead of offering silently incomplete content', async () => {
    const q: any = {
      select: () => q,
      lte: () => q,
      order: () => q,
      limit: () => q,
      then: (resolve: any) =>
        Promise.resolve({ data: null, error: new Error('unavailable') }).then(resolve),
    };
    mocks.from.mockReturnValue(q);
    await expect(Resource.exportAll()).rejects.toThrow('unavailable');
  });
  it('uses a 25-row broadcast page while retaining database-wide stats', async () => {
    const entries = Array.from({ length: 26 }, (_, i) => ({
      id: `${i}`,
      created_at: '2026-10-01',
      read_count: 1501,
    }));
    mocks.rpc.mockResolvedValue({
      data: { entries, stats: { reads: 3005, live: 100 } },
      error: null,
    });
    const page = await Notification.adminPage({ date: '2026-10-02', id: 'last' });
    expect(page.entries).toHaveLength(25);
    expect(page.stats.reads).toBe(3005);
    expect(page.cursor?.id).toBe('24');
    expect(mocks.rpc).toHaveBeenCalledWith(
      'admin_broadcast_page',
      { p_before_date: '2026-10-02', p_before_id: 'last' },
      { get: true }
    );
  });
  it('uses a 50-row manual payment page and forwards filters and cursor', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        entries: Array.from({ length: 51 }, (_, i) => ({ id: `${i}`, created_at: '2026-10-01' })),
      },
      error: null,
    });
    const page = await PaymentHistoryService.manualPage({
      status: 'pending',
      search: 'older',
      cursor: { date: '2026-10-02', id: 'last' },
    });
    expect(page.entries).toHaveLength(50);
    expect(page.cursor?.id).toBe('49');
    expect(mocks.rpc).toHaveBeenCalledWith(
      'admin_payment_requests_page',
      { p_status: 'pending', p_search: 'older', p_before_date: '2026-10-02', p_before_id: 'last' },
      { get: true }
    );
  });
  it('does not invent an empty referral total on a permission or network failure', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { totalReferrals: 1501, topReferrers: [] },
      error: null,
    });
    expect((await ReferralSettings.getStats()).totalReferrals).toBe(1501);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('denied') });
    await expect(ReferralSettings.getStats()).rejects.toThrow('denied');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('requests bounded Stripe pages over the read-only POST contract', async () => {
    mocks.invoke.mockResolvedValue({ data: { payments: [], cursor: null }, error: null });
    await PaymentHistoryService.stripePage();
    expect(mocks.invoke).toHaveBeenCalledWith('admin-payment-history', { body: { limit: 50 } });
  });
});

it('omits absent GET cursor arguments instead of sending the literal string null', async () => {
  mocks.rpc.mockResolvedValue({ data: { entries: [], stats: { reads: 0 } }, error: null });
  await Notification.adminPage();
  expect(mocks.rpc).toHaveBeenLastCalledWith('admin_broadcast_page', {}, { get: true });
  await PaymentHistoryService.manualPage();
  expect(mocks.rpc).toHaveBeenLastCalledWith(
    'admin_payment_requests_page',
    { p_status: 'all', p_search: '' },
    { get: true }
  );
});
