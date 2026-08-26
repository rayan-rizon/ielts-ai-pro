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
});
