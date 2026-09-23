type RecoveryResult =
  | { state: 'available'; response: { success: true; data: Record<string, unknown>; cached: true } }
  | { state: 'pending' | 'missing' };

/** Return a completed review without starting another paid model request. */
export async function recoverWritingFeedback(
  // deno-lint-ignore no-explicit-any
  db: any,
  reservationId: string | undefined,
  inputHash: string
): Promise<RecoveryResult> {
  if (!reservationId) return { state: 'missing' };

  const { data: usage, error: usageError } = await db
    .from('ai_api_usage')
    .select('request_metadata')
    .eq('id', reservationId)
    .maybeSingle();
  if (usageError || usage?.request_metadata?.inputHash !== inputHash) {
    return { state: 'missing' };
  }
  if (usage.request_metadata.reservationStatus !== 'completed') {
    return { state: 'pending' };
  }

  const savedResponse = usage.request_metadata.response;
  if (savedResponse?.success === true && savedResponse.data) {
    return {
      state: 'available',
      response: { success: true, data: savedResponse.data, cached: true },
    };
  }

  // Older completed reservations saved the report only in the shared cache.
  const { data: cached, error: cacheError } = await db
    .from('ai_feedback_cache')
    .select('feedback_json')
    .eq('input_hash', inputHash)
    .maybeSingle();
  if (!cacheError && cached?.feedback_json) {
    return {
      state: 'available',
      response: { success: true, data: cached.feedback_json, cached: true },
    };
  }
  return { state: 'missing' };
}
