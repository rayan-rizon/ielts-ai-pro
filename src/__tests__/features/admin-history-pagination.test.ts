import { describe, expect, it, vi } from 'vitest';
import {
  loadHistoryPage,
  parseHistoryOptions,
} from '../../../supabase/functions/admin-payment-history/pagination';
const visible = (id: string, subscription: string) => ({
  id,
  subscription,
  mode: 'subscription',
  payment_status: 'paid',
  amount_total: 1499,
  metadata: {
    supabase_user_id: 'user',
    supabase_auth_id: 'auth',
    tier: 'premium',
    interval: 'monthly',
  },
});
function dbPage(rows: any[] = []) {
  const q: any = {
    select: vi.fn(() => q),
    not: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    or: vi.fn(() => q),
    then: (resolve: any) => Promise.resolve({ data: rows, error: null }).then(resolve),
  };
  return { from: vi.fn(() => q), q };
}
describe('Stripe history cursor and provenance', () => {
  it.each([
    null,
    [],
    50,
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { cursor: {} },
    { cursor: { checkout: 'bad', invoice: null, institution: null } },
    { cursor: { checkout: null, invoice: null, institution: { date: 'bad', id: 'bad' } } },
  ])('rejects invalid input %j', (input) => expect(() => parseHistoryOptions(input)).toThrow());
  it('uses raw provider cursors even when the entire page is filtered out', async () => {
    const stripe: any = {
      checkout: {
        sessions: {
          list: vi
            .fn()
            .mockResolvedValue({ data: [{ id: 'cs_hidden', metadata: {} }], has_more: true }),
        },
      },
      invoices: {
        list: vi
          .fn()
          .mockResolvedValue({ data: [{ id: 'in_zero', amount_paid: 0 }], has_more: true }),
      },
    };
    const db = dbPage();
    const page = await loadHistoryPage(
      stripe,
      db as any,
      parseHistoryOptions({ limit: 1 }),
      new Set()
    );
    expect(page.checkouts).toEqual([]);
    expect(page.invoices).toEqual([]);
    expect(page.cursor).toEqual({ checkout: 'cs_hidden', invoice: 'in_zero', institution: null });
  });
  it('includes renewals whose valid original checkout is outside the current page', async () => {
    const list = vi.fn().mockImplementation((params) =>
      Promise.resolve({
        data: params.subscription ? [visible('cs_old_original', params.subscription)] : [],
        has_more: false,
      })
    );
    const stripe: any = {
      checkout: { sessions: { list } },
      invoices: {
        list: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'in_old_renewal',
              amount_paid: 1499,
              billing_reason: 'subscription_cycle',
              subscription: 'sub_older_page',
            },
            {
              id: 'in_second_renewal',
              amount_paid: 1499,
              billing_reason: 'subscription_cycle',
              subscription: 'sub_older_page',
            },
          ],
          has_more: false,
        }),
      },
    };
    const page = await loadHistoryPage(stripe, dbPage() as any, parseHistoryOptions({}), new Set());
    expect(page.invoices).toHaveLength(2);
    expect(list.mock.calls.filter(([p]) => p.subscription)).toHaveLength(1);
  });
  it('excludes unrelated/test renewals and skips completed providers on subsequent pages', async () => {
    const list = vi.fn().mockResolvedValue({
      data: [{ ...visible('cs_legacy', 'sub_legacy'), metadata: {} }],
      has_more: false,
    });
    const stripe: any = {
      checkout: { sessions: { list } },
      invoices: {
        list: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'in_legacy',
              amount_paid: 1499,
              billing_reason: 'subscription_cycle',
              subscription: 'sub_legacy',
            },
          ],
          has_more: false,
        }),
      },
    };
    const db = dbPage();
    const page = await loadHistoryPage(
      stripe,
      db as any,
      parseHistoryOptions({
        cursor: { checkout: null, invoice: 'in_previous', institution: null },
      }),
      new Set()
    );
    expect(page.invoices).toEqual([]);
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ subscription: 'sub_legacy', limit: 1 });
    expect(stripe.invoices.list).toHaveBeenCalledWith({
      limit: 50,
      status: 'paid',
      starting_after: 'in_previous',
    });
  });
  it('provides stable institution lookahead without losing the boundary row', async () => {
    const db = dbPage([
      { id: 'a', created_at: '2026-10-02' },
      { id: 'b', created_at: '2026-10-01' },
    ]);
    const stripe: any = {
      checkout: { sessions: { list: vi.fn().mockResolvedValue({ data: [], has_more: false }) } },
      invoices: { list: vi.fn().mockResolvedValue({ data: [], has_more: false }) },
    };
    const page = await loadHistoryPage(
      stripe,
      db as any,
      parseHistoryOptions({ limit: 1 }),
      new Set()
    );
    expect(page.institutions).toHaveLength(1);
    expect(page.cursor.institution).toEqual({ id: 'a', date: '2026-10-02' });
    expect(db.q.limit).toHaveBeenCalledWith(2);
  });
});
