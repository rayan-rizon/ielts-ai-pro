import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePendingManualPayment,
  flushPendingManualPayments,
  getPendingManualPaymentCount,
} from '@/features/subscription/services/pendingManualPayment';

const STORAGE_KEY = 'pending_manual_payment_requests';

const request = (transactionId = 'TXN123') => ({
  auth_id: 'user-1',
  tier: 'pro',
  interval: 'monthly',
  amount: 990,
  currency: 'BDT',
  payment_method: 'bkash',
  transaction_id: transactionId,
  sender_phone: '01700000000',
  status: 'pending',
});

const makeSupabase = (insert) => ({ from: () => ({ insert }) });

describe('pending manual payment queue', () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('holds a submission whose insert could not reach the backend', () => {
    expect(savePendingManualPayment(request())).toBe(true);
    expect(getPendingManualPaymentCount()).toBe(1);
  });

  it('never queues the same transaction twice', () => {
    savePendingManualPayment(request());
    savePendingManualPayment(request());
    expect(getPendingManualPaymentCount()).toBe(1);
  });

  it('replays held submissions and clears them once accepted', async () => {
    savePendingManualPayment(request('TXN-A'));
    savePendingManualPayment(request('TXN-B'));

    const insert = vi.fn().mockResolvedValue({ error: null });
    const result = await flushPendingManualPayments(makeSupabase(insert));

    expect(insert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ flushed: 2, remaining: 0 });
    expect(getPendingManualPaymentCount()).toBe(0);
  });

  it('keeps a submission queued when the backend is still unreachable', async () => {
    savePendingManualPayment(request('TXN-C'));

    const insert = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await flushPendingManualPayments(makeSupabase(insert));

    expect(result).toEqual({ flushed: 0, remaining: 1 });
    expect(getPendingManualPaymentCount()).toBe(1);
  });

  it('treats a duplicate-key conflict as already recorded, not a failure', async () => {
    savePendingManualPayment(request('TXN-D'));

    // The row landed on an earlier attempt we never saw the response for.
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505' } });
    const result = await flushPendingManualPayments(makeSupabase(insert));

    expect(result).toEqual({ flushed: 1, remaining: 0 });
    expect(getPendingManualPaymentCount()).toBe(0);
  });

  it('does no work and makes no calls when nothing is queued', async () => {
    const insert = vi.fn();
    const result = await flushPendingManualPayments(makeSupabase(insert));
    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({ flushed: 0, remaining: 0 });
  });
});
