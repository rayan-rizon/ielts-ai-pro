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
export const sendCoachMessage = ({
  requestId = crypto.randomUUID(),
  conversationId,
  message,
  preferredLanguage,
  sourceReference,
}) =>
  invoke({
    operation: 'send',
    requestId,
    conversationId,
    message,
    preferredLanguage,
    sourceReference,
  });
export const saveCoachPreferences = (explanationLanguage) =>
  invoke({ operation: 'save_preferences', explanationLanguage });
export const confirmCoachAction = (proposalId) =>
  invoke({ operation: 'confirm_action', proposalId });
export const checkCoachExercise = (messageId, selectedIndex) =>
  invoke({ operation: 'check_exercise', messageId, selectedIndex });
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
