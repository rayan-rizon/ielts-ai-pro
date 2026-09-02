/**
 * Advance one server-owned Speaking part. A duplicate click can race the first
 * request, so reconcile a 409 with the authoritative state before failing.
 */
export async function advanceSpeakingV2Part({
  callEdgeFunction,
  sessionId,
  expectedRevision,
  currentPartNumber,
}) {
  try {
    return await callEdgeFunction('processSpeakingSessionV2', {
      action: 'advance_part',
      sessionId,
      expectedRevision,
    });
  } catch (error) {
    if (error?.status !== 409) throw error;

    const recovered = error.state
      ? { state: error.state }
      : await callEdgeFunction('processSpeakingSessionV2', {
          action: 'resume',
          sessionId,
        });
    if (Number(recovered?.state?.part) > currentPartNumber) return recovered;

    if (
      recovered?.state?.status === 'part_complete' &&
      Number.isFinite(Number(recovered.state.revision)) &&
      Number(recovered.state.revision) !== Number(expectedRevision)
    ) {
      return callEdgeFunction('processSpeakingSessionV2', {
        action: 'advance_part',
        sessionId,
        expectedRevision: Number(recovered.state.revision),
      });
    }

    throw error;
  }
}
