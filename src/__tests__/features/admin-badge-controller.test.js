import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAdminBadgeController,
  BADGE_REFRESH_MS,
  EMPTY_BADGE_COUNTS,
} from '@/features/core/components/Sidebar/adminBadgeController';

const data = (values = {}) => ({
  ...EMPTY_BADGE_COUNTS,
  observedAt: '2026-10-04T00:00:00Z',
  stripePaymentCount: 2,
  testReportCount: 3,
  ...values,
});
const drain = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const controllers = [];
function setup(respond = () => Promise.resolve({ data: data(), error: null })) {
  const client = {
    rpc: vi.fn((name, args) => ({ abortSignal: (signal) => respond(args, signal) })),
  };
  const onChange = vi.fn();
  const controller = createAdminBadgeController({ client, onChange });
  controllers.push(controller);
  return { client, onChange, controller };
}
function visibility(value) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('admin badge request lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    visibility('visible');
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });
  afterEach(() => {
    controllers.splice(0).forEach((controller) => controller.stop());
    vi.useRealTimers();
    visibility('visible');
  });

  it('fetches once per minute for every category without dismissal writes', async () => {
    const { client, controller } = setup();
    controller.start();
    await drain();
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 3);
    expect(client.rpc).toHaveBeenCalledTimes(4);
    expect(client.rpc.mock.calls.every(([, args]) => args.p_payment_seen_through === null)).toBe(
      true
    );
  });

  it('makes no requests while hidden and refreshes immediately on return', async () => {
    visibility('hidden');
    const { client, controller } = setup();
    controller.start();
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 10);
    expect(client.rpc).not.toHaveBeenCalled();
    visibility('visible');
    await drain();
    expect(client.rpc).toHaveBeenCalledTimes(1);
    visibility('hidden');
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 10);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it('pauses offline and resumes online', async () => {
    const { client, controller } = setup();
    controller.start();
    await drain();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    window.dispatchEvent(new Event('offline'));
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 5);
    expect(client.rpc).toHaveBeenCalledTimes(1);
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
    await drain();
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it('serializes requests under timer, focus, and navigation events', async () => {
    let finish;
    const { client, controller } = setup(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    controller.start();
    controller.refresh();
    controller.setPaymentsOpen(true);
    window.dispatchEvent(new Event('focus'));
    visibility('visible');
    expect(client.rpc).toHaveBeenCalledTimes(1);
    finish({ data: data(), error: null });
    await drain();
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it('acknowledges only loaded payment data, preserving later payments', async () => {
    const responses = [
      data(),
      data({ observedAt: '2026-10-04T00:00:01Z' }),
      data({ stripePaymentCount: 1 }),
    ];
    const { client, controller, onChange } = setup(() =>
      Promise.resolve({ data: responses.shift() || data(), error: null })
    );
    controller.start();
    await drain();
    controller.setPaymentsOpen(true);
    await drain();
    expect(client.rpc.mock.calls.every(([, args]) => args.p_payment_seen_through === null)).toBe(
      true
    );
    window.dispatchEvent(
      new CustomEvent('admin-payments-loaded', { detail: { observedAt: '2026-10-04T00:00:01Z' } })
    );
    await drain();
    expect(client.rpc).toHaveBeenLastCalledWith('get_admin_sidebar_badges', {
      p_payment_seen_through: '2026-10-04T00:00:01Z',
    });
    expect(onChange.mock.lastCall[0].stripePaymentCount).toBe(1);
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 3);
    expect(client.rpc.mock.calls.filter(([, args]) => args.p_payment_seen_through)).toHaveLength(1);
  });

  it('retries a failed acknowledgment with its original cutoff', async () => {
    let acknowledgmentCalls = 0;
    const { client, controller } = setup((args) =>
      Promise.resolve({
        data: data(),
        error:
          args.p_payment_seen_through && ++acknowledgmentCalls === 1
            ? { message: 'network' }
            : null,
      })
    );
    controller.setPaymentsOpen(true);
    controller.start();
    await drain();
    window.dispatchEvent(
      new CustomEvent('admin-payments-loaded', { detail: { observedAt: '2026-10-04T00:00:00Z' } })
    );
    await drain();
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 2);
    expect(
      client.rpc.mock.calls
        .filter(([, args]) => args.p_payment_seen_through)
        .map(([, args]) => args.p_payment_seen_through)
    ).toEqual(['2026-10-04T00:00:00Z', '2026-10-04T00:00:00Z']);
  });

  it('keeps the previous count on errors and backs off instead of replacing it with zero', async () => {
    let fail = false;
    const { client, controller, onChange } = setup(() =>
      Promise.resolve({ data: fail ? null : data(), error: fail ? { message: 'offline' } : null })
    );
    controller.start();
    await drain();
    fail = true;
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS);
    expect(onChange.mock.lastCall[0]).toMatchObject({ stripePaymentCount: 2, stale: true });
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS);
    expect(client.rpc).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS);
    expect(client.rpc).toHaveBeenCalledTimes(3);
  });

  it('rejects malformed responses and resets backoff after recovery', async () => {
    let payload = data({ testReportCount: -1 });
    const { client, controller, onChange } = setup(() => Promise.resolve({ data: payload }));
    controller.start();
    await drain();
    expect(onChange).not.toHaveBeenCalled();
    payload = data();
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 2);
    expect(onChange).toHaveBeenCalledWith({ ...data(), stale: false });
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS);
    expect(client.rpc).toHaveBeenCalledTimes(3);
  });

  it('aborts a hung request after 15 seconds and retries with backoff', async () => {
    const { client, controller } = setup(
      (args, signal) =>
        new Promise((resolve) => {
          signal.addEventListener('abort', () => resolve({ error: { message: 'aborted' } }));
        })
    );
    controller.start();
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 2);
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it('cancels unmount requests and ignores late responses', async () => {
    let finish;
    let requestSignal;
    const { client, controller, onChange } = setup((args, signal) => {
      requestSignal = signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    controller.start();
    controller.stop();
    expect(requestSignal.aborted).toBe(true);
    finish({ data: data() });
    await drain();
    await vi.advanceTimersByTimeAsync(BADGE_REFRESH_MS * 10);
    expect(onChange).not.toHaveBeenCalled();
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it('does not acknowledge if Payments was left before the snapshot finished', async () => {
    let finish;
    const { client, controller } = setup(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    controller.setPaymentsOpen(true);
    controller.start();
    controller.setPaymentsOpen(false);
    finish({ data: data() });
    await drain();
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc.mock.calls[0][1].p_payment_seen_through).toBeNull();
  });
});
