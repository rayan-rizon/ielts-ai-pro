import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  payloads: [] as Array<Record<string, unknown>>,
  completions: [] as Array<() => void>,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn((payload: Record<string, unknown>) => {
        database.payloads.push(payload);
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(
              () =>
                new Promise<{ error: null }>((resolve) => {
                  database.completions.push(() => resolve({ error: null }));
                })
            ),
          })),
        };
      }),
    })),
  },
}));

import { useAutosave } from '@/hooks/useAutosave';

describe('autosave serialization', () => {
  beforeEach(() => {
    database.payloads.length = 0;
    database.completions.length = 0;
  });

  it('waits for an active save and then flushes the latest answers', async () => {
    let answers = { response: 'older snapshot' };
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 'session-1', content_data: {} },
        getAnswers: () => answers,
        isFinished: false,
      })
    );

    let firstSave!: Promise<boolean>;
    act(() => {
      firstSave = result.current.saveNow();
    });
    await waitFor(() => expect(database.payloads).toHaveLength(1));

    answers = { response: 'latest answer before navigation' };
    let finalFlush!: Promise<boolean>;
    act(() => {
      finalFlush = result.current.saveNow();
    });

    expect(database.payloads).toHaveLength(1);
    await act(async () => {
      database.completions.shift()?.();
      await firstSave;
    });

    await waitFor(() => expect(database.payloads).toHaveLength(2));
    expect(database.payloads[1].user_responses).toEqual({
      response: 'latest answer before navigation',
    });

    await act(async () => {
      database.completions.shift()?.();
      await finalFlush;
    });
  });

  it('serializes multiple manual flushes that were queued behind one active save', async () => {
    let answers = { response: 'first' };
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 'session-1', content_data: {} },
        getAnswers: () => answers,
        isFinished: false,
      })
    );

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    let third!: Promise<boolean>;
    act(() => {
      first = result.current.saveNow();
      second = result.current.saveNow();
      third = result.current.saveNow();
    });
    await waitFor(() => expect(database.payloads).toHaveLength(1));

    answers = { response: 'second' };
    await act(async () => database.completions.shift()?.());
    await waitFor(() => expect(database.payloads).toHaveLength(2));

    answers = { response: 'third' };
    await act(async () => database.completions.shift()?.());
    await waitFor(() => expect(database.payloads).toHaveLength(3));

    await act(async () => database.completions.shift()?.());
    await Promise.all([first, second, third]);
    expect(database.payloads.map((payload) => payload.user_responses)).toEqual([
      { response: 'first' },
      { response: 'second' },
      { response: 'third' },
    ]);
  });

  it('skips acknowledged unchanged flushes but preserves timer and annotation changes', async () => {
    let metadata = { time_remaining: 120, notes: { q1: 'first note' } };
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 'session-1', content_data: {} },
        getAnswers: () => ({ q1: 'TRUE' }),
        getExtraData: () => metadata,
        isFinished: false,
      })
    );
    const flush = async () => {
      let pending!: Promise<boolean>;
      act(() => {
        pending = result.current.saveNow();
      });
      await waitFor(() => expect(database.completions).toHaveLength(1));
      await act(async () => {
        database.completions.shift()?.();
        await pending;
      });
    };
    await flush();
    await act(async () => expect(await result.current.saveNow()).toBe(true));
    expect(database.payloads).toHaveLength(1);
    metadata = { ...metadata, time_remaining: 100 };
    await flush();
    metadata = { ...metadata, notes: { q1: 'edited note' } };
    await flush();
    expect(database.payloads).toHaveLength(3);
    expect(database.payloads[2].content_data).toMatchObject(metadata);
  });
});
