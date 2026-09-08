import { supabase } from '@/lib/supabase';
import { getSupabaseFunctionHeaders } from '@/lib/csrf';
export async function lessonAction(action, sessionId = null, data = {}) {
  const { data: result, error } = await supabase.rpc('skill_lab_action', {
    p_action: action,
    p_session: sessionId,
    p_data: data,
  });
  if (error) {
    const message = String(error.message || '');
    if (/schema cache|could not find the function public\.skill_lab_action/i.test(message)) {
      throw new Error(
        'Practice Lab is not set up in this Supabase project yet. Apply the latest database migrations, then reload.'
      );
    }
    throw new Error(message || 'Your lesson could not be loaded. Please try again.');
  }
  return result;
}
export async function askTutor({ sessionId, kind, answer, audio, requestId }) {
  const { data, error } = await supabase.functions.invoke('skill-lab', {
    headers: getSupabaseFunctionHeaders(),
    body: { sessionId, kind, answer, audio, requestId },
  });
  if (error) {
    let message = data?.error;
    try {
      message = (await error.context?.json())?.error || message;
    } catch {
      /* safe generic fallback */
    }
    throw new Error(message || 'AI help is unavailable. Your progress is saved. Please try again.');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
