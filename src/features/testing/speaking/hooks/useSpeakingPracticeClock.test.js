import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useSpeakingPracticeClock, { createPracticeClockSync } from './useSpeakingPracticeClock';
import { callEdgeFunction } from '@/utils/api';

vi.mock('@/utils/api', () => ({ callEdgeFunction: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('server-authoritative speaking practice pause', () => {
  it('pauses the backend clock and sends no heartbeats while paused, then resumes', async () => {
    vi.useFakeTimers();
    callEdgeFunction.mockImplementation(async (_name, body) => ({
      state: { status: body.action },
    }));
    const setState = vi.fn(),
      onError = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ paused }) =>
        useSpeakingPracticeClock({
          enabled: true,
          sessionId: 'qa-session',
          isPaused: paused,
          setState,
          onError,
        }),
      { initialProps: { paused: false } }
    );
    await act(async () => vi.advanceTimersByTimeAsync(15_000));
    expect(callEdgeFunction).toHaveBeenLastCalledWith('processSpeakingSessionV2', {
      action: 'heartbeat',
      sessionId: 'qa-session',
    });
    await act(async () => rerender({ paused: true }));
    expect(callEdgeFunction).toHaveBeenLastCalledWith('processSpeakingSessionV2', {
      action: 'pause',
      sessionId: 'qa-session',
    });
    const pausedCalls = callEdgeFunction.mock.calls.length;
    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(callEdgeFunction).toHaveBeenCalledTimes(pausedCalls);
    await act(async () => rerender({ paused: false }));
    expect(callEdgeFunction).toHaveBeenLastCalledWith('processSpeakingSessionV2', {
      action: 'resume_practice',
      sessionId: 'qa-session',
    });
    unmount();
    const calls = callEdgeFunction.mock.calls.length;
    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(callEdgeFunction).toHaveBeenCalledTimes(calls);
  });

  it('serializes rapid pause/resume after a slow heartbeat and ignores stale time', async () => {
    let resolveHeartbeat;
    const send = vi.fn((action) =>
      action === 'heartbeat'
        ? new Promise((resolve) => {
            resolveHeartbeat = resolve;
          })
        : Promise.resolve({ state: { status: action } })
    );
    const applyState = vi.fn();
    const clock = createPracticeClockSync({ send, applyState, onError: vi.fn() });
    const heartbeat = clock.heartbeat();
    await Promise.resolve();
    clock.setPaused(true);
    const resumed = clock.setPaused(false);
    resolveHeartbeat({ state: { remainingActiveSeconds: 100 } });
    await heartbeat;
    await resumed;
    expect(send.mock.calls.map(([action]) => action)).toEqual([
      'heartbeat',
      'pause',
      'resume_practice',
    ]);
    expect(applyState.mock.calls).toEqual([[{ status: 'resume_practice' }]]);
  });

  it('reports a failed pause, continues the queue, and never updates an unmounted session', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ state: { status: 'active' } });
    const applyState = vi.fn(),
      onError = vi.fn();
    const clock = createPracticeClockSync({ send, applyState, onError });
    await clock.setPaused(true);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'pause', true);
    await clock.setPaused(false);
    expect(applyState).toHaveBeenCalledWith({ status: 'active' });
    clock.dispose();
    await clock.heartbeat();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not pause or heartbeat the authoritative exam clock', async () => {
    vi.useFakeTimers();
    renderHook(() =>
      useSpeakingPracticeClock({
        enabled: false,
        sessionId: 'exam-session',
        isPaused: true,
        setState: vi.fn(),
        onError: vi.fn(),
      })
    );
    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(callEdgeFunction).not.toHaveBeenCalled();
  });
});
