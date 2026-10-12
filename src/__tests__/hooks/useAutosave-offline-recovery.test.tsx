import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ offline: true, writes: [] as any[] }));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: (payload: any) => ({
        eq: () => ({
          eq: async () => {
            db.writes.push(payload);
            return { error: db.offline ? new Error('Offline') : null };
          },
        }),
      }),
    }),
  },
}));
import { useAutosave } from '@/hooks/useAutosave';

describe('autosave offline recovery', () => {
  afterEach(() => vi.useRealTimers());
  it('reconnects with the newest answers and metadata instead of the failed snapshot', async () => {
    vi.useFakeTimers();
    db.offline = true;
    db.writes = [];
    let answers = { q1: 'older answer' };
    let time = 100;
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 's1', content_data: {} },
        getAnswers: () => answers,
        getExtraData: () => ({ time_remaining: time }),
        isFinished: false,
      })
    );
    let failed!: Promise<boolean>;
    await act(async () => {
      failed = result.current.saveNow();
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(await failed).toBe(false);
    answers = { q1: 'new answer while offline' };
    time = 90;
    db.offline = false;
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(db.writes.at(-1)).toMatchObject({
      user_responses: answers,
      content_data: { time_remaining: 90 },
    });
  });
});
