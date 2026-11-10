import { afterEach, describe, expect, it, vi } from 'vitest';
import { callEdgeFunctionMultipart } from '@/utils/api';

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: async () => ({
    auth: {
      getSession: async () => ({
        data: { session: { access_token: 'test-session' } },
        error: null,
      }),
    },
  }),
}));

afterEach(() => vi.unstubAllGlobals());

describe('Edge Function error contract', () => {
  it('preserves terminal retry policy and operation ID for speaking callers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: 'Turn is no longer active',
              code: 'speaking_turn_inactive',
              retryable: false,
              operationId: 'turn-1',
              state: { revision: 3 },
            }),
            { status: 409 }
          )
      )
    );
    await expect(
      callEdgeFunctionMultipart('processSpeakingSessionV2', new FormData())
    ).rejects.toMatchObject({
      status: 409,
      code: 'speaking_turn_inactive',
      retryable: false,
      operationId: 'turn-1',
      state: { revision: 3 },
    });
  });
});
