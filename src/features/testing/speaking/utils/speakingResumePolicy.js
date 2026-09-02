/**
 * A V2 report can only start from the database-owned speaking state. Older
 * client snapshots may contain a stale `evaluationPending` flag after a
 * rejected request, so they are intentionally ignored for V2 sessions.
 */
export function shouldResumeSpeakingFinalEvaluation({
  isSpeakingV2,
  serverStatus,
  evaluationPending,
  hasSavedConversation,
}) {
  if (isSpeakingV2) return serverStatus === 'ready_for_evaluation';
  return Boolean(evaluationPending && hasSavedConversation);
}
