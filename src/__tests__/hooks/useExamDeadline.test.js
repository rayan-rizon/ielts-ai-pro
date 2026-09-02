import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExamDeadline } from '@/features/testing/shared/hooks/useExamDeadline';

describe('useExamDeadline', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('asks the caller to handle an already-expired resumed exam without auto-submitting', () => {
    const onExpire = vi.fn();
    const onResumeExpired = vi.fn();

    renderHook(() =>
      useExamDeadline({
        session: {
          id: 'expired-session',
          test_mode: 'mock',
          started_at: new Date(Date.now() - 61 * 60 * 1000).toISOString(),
        },
        isFinished: false,
        onTick: vi.fn(),
        onExpire,
        onResumeExpired,
      })
    );

    expect(onResumeExpired).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('still expires an active exam when its deadline is reached', () => {
    const onExpire = vi.fn();

    renderHook(() =>
      useExamDeadline({
        session: {
          id: 'active-session',
          test_mode: 'mock',
          started_at: new Date(Date.now() - 59 * 60 * 1000 - 59 * 1000).toISOString(),
        },
        isFinished: false,
        durationSeconds: 60 * 60,
        onTick: vi.fn(),
        onExpire,
      })
    );

    vi.advanceTimersByTime(1000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('uses elapsed wall-clock time after a delayed background-tab tick', () => {
    const onTick = vi.fn();
    const onExpire = vi.fn();
    const now = new Date('2026-08-29T00:00:00.000Z');
    vi.setSystemTime(now);

    renderHook(() =>
      useExamDeadline({
        session: {
          id: 'backgrounded-session',
          test_mode: 'mock',
          started_at: now.toISOString(),
        },
        isFinished: false,
        durationSeconds: 60,
        onTick,
        onExpire,
      })
    );

    vi.setSystemTime(new Date(now.getTime() + 5 * 60 * 1000));
    vi.advanceTimersByTime(1000);

    expect(onTick).toHaveBeenLastCalledWith(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
