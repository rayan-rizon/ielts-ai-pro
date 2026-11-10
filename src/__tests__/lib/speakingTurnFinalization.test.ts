import { afterEach, describe, expect, it, vi } from 'vitest';
import { finalizeSpeakingTurn } from '../../../supabase/functions/_shared/speakingTurnFinalization';

afterEach(() => vi.useRealTimers());

function database(results) {
  const rpc = vi.fn(() => ({ abortSignal: () => Promise.resolve(results.shift()) }));
  return { rpc };
}

const params = { authId: 'owner', turnId: 'turn-1', result: { transcript: 'My answer' } };

describe('speaking finalization reliability', () => {
  it('returns an inactive turn as a terminal conflict without retrying', async () => {
    const db = database([
      { data: { code: 'speaking_turn_inactive', retryable: false, state: { revision: 4 } } },
    ]);
    const outcome = await finalizeSpeakingTurn(db, params);
    expect(outcome).toMatchObject({
      status: 409,
      body: {
        success: false,
        code: 'speaking_turn_inactive',
        retryable: false,
        operationId: 'turn-1',
        state: { revision: 4 },
      },
    });
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });

  it('replays the saved answer instead of replacing it with a newly generated reply', async () => {
    const db = database([
      {
        data: { replayed: true, response: { examinerText: 'Saved reply' }, state: { revision: 5 } },
      },
    ]);
    await expect(finalizeSpeakingTurn(db, params)).resolves.toMatchObject({
      replayed: true,
      response: { examinerText: 'Saved reply' },
      state: { revision: 5 },
    });
  });

  it('caps transient database retries at three attempts', async () => {
    vi.useFakeTimers();
    const db = database(
      Array.from({ length: 3 }, () => ({ error: { code: '08006', message: 'connection lost' } }))
    );
    const pending = finalizeSpeakingTurn(db, params);
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({
      status: 503,
      body: { code: 'speaking_finalize_unavailable', retryable: true, operationId: 'turn-1' },
    });
    expect(db.rpc).toHaveBeenCalledTimes(3);
  });

  it('retries with the same turn and result, so a lost response cannot double-charge', async () => {
    vi.useFakeTimers();
    const db = database([
      { error: { code: '08006', message: 'connection lost' } },
      { data: { revision: 2 } },
    ]);
    const pending = finalizeSpeakingTurn(db, params);
    await vi.runAllTimersAsync();
    expect(await pending).toMatchObject({ state: { revision: 2 } });
    for (const call of db.rpc.mock.calls)
      expect(call).toEqual([
        'finalize_speaking_v2_turn',
        { p_auth_id: 'owner', p_turn_id: 'turn-1', p_result: { transcript: 'My answer' } },
      ]);
  });

  it('does not retry permission failures or expose database details', async () => {
    const db = database([{ error: { code: '42501', message: 'private database detail' } }]);
    const result = await finalizeSpeakingTurn(db, params);
    expect(result).toMatchObject({ status: 500, body: { retryable: false } });
    expect(JSON.stringify(result)).not.toContain('private database detail');
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });

  it('aborts a hung RPC and returns within the deadline without retrying it', async () => {
    vi.useFakeTimers();
    let signal;
    const db = {
      rpc: vi.fn(() => ({
        abortSignal: (value) => {
          signal = value;
          return new Promise(() => {});
        },
      })),
    };
    const pending = finalizeSpeakingTurn(db, params);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await pending).toMatchObject({
      status: 503,
      body: { code: 'speaking_finalize_timeout', retryable: true },
    });
    expect(signal.aborted).toBe(true);
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });
});
