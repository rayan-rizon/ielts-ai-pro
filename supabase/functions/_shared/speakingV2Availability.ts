type SessionState = {
  mode: string;
  status: string;
  revision?: number;
  expires_at?: string | null;
  resume_expires_at?: string | null;
};

export const SPEAKING_EXPIRED_MESSAGE =
  'This speaking session has expired. Return to Speaking and restart the test.';

export function isSpeakingSessionExpired(state: SessionState, now = Date.now()) {
  const deadline = state.mode === 'practice' ? state.resume_expires_at : state.expires_at;
  return (
    state.status === 'expired' ||
    (!['completed', 'ready_for_evaluation'].includes(state.status) &&
      Boolean(deadline) &&
      now >= Date.parse(deadline!))
  );
}

export function toExpiredSpeakingState<T extends Record<string, unknown>>(state: T) {
  return { ...state, status: 'expired' as const };
}

export async function prepareSpeakingTurnState<T extends SessionState>(
  state: T,
  expectedRevision: number,
  resume: () => Promise<T>
): Promise<T> {
  if (
    state.mode !== 'practice' ||
    !['active', 'paused'].includes(state.status) ||
    state.revision !== expectedRevision ||
    isSpeakingSessionExpired(state)
  )
    return state;
  // An authenticated answer is activity, including when a background tab's
  // heartbeat was throttled during recording. Preserve all existing time limits.
  return resume();
}
