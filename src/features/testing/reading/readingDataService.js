import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Supabase query helpers
// ---------------------------------------------------------------------------

async function fetchPassages(page, pageSize) {
  const offset = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from('passages')
    .select(
      'id, title, is_official_cambridge, cambridge_year, cambridge_test_number, test_type, test_format, is_active, total_questions, created_at',
      { count: 'exact' }
    )
    .eq('test_type', 'reading')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) console.error('Error fetching reading passages:', error);
  return { data: data || [], totalCount: count || 0 };
}

async function fetchUserSessions(user, passageIds) {
  if (!user || passageIds.length === 0) return [];
  const { data } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('test_type', 'reading')
    .in('passage_id', passageIds)
    .order('created_at', { ascending: false });
  return data || [];
}

async function fetchTakenCounts() {
  const { data } = await supabase.rpc('get_test_taken_counts', { type_filter: 'reading' });
  return data || [];
}

// ---------------------------------------------------------------------------
// Session normalisation
// ---------------------------------------------------------------------------

function countResponses(userResponses) {
  return userResponses ? Object.keys(userResponses).length : 0;
}

/** Computes the progress percentage for a raw session row. */
function computeSessionProgress(s) {
  if (s.progress_percentage) return s.progress_percentage;
  if (!s.user_responses) return 0;
  const total = s.content_data?.total_questions || 40;
  return Math.round((Object.keys(s.user_responses).length / total) * 100);
}

/** Normalises a raw DB session row into the shape the UI expects. */
function normaliseSession(s) {
  const pId = s.passage_id;
  return {
    id: s.id,
    passage_id: pId,
    is_completed: s.is_completed,
    score: s.score,
    progress: computeSessionProgress(s),
    content_data: s.content_data || { passage_id: pId },
    user_responses: s.user_responses || {},
    completed_questions: s.is_completed ? 40 : countResponses(s.user_responses),
    created_at: s.created_at,
    completed_at: s.completed_at,
  };
}

/** Picks the latest session per passage and normalises its shape. */
function buildSessionsByPassage(sessionsData) {
  const sorted = [...sessionsData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const map = {};
  sorted.forEach((s) => {
    if (!s.passage_id || map[s.passage_id]) return;
    map[s.passage_id] = normaliseSession(s);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Merge helpers (pure)
// ---------------------------------------------------------------------------

function mergeTakenCounts(existing, freshRows) {
  const result = { ...existing };
  freshRows.forEach((item) => {
    if (item.passage_id) result[item.passage_id] = item.taken_count;
  });
  return result;
}

function mergeTestMeta(existingQCounts, existingDurs, testsData) {
  const qCounts = { ...existingQCounts };
  const durs = { ...existingDurs };
  testsData.forEach((test) => {
    qCounts[test.id] = test.total_questions || 40;
    durs[test.id] = 60; // IELTS reading standard
  });
  return { qCounts, durs };
}

function mergePassages(existingPassages, newPassages) {
  if (!existingPassages) return newPassages;
  return [...existingPassages, ...newPassages];
}

function mergeSessions(existingSessions, sessionsByPassage) {
  const newEntries = Object.values(sessionsByPassage);
  if (!existingSessions) return newEntries;
  return [...existingSessions.filter((s) => !sessionsByPassage[s.passage_id]), ...newEntries];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data required by the Reading page for a given page/pageSize.
 * Returns a merged snapshot that can be passed back as `existingData` for
 * subsequent "load more" calls.
 */
export async function fetchReadingData(user, page = 1, pageSize = 32, existingData = null) {
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
