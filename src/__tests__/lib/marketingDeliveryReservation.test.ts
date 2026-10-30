import { describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  nextMarketingAttempt,
  readMarketingAudienceRows,
  readMarketingDispatchHistory,
  reserveMarketingDelivery,
} from '../../../supabase/functions/_shared/marketingDelivery';

describe('marketing delivery reservations', () => {
  it('lets only one overlapping caller send and preserves the existing record', async () => {
    const records = new Map();
    const db = {
      from: () => ({
        upsert(record: any, options: any) {
          const key = [record.campaign_id, record.user_id, record.channel, record.attempt].join(
            ':'
          );
          expect(options.ignoreDuplicates).toBe(true);
          const data = records.has(key)
            ? null
            : { ...record, id: 'reserved', tracking_token: 'token' };
          if (data) records.set(key, data);
          return { select: () => ({ maybeSingle: async () => ({ data, error: null }) }) };
        },
      }),
    };
    const record = {
      campaign_id: 'campaign',
      user_id: 'learner',
      channel: 'email',
      attempt: 4,
      content: 'original',
    };
    const results = await Promise.all([
      reserveMarketingDelivery(db, record),
      reserveMarketingDelivery(db, { ...record, content: 'replacement' }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect([...records.values()][0].content).toBe('original');
  });

  it('uses PostgREST conflict-ignore semantics and accepts an empty duplicate response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('[]', {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const db = createClient('https://example.supabase.co', 'test-key', {
      global: { fetch: fetcher },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    expect(
      await reserveMarketingDelivery(db, {
        campaign_id: 'campaign',
        user_id: 'learner',
        channel: 'email',
        attempt: 1,
      })
    ).toBeNull();
    const [url, request] = fetcher.mock.calls[0];
    expect(String(url)).toContain('on_conflict=campaign_id%2Cuser_id%2Cchannel%2Cattempt');
    expect(new Headers(request.headers).get('Prefer')).toContain('resolution=ignore-duplicates');
  });

  it('propagates a real reservation failure instead of treating it as a duplicate', async () => {
    const failure = { code: '42501', message: 'Permission denied' };
    const db = {
      from: () => ({
        upsert: () => ({
          select: () => ({ maybeSingle: async () => ({ data: null, error: failure }) }),
        }),
      }),
    };
    await expect(reserveMarketingDelivery(db, {})).rejects.toEqual(failure);
  });

  it('allocates above the highest attempt even when older attempts have gaps', () => {
    expect(nextMarketingAttempt([{ attempt: 1 }, { attempt: 7 }])).toBe(8);
    expect(nextMarketingAttempt([])).toBe(1);
  });

  it('reads all history beyond the server row cap with bounded audience filters', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `user-${i}`);
    const expected = Array.from({ length: 1201 }, (_, i) => ({
      id: i,
      user_id: ids[i % ids.length],
    }));
    const filters: string[][] = [];
    const db = {
      from: () => ({
        select: () => ({
          in: (_column: string, batch: string[]) => {
            filters.push(batch);
            return {
              order: () => ({
                range: async (from: number, to: number) => ({
                  data: expected
                    .filter((row) => batch.includes(row.user_id))
                    .slice(from, Math.min(to + 1, from + 200)),
                  error: null,
                }),
              }),
            };
          },
        }),
      }),
    };
    const result = await readMarketingAudienceRows(db, 'marketing_deliveries', '*', ids);
    expect(result).toHaveLength(expected.length);
    expect(new Set(result.map((row) => row.id)).size).toBe(expected.length);
    expect(filters.every((batch) => batch.length <= 100)).toBe(true);
  });

  it('fails closed when a history page cannot be read', async () => {
    const failure = { message: 'History unavailable' };
    const db = {
      from: () => ({
        select: () => ({
          in: () => ({ order: () => ({ range: async () => ({ data: null, error: failure }) }) }),
        }),
      }),
    };
    await expect(
      readMarketingAudienceRows(db, 'marketing_deliveries', '*', ['user'])
    ).rejects.toEqual(failure);
  });

  it('pages compact history past a lower server cap and bounds RPC audiences', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `user-${i}`);
    const expected = Array.from({ length: 1201 }, (_, i) => ({
      id: i,
      user_id: ids[i % ids.length],
    }));
    const rpc = vi.fn((_name: string, args: any) => ({
      order: (column: string) => {
        expect(column).toBe('id');
        return {
          range: async (from: number, to: number) => ({
            data: expected
              .filter((row) => args.p_user_ids.includes(row.user_id))
              .slice(from, Math.min(to + 1, from + 200)),
            error: null,
          }),
        };
      },
    }));
    const result = await readMarketingDispatchHistory({ rpc }, 'campaign', [...ids, ids[0]]);
    expect(result).toHaveLength(1201);
    expect(new Set(result.map((row) => row.id)).size).toBe(1201);
    expect(
      rpc.mock.calls.every(
        ([name, args]) =>
          name === 'marketing_dispatch_history' &&
          args.p_campaign_id === 'campaign' &&
          args.p_user_ids.length <= 100
      )
    ).toBe(true);
  });

  it('does not query compact history for an empty audience', async () => {
    const rpc = vi.fn();
    expect(await readMarketingDispatchHistory({ rpc }, 'campaign', [])).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('fails closed if any compact history page fails', async () => {
    const failure = { message: 'History unavailable' };
    let page = 0;
    const db = {
      rpc: () => ({
        order: () => ({
          range: async () =>
            ++page === 1
              ? { data: [{ id: 'first' }], error: null }
              : { data: null, error: failure },
        }),
      }),
    };
    await expect(readMarketingDispatchHistory(db, 'campaign', ['user'])).rejects.toEqual(failure);
  });

  it('uses stable PostgREST ordering and range headers for the history RPC', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
      );
    const db = createClient('https://example.supabase.co', 'test-key', {
      global: { fetch: fetcher },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await readMarketingDispatchHistory(db, 'campaign', ['user']);
    const [url, request] = fetcher.mock.calls[0];
    expect(String(url)).toContain('/rpc/marketing_dispatch_history');
    expect(String(url)).toContain('order=id.asc');
    expect(String(url)).toContain('offset=0');
    expect(String(url)).toContain('limit=500');
    expect(JSON.parse(request.body)).toEqual({ p_campaign_id: 'campaign', p_user_ids: ['user'] });
  });
});
