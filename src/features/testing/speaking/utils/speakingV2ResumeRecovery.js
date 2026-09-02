export function shouldStartUninitializedSpeakingV2Session({ isSpeakingV2, error }) {
  if (!isSpeakingV2) return false;
  const message = String(error?.userMessage || error?.message || error || '').toLowerCase();
  return message.includes('practice session not found') || message.includes('v2 session not found');
}
