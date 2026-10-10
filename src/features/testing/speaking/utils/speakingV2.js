export const SPEAKING_MODES = Object.freeze({
  EXAM: 'exam',
  PRACTICE: 'practice',
});

// Session length shown when a learner chooses a mode. Practice is labelled by
// its typical length including the coach's replies (the server still budgets
// 8 minutes of active speaking); exam is a fixed session, like the real test.
export const SPEAKING_MODE_MINUTES = Object.freeze({
  practice: 10,
  exam: 14,
});

export function isSpeakingV2Available(user) {
  // Speaking V2 is now the production implementation for all new sessions.
  // Keep the parameter temporarily so existing callers remain source-compatible.
  void user;
  return true;
}

export function formatSpeakingBudget(state) {
  if (!state) return null;
  if (state.remainingActiveSeconds != null) {
    const minutes = Math.floor(state.remainingActiveSeconds / 60);
    const seconds = String(state.remainingActiveSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds} active time`;
  }
  if (state.expiresAt) return '14-minute fixed session';
  return `${state.remainingTurns ?? 0} turns remaining`;
}

export function getVisibleSpeakingConversation(conversation, speakingMode) {
  // Practice coaching is spoken inside the examiner turn; 'coach' cards saved
  // by older sessions are no longer shown.
  return speakingMode === 'exam'
    ? conversation.filter((entry) => entry.speaker === 'ai')
    : conversation.filter((entry) => entry.speaker !== 'coach');
}
