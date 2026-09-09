import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketingDelivery } from '@/features/marketing/services/MarketingDelivery';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('MarketingDelivery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('linkFor', () => {
    it('returns empty string if content cta_url is missing', () => {
      expect(MarketingDelivery.linkFor(null)).toBe('');
      expect(MarketingDelivery.linkFor({})).toBe('');
    });

    it('attaches campaign_id and delivery_id to cta_url', () => {
      const delivery = {
        id: 'del-123',
        campaign_id: 'camp-456',
        content: {
          cta_url: 'https://example.com/test?existing=true',
        },
      };

      const result = MarketingDelivery.linkFor(delivery);
      expect(result).toContain('campaign_id=camp-456');
      expect(result).toContain('delivery_id=del-123');
      expect(result).toContain('existing=true');
    });
  });

  describe('record', () => {
    it('skips insert if delivery is incomplete', async () => {
      await MarketingDelivery.record(null, 'impression');
      await MarketingDelivery.record({ id: '123' }, 'impression');
      await MarketingDelivery.record({ id: '123', campaign_id: '456' }, 'impression');

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('inserts marketing event with dedupe key', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ insert: insertMock });

      const delivery = {
        id: 'del-1',
        campaign_id: 'camp-1',
        user_id: 'user-1',
        channel: 'in_app',
      };

      await MarketingDelivery.record(delivery, 'click', { button: 'cta' });

      expect(supabase.from).toHaveBeenCalledWith('marketing_events');
      expect(insertMock).toHaveBeenCalledWith({
        campaign_id: 'camp-1',
        delivery_id: 'del-1',
        user_id: 'user-1',
        event_type: 'click',
        channel: 'in_app',
        dedupe_key: 'del-1:click',
        metadata: { button: 'cta' },
      });
    });

    it('ignores 23505 unique violation and 42P01 missing table errors', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
      });
      await expect(
        MarketingDelivery.record({ id: '1', campaign_id: '2', user_id: '3' }, 'click')
      ).resolves.not.toThrow();

      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { code: '42P01' } }),
      });
      await expect(
        MarketingDelivery.record({ id: '1', campaign_id: '2', user_id: '3' }, 'click')
      ).resolves.not.toThrow();
    });

    it('throws unexpected database errors', async () => {
      const dbError = new Error('Database connection failed');
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: dbError }),
      });

      await expect(
        MarketingDelivery.record({ id: '1', campaign_id: '2', user_id: '3' }, 'click')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('feedback', () => {
    it('returns null if delivery has no id', async () => {
      const result = await MarketingDelivery.feedback(null, 'dismissed');
      expect(result).toBeNull();
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('calls record_marketing_contact_feedback RPC', async () => {
      supabase.rpc.mockResolvedValue({ data: { success: true }, error: null });

      const delivery = { id: 'del-1' };
      const res = await MarketingDelivery.feedback(delivery, 'snoozed', {
        snoozedUntil: '2026-10-01T00:00:00Z',
        metadata: { reason: 'busy' },
      });

      expect(supabase.rpc).toHaveBeenCalledWith('record_marketing_contact_feedback', {
        p_delivery_id: 'del-1',
        p_action: 'snoozed',
        p_snoozed_until: '2026-10-01T00:00:00Z',
        p_metadata: { reason: 'busy' },
      });
      expect(res).toEqual({ success: true });
    });
  });

  describe('listActive', () => {
    it('returns empty array if userId is empty', async () => {
      const result = await MarketingDelivery.listActive(null);
      expect(result).toEqual([]);
    });

    it('filters out suppressed and expired deliveries', async () => {
      const now = Date.now();
      const mockDeliveries = [
        {
          id: 'del-active',
          campaign: { status: 'active', starts_at: new Date(now - 10000).toISOString() },
          intervention: { status: 'approved' },
        },
        {
          id: 'del-dismissed',
          campaign: { status: 'active' },
        },
        {
          id: 'del-future',
          campaign: { status: 'active', starts_at: new Date(now + 100000).toISOString() },
        },
        {
          id: 'del-expired-intervention',
          campaign: { status: 'active' },
          intervention: { status: 'approved', expires_at: new Date(now - 5000).toISOString() },
        },
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'marketing_deliveries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockDeliveries, error: null }),
          };
        }
        if (table === 'marketing_contact_feedback') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [{ delivery_id: 'del-dismissed', action: 'dismissed' }],
            }),
          };
        }
        return {};
      });

      const active = await MarketingDelivery.listActive('user-1');
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('del-active');
    });
  });
});
