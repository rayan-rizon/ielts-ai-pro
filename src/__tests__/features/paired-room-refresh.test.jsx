import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePairedRoom } from '@/features/testing/paired/usePairedRoom';

const state = vi.hoisted(() => ({ request: vi.fn(), subscribed: null, broadcast: null }));
vi.mock('@/features/testing/paired/pairedApi', () => ({ pairedRequest: state.request }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: () => {
      const channel = {
        on: (type, _options, callback) => {
          if (type === 'broadcast') state.broadcast = callback;
          return channel;
        },
        subscribe: (callback) => {
          state.subscribed = callback;
          return channel;
        },
        track: vi.fn(),
      };
      return channel;
    },
    removeChannel: vi.fn(),
  },
}));

describe('paired-room refreshes', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shares a pending read between polling, broadcasts and subscription', async () => {
    vi.useFakeTimers();
    let finish;
    state.request.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const { unmount } = renderHook(() => usePairedRoom('room'));
    await act(async () => {});
    await act(async () => {
      state.subscribed('SUBSCRIBED');
      state.broadcast();
      window.dispatchEvent(new Event('online'));
      vi.advanceTimersByTime(6000);
    });
    expect(state.request).toHaveBeenCalledTimes(1);
    await act(async () =>
      finish({
        state: 'running',
        own: { revision: 1 },
        server_now: new Date().toISOString(),
        actor_id: 'user',
      })
    );
    await act(async () => {
      vi.advanceTimersByTime(9999);
    });
    // A broadcast gets one trailing read so writes during a pending request
    // remain visible; polling and subscription add no queued reads.
    expect(state.request).toHaveBeenCalledTimes(2);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(state.request).toHaveBeenCalledTimes(3);
    unmount();
  });
});
