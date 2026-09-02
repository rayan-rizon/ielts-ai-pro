import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

/** Extracts a passage_id from a session row regardless of storage location. */
function getPassageId(session) {
  return session.passage_id || session.content_data?.passage_id || session.content_data?.id;
}

/** Counts answered questions from a user_responses value. */
function countResponses(userResponses) {
  if (!userResponses) return 0;
  if (Array.isArray(userResponses)) return userResponses.length;
  return Object.keys(userResponses).length;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchPassages(page, pageSize) {
  const offset = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at, duration_minutes, access_tier',
      { count: 'exact' }
    )
    .eq('test_type', 'listening')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) console.error('Error fetching passages:', error);
  return { data: data || [], totalCount: count || 0 };
}

async function fetchTakenCounts() {
  const result = await supabase.rpc('get_test_taken_counts', { type_filter: 'listening' });
  return result?.data || [];
}

async function fetchUserSessions(user, passageIds) {
  if (!user || passageIds.length === 0) return [];

  const { data, error } = await supabase
    .from('test_sessions')
    .select(
      'id, passage_id, is_completed, score, content_data, created_at, completed_at, user_responses'
    )
    .eq('user_id', user.id)
    .eq('test_type', 'listening')
    .in('passage_id', passageIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data || [];
}

/**
 * Reduces the raw sessions array into a map keyed by passage_id,
 * keeping only the most-recently-created session per passage.
 */
function buildSessionsByPassage(sessionsData) {
  const map = {};
  sessionsData.forEach((s) => {
    const pId = getPassageId(s);
    if (!pId) return;

    const isNewer = !map[pId] || new Date(s.created_at) > new Date(map[pId].created_at);
    if (!isNewer) return;

    map[pId] = {
      id: s.id,
      passage_id: pId,
      is_completed: s.is_completed,
      score: s.score,
      progress: 0,
      content_data: s.content_data || { passage_id: pId },
      user_responses: s.user_responses || {},
      completed_questions: s.is_completed ? 40 : countResponses(s.user_responses),
      created_at: s.created_at,
      completed_at: s.completed_at,
    };
  });
  return map;
}

// ---------------------------------------------------------------------------
// Merge helpers (pure)
// ---------------------------------------------------------------------------

/** Merges fresh taken-count rows into the existing map. */
function mergeTakenCounts(existing, freshRows) {
  const result = { ...existing };
  freshRows.forEach((item) => {
    if (item.passage_id) result[item.passage_id] = item.taken_count;
  });
  return result;
}

/** Builds/merges per-test question-count and duration maps. */
function mergeTestMeta(existingQCounts, existingDurs, testsData) {
  const qCounts = { ...existingQCounts };
  const durs = { ...existingDurs };
  testsData.forEach((test) => {
    qCounts[test.id] = test.total_questions || 40;
    durs[test.id] = test.duration_minutes || 30;
  });
  return { qCounts, durs };
}

/** Merges new sessions into the existing list (newest wins per passage). */
function mergeSessions(existingSessions, sessionsByPassage) {
  const newEntries = Object.values(sessionsByPassage);
  if (!existingSessions) return newEntries;
  return [...existingSessions.filter((s) => !sessionsByPassage[s.passage_id]), ...newEntries];
}

/** Merges a fresh page of passages on top of the existing list. */
function mergePassages(existingPassages, newPassages) {
  if (!existingPassages) return newPassages;
  return [...existingPassages, ...newPassages];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data required by the Listening page for a given page/pageSize.
 *
 * @param {object|null} user         - current user profile from auth context
 * @param {number}      page         - 1-based page number
 * @param {number}      pageSize
 * @param {object|null} existingData - previously loaded data (for "load more")
 */
export async function fetchListeningData(user, page = 1, pageSize = 32, existingData = null) {
  const [{ data: testsData, totalCount }, takenCountsData] = await Promise.all([
    fetchPassages(page, pageSize),
    fetchTakenCounts(),
  ]);

  const passageIds = testsData.map((t) => t.id);
  const rawSessions = await fetchUserSessions(user, passageIds);
  const sessionsByPassage = buildSessionsByPassage(rawSessions);

  const prior = existingData || {};
  const testCounts = mergeTakenCounts(prior.testCounts || {}, takenCountsData);
  const { qCounts, durs } = mergeTestMeta(
    prior.questionCounts || {},
    prior.durations || {},
    testsData
  );
  const allSessions = mergeSessions(prior.sessions, sessionsByPassage);
  const allPassages = mergePassages(prior.passages, testsData);

  return {
    passages: allPassages,
    sessions: allSessions,
    testCounts,
    questionCounts: qCounts,
    durations: durs,
    currentUser: user,
    totalCount,
    currentPage: page,
    hasMore: allPassages.length < totalCount,
  };
}
