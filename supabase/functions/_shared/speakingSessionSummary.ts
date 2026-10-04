/** Progress summaries cannot release a scoring claim or replace a saved report. */
export async function updateSpeakingSessionSummary(
  supabase: any,
  sessionId: string,
  buildUpdates: (session: any) => Record<string, unknown>
) {
  const { data: session, error } = await supabase
    .from('test_sessions')
    .select('content_data, answers, is_completed, evaluation_status')
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !session) return;
  if (session.is_completed || !['not_requested', 'failed'].includes(session.evaluation_status))
    return;

  const { error: updateError } = await supabase
    .from('test_sessions')
    .update(buildUpdates(session))
    .eq('id', sessionId)
    .eq('is_completed', false)
    // Recheck at write time: scoring may have started after the summary read.
    .in('evaluation_status', ['not_requested', 'failed']);
  if (updateError)
    console.warn('Could not synchronize Speaking V2 session summary', updateError.message);
}
