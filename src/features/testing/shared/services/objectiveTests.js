import { supabase } from '@/lib/supabase';
import { getSupabaseFunctionHeaders } from '@/lib/csrf';

export const serverScoringEnabled = () => import.meta.env.VITE_SERVER_SCORING_ENABLED === 'true';
const revisions = new Map();
const pendingSaves = new Map();

export async function objectiveRequest(action, data) {
  const fingerprint = action === 'save' ? JSON.stringify(data) : null;
  if (fingerprint && !pendingSaves.has(fingerprint))
    pendingSaves.set(fingerprint, crypto.randomUUID());
  const { data: result, error } = await supabase.functions.invoke('objective-tests', {
    headers: getSupabaseFunctionHeaders(),
    body: {
      action,
      ...data,
      expectedRevision: data.sessionId ? revisions.get(data.sessionId) : undefined,
      requestId: fingerprint ? pendingSaves.get(fingerprint) : undefined,
    },
  });
  if (error || result?.error) {
    const response = error?.context?.clone
      ? await error.context
          .clone()
          .json()
          .catch(() => null)
      : result;
    throw new Error(
      response?.error || 'Your test could not be saved. Keep this page open and try again.'
    );
  }
  if (action === 'submit' && typeof result?.result?.correctAnswers !== 'number')
    throw new Error('Your result is not ready. Please try again.');
  if (data.sessionId && Number.isInteger(result?.revision))
    revisions.set(data.sessionId, result.revision);
  if (fingerprint) pendingSaves.delete(fingerprint);
  return result;
}

export function objectiveMetadata(data = {}) {
  return Object.fromEntries(
    [
      'time_remaining',
      'audio_current_time',
      'highlights',
      'notes',
      'passageTimes',
      'answerChangeCounts',
      'actual_duration_seconds',
    ]
      .filter((key) => data[key] !== undefined)
      .map((key) => [key, data[key]])
  );
}
