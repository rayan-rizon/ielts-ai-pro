import { withoutSolutions } from './paired.js';
export function publicRoom(room, includeSnapshot = true) {
  if (Array.isArray(room) || room.preview || room.error) return room;
  const mine = room.members.find((m) => m.user_id === room.actor_id);
  const released = room.state === 'complete';
  const started = ['running', 'grading', 'complete'].includes(room.state);
  const safeSnapshot = started && includeSnapshot ? withoutSolutions(room.snapshot) : null;
  // Reading's raw JSON string can contain nested solutions; use sanitized sections instead.
  if (safeSnapshot && room.test_type === 'reading') safeSnapshot.testData.content = '';
  return {
    id: room.id,
    title: room.title,
    test_type: room.test_type,
    passage_id: room.passage_id,
    state: room.state,
    host_id: room.host_id,
    actor_id: room.actor_id,
    server_now: room.server_now,
    started_at: room.started_at,
    deadline: room.deadline,
    duration_seconds: room.duration_seconds,
    audio_durations: room.audio_durations,
    expires_at: room.expires_at,
    content_version: room.content_version,
    invite_token:
      room.state === 'lobby' && mine.user_id === room.host_id ? room.invite_token : undefined,
    audio_sources:
      room.test_type === 'listening'
        ? room.snapshot.testData.content.map((p) => p.audio_url || p.audioUrl)
        : [],
    snapshot: started && includeSnapshot ? (released ? room.snapshot : safeSnapshot) : undefined,
    members: room.members.map((m) => ({
      user_id: m.user_id,
      display_name: m.display_name,
      avatar_url: m.avatar_url || null,
      ready: m.ready,
      submitted_at: m.submitted_at,
      finish_reason: m.finish_reason,
      interrupted: m.interrupted,
      summary: released ? m.summary : undefined,
    })),
    own: {
      session_id: mine.session_id,
      answers: mine.answers,
      revision: mine.revision,
      submitted_at: mine.submitted_at,
    },
  };
}
