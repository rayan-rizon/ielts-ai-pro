// ---------------------------------------------------------------------------
// Session helpers & picker
// ---------------------------------------------------------------------------

function isNewerSession(candidate, current) {
  const candidateTime = new Date(candidate.created_at || 0).getTime();
  const currentTime = new Date(current.created_at || 0).getTime();
  return candidateTime > currentTime;
}

function getSessionPassageId(s) {
  return s ? String(s.passage_id || '') : '';
}

function getSessionContentId(s) {
  return s && s.content_data ? String(s.content_data.id || '') : '';
}

export function pickLatestSessionForTest(allSessions, testId) {
  if (!Array.isArray(allSessions)) return undefined;
  if (allSessions.length === 0) return undefined;

  let latest = undefined;
  for (let i = 0; i < allSessions.length; i++) {
    const s = allSessions[i];
    const isMatch = getSessionPassageId(s) === testId || getSessionContentId(s) === testId;
    if (isMatch) {
      if (!latest || isNewerSession(s, latest)) {
        latest = s;
      }
    }
  }
  return latest;
}
