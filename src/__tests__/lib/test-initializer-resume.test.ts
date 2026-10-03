import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTest } from '@/lib/testInitializer';

const state = vi.hoisted(() => ({
  select: vi.fn(),
  is: vi.fn(),
  lookupError: null as unknown,
  sessionError: null as unknown,
}));
const passageId = '123e4567-e89b-12d3-a456-426614174000';
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      let selection = '';
      const query = {
        select: (value: string) => {
          selection = value;
          state.select(value);
          return query;
        },
        eq: () => query,
        is: (...args: unknown[]) => {
          state.is(...args);
          return query;
        },
        maybeSingle: async () => ({ data: null, error: state.sessionError }),
        order: async () => ({
          data: state.lookupError ? null : [{ id: 'saved-attempt', is_completed: false }],
          error:
            state.lookupError ||
            (/\b(time_remaining|time_spent)\b/.test(selection)
              ? { code: '42703', message: 'column does not exist' }
              : null),
        }),
      };
      return query;
    },
  },
}));
vi.mock('@/entities', () => ({
  Passage: {
    getByIdCached: async () => ({
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Listening',
      content: '[]',
    }),
  },
  Question: { listByPassageIdCached: async () => [] },
  User: { me: async () => null },
}));
vi.mock('@/features/testing/shared/services/objectiveTests', () => ({
  serverScoringEnabled: () => false,
  objectiveRequest: vi.fn(),
}));

describe('legacy objective-test resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.lookupError = null;
    state.sessionError = null;
  });

  it('resumes saved work using columns present in the live schema', async () => {
    const result = await initializeTest({
      type: 'listening',
      id: passageId,
      user: { id: 'learner' },
    });
    expect(result.session?.id).toBe('saved-attempt');
    expect(state.select.mock.calls.at(-1)?.[0]).not.toMatch(/\b(time_remaining|time_spent)\b/);
    expect(state.is).toHaveBeenCalledWith('paired_room_id', null);
  });

  it('surfaces lookup failures rather than treating saved work as missing', async () => {
    state.lookupError = { code: '42501', message: 'permission denied' };
    await expect(
      initializeTest({ type: 'reading', id: passageId, user: { id: 'learner' } })
    ).rejects.toEqual(state.lookupError);
  });

  it('surfaces a failed session URL lookup for authenticated learners', async () => {
    state.sessionError = { code: '42501', message: 'permission denied' };
    await expect(
      initializeTest({ type: 'listening', id: passageId, user: { id: 'learner' } })
    ).rejects.toEqual(state.sessionError);
  });

  it('preserves guest practice when private session access is denied', async () => {
    state.sessionError = { code: '42501', message: 'permission denied' };
    const result = await initializeTest({ type: 'listening', id: passageId });
    expect(result.user).toBeNull();
    expect(result.session).toBeNull();
  });
});
