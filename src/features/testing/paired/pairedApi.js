import { supabase } from '@/lib/supabase';
export async function pairedRequest(action, room = null, data = {}) {
  const { data: result, error } = await supabase.functions.invoke('paired-tests', {
    body: { action, room, data },
  });
  if (error) {
    let message = 'Unable to reach your study room. Please retry.';
    try {
      message = (await error.context.json()).error || message;
    } catch {
      /* Network errors have no body. */
    }
    throw new Error(message);
  }
  if (result?.error) throw new Error(result.error);
  return result;
}
export function testRoomPath(room) {
  return `/${room.test_type}-test/${room.own.session_id}?room=${room.id}`;
}

export function invitationPath(room) {
  return `/${room.test_type}-test/${room.passage_id}#invite=${room.invite_token}`;
}
export function roomLobbyPath(room) {
  return `/${room.test_type}-test/${room.passage_id}?room=${room.id}`;
}
