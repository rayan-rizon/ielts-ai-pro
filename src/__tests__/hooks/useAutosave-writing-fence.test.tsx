import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  state: 'pending',
  content: { ai_feedbacks: { 'Task 1': { overallBand: 8 } } } as unknown,
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      let payload: any;
      let excludedState: string | undefined;
      const query = {
        update: (value: any) => {
          payload = value;
          return query;
        },
        eq: () => query,
        neq: (_column: string, value: string) => {
          excludedState = value;
          return query;
        },
        then: (resolve: (result: { error: null }) => unknown) => {
          if (database.state !== excludedState) database.content = payload.content_data;
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return query;
    },
  },
}));
import { useAutosave } from '@/hooks/useAutosave';

describe('Writing autosave evaluation fence', () => {
  beforeEach(() => {
    database.state = 'pending';
    database.content = { ai_feedbacks: { 'Task 1': { overallBand: 8 } } };
  });

  it('preserves worker feedback when an older tab tries saving after the evaluation claim', async () => {
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 'writing-1', test_type: 'writing', content_data: {} },
        getAnswers: () => [{ task1_response: 'old draft' }],
        isFinished: false,
      })
    );
    await act(async () => {
      await result.current.saveNow();
    });
    expect(database.content).toEqual({ ai_feedbacks: { 'Task 1': { overallBand: 8 } } });
  });

  it('still saves ordinary drafts before a Writing evaluation is claimed', async () => {
    database.state = 'not_requested';
    const { result } = renderHook(() =>
      useAutosave({
        session: { id: 'writing-1', test_type: 'writing', content_data: {} },
        getAnswers: () => [{ task1_response: 'new draft' }],
        getExtraData: () => ({ time_remaining: 90 }),
        isFinished: false,
      })
    );
    await act(async () => {
      await result.current.saveNow();
    });
    expect(database.content).toMatchObject({ time_remaining: 90 });
  });
});
