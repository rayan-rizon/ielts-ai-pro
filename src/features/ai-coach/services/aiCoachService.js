import { supabase } from '@/lib/supabase';
import { getSupabaseFunctionHeaders } from '@/lib/csrf';

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    headers: getSupabaseFunctionHeaders(),
    body,
  });
  if (error) {
    let message = data?.error;
    try {
      message = (await error.context?.json())?.error || message;
    } catch {
      // Keep the safe fallback below when the gateway returned no JSON body.
    }
    const wrapped = new Error(message || 'AI Coach is temporarily unavailable. Please try again.');
    wrapped.requestOutcomeUnknown = error?.name === 'FunctionsFetchError';
    throw wrapped;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const bootstrapCoach = () => invoke({ operation: 'bootstrap' });
export const loadCoachHistory = (conversationId, before = null) =>
  invoke({ operation: 'history', conversationId, before });
/**
 * Read a text/event-stream reply from the coach. The server sends `delta` events with
 * validated sentences as they are ready, `reset` when a streamed draft is superseded,
 * then exactly one `final` (the saved, validated reply) or `error`.
 */
export async function readCoachStream(response, { onDelta, onReset } = {}) {
  const reader = response.body?.getReader();
  if (!reader) throw streamInterrupted();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;
  const handle = (block) => {
    let event = 'message';
    const dataLines = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    let data;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }
    if (event === 'delta') onDelta?.(String(data?.text || ''));
    else if (event === 'reset') onReset?.();
    else if (event === 'final') result = data;
    else if (event === 'error') {
      const error = new Error(
        data?.error || 'AI Coach is temporarily unavailable. Please try again.'
      );
      // The server finished the request, so retrying with the same id is not needed.
      error.requestOutcomeUnknown = false;
      throw error;
    }
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        handle(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
    if (buffer.trim()) handle(buffer);
  } catch (error) {
    if (error?.requestOutcomeUnknown === false) throw error;
    throw streamInterrupted();
  }
  if (!result) throw streamInterrupted();
  return result;
}

function streamInterrupted() {
  // The connection dropped mid-reply. The request may still have completed on the server,
  // so the page retries with the same request id and gets the saved reply back.
  const error = new Error('The connection was interrupted. Please try again.');
  error.requestOutcomeUnknown = true;
  return error;
}

export async function sendCoachMessage({
  requestId = crypto.randomUUID(),
  conversationId,
  message,
  preferredLanguage,
  sourceReference,
  languageHint,
  onDelta,
  onReset,
}) {
  const stream = typeof onDelta === 'function';
  const data = await invoke({
    operation: 'send',
    requestId,
    conversationId,
    message,
    preferredLanguage,
    sourceReference,
    ...(languageHint ? { languageHint } : {}),
    ...(stream ? { stream: true } : {}),
  });
  // A replayed request, or a server without streaming, answers with plain JSON.
  if (typeof Response !== 'undefined' && data instanceof Response)
    return readCoachStream(data, { onDelta, onReset });
  return data;
}
export const saveCoachPreferences = (explanationLanguage) =>
  invoke({ operation: 'save_preferences', explanationLanguage });
export const confirmCoachAction = (proposalId) =>
  invoke({ operation: 'confirm_action', proposalId });
export const checkCoachExercise = (messageId, selectedIndex) =>
  invoke({ operation: 'check_exercise', messageId, selectedIndex });
export const getCoachSourcePreview = (sessionId) =>
  invoke({ operation: 'source_preview', sessionId });
export const forgetCoachMemory = ({ index, all = false }) =>
  invoke({ operation: 'memory_forget', index, all });
export const deleteCoachConversation = (conversationId) =>
  invoke({ operation: 'delete_conversation', conversationId });

export async function executeConfirmedClientAction(result) {
  if (result?.action !== 'reschedule_activity' || !result?.payload?.requiresClientExecution)
    return result;
  const { error } = await supabase.rpc('reschedule_learning_path_activity', {
    p_activity_id: result.payload.activityId,
    p_scheduled_date: result.payload.scheduledDate,
  });
  if (error) throw error;
  return result;
}
