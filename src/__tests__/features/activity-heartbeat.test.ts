import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('activity heartbeat coordination', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T17:59:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('shares pending calls and throttles only successfully recorded activity', async () => {
    const { recordActivityHeartbeat } = await import('@/features/auth/services/activityHeartbeat');
    let resolve!: (value: boolean) => void;
    const send = vi.fn(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        })
    );
    const first = recordActivityHeartbeat('user-1', send);
    const second = recordActivityHeartbeat('user-1', send);
    expect(send).toHaveBeenCalledTimes(1);
    resolve(true);
    await Promise.all([first, second]);
    await recordActivityHeartbeat('user-1', send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('records Dhaka midnight even within the five-minute cooldown', async () => {
    const { recordActivityHeartbeat } = await import('@/features/auth/services/activityHeartbeat');
    const send = vi.fn().mockResolvedValue(true);
    await recordActivityHeartbeat('user-1', send);
    vi.setSystemTime(new Date('2026-10-12T18:00:00Z'));
    await recordActivityHeartbeat('user-1', send);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('retries failure and isolates accounts', async () => {
    const { recordActivityHeartbeat } = await import('@/features/auth/services/activityHeartbeat');
    const send = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    await recordActivityHeartbeat('user-1', send);
    await recordActivityHeartbeat('user-1', send);
    await recordActivityHeartbeat('user-2', send);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('allows a post-profile-creation heartbeat past an earlier successful no-op', async () => {
    const { recordActivityHeartbeat } = await import('@/features/auth/services/activityHeartbeat');
    const send = vi.fn().mockResolvedValue(true);
    await recordActivityHeartbeat('new-user', send);
    await recordActivityHeartbeat('new-user', send, { force: true });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('honors another tab and recovers future timestamps after clock rollback', async () => {
    const { recordActivityHeartbeat } = await import('@/features/auth/services/activityHeartbeat');
    const send = vi.fn().mockResolvedValue(true);
    localStorage.setItem('activity_heartbeat:user-1', String(Date.now()));
    await recordActivityHeartbeat('user-1', send);
    expect(send).not.toHaveBeenCalled();
    localStorage.setItem('activity_heartbeat:user-1', String(Date.now() + 60000));
    await recordActivityHeartbeat('user-1', send);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
