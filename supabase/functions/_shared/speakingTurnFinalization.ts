type FinalizeParams = { authId: string; turnId: string; result: Record<string, unknown> };
type DatabaseError = { code?: string; message?: string };

const TRANSIENT_CODES = new Set([
  '08000',
  '08003',
  '08006',
  '40001',
  '40P01',
  '53300',
  '57014',
  'PGRST000',
  'PGRST001',
  'PGRST002',
  'PGRST003',
]);

function failure(turnId: string, code: string, status: number, retryable: boolean) {
  return {
    status,
    body: {
      success: false,
      code,
      retryable,
      operationId: turnId,
      error:
        'Your answer could not be saved. Please refresh the speaking session before continuing.',
    },
  };
}

function finalizationOutcome(data: any, turnId: string) {
  if (data?.code === 'speaking_turn_inactive') {
    const conflict = failure(turnId, data.code, 409, false);
    return { ...conflict, body: { ...conflict.body, state: data.state } };
  }
  if (!data) return failure(turnId, 'speaking_finalize_invalid', 500, false);
  return {
    state: data.state || data,
    replayed: data.replayed === true,
    response: data.response,
    operationId: turnId,
  };
}

async function requestFinalization(supabase: any, params: FinalizeParams, signal: AbortSignal) {
  try {
    return (await supabase
      .rpc('finalize_speaking_v2_turn', {
        p_auth_id: params.authId,
        p_turn_id: params.turnId,
        p_result: params.result,
      })
      .abortSignal(signal)) as { data?: any; error?: DatabaseError };
  } catch (error) {
    return { error: { code: error instanceof TypeError ? '08006' : 'unknown' } };
  }
}

function isTransient(error: DatabaseError) {
  return TRANSIENT_CODES.has(error.code || '');
}

async function runAttempts(supabase: any, params: FinalizeParams, signal: AbortSignal) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const outcome = await requestFinalization(supabase, params, signal);
    if (signal.aborted) return failure(params.turnId, 'speaking_finalize_timeout', 503, true);
    if (!outcome.error) return finalizationOutcome(outcome.data, params.turnId);
    const transient = isTransient(outcome.error);
    if (!transient || attempt === 3) {
      return failure(
        params.turnId,
        'speaking_finalize_unavailable',
        transient ? 503 : 500,
        transient
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** (attempt - 1)));
    if (signal.aborted) return failure(params.turnId, 'speaking_finalize_timeout', 503, true);
  }
  return failure(params.turnId, 'speaking_finalize_unavailable', 503, true);
}

/** Retries are safe only because the database replays an already finalized turn. */
export async function finalizeSpeakingTurn(supabase: any, params: FinalizeParams) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<ReturnType<typeof failure>>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(failure(params.turnId, 'speaking_finalize_timeout', 503, true));
    }, 8000);
  });
  try {
    return await Promise.race([runAttempts(supabase, params, controller.signal), deadline]);
  } finally {
    clearTimeout(timer!);
  }
}
