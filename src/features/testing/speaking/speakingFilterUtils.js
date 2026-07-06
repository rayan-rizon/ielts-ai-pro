// ---------------------------------------------------------------------------
// Speaking Filter Utilities
// ---------------------------------------------------------------------------

const TAB_MATCHERS = {
  all: () => true,
  inprogress: (latestSession) => {
    return !!latestSession && !latestSession.is_completed;
  },
  cambridge: (latestSession, test) => !!test.is_official_cambridge,
};

function matchesTab(test, latestSession, activeTab) {
  const matcher = TAB_MATCHERS[activeTab];
  if (matcher) return matcher(latestSession, test);
  return test.test_type === activeTab;
}

function matchesSearch(test, query) {
  if (!query) return true;
  return (test.title || '').toLowerCase().includes(query);
}

export function filterSpeakingTests(passages, sessions, activeTab, searchQuery) {
  const query = searchQuery.toLowerCase();
  return passages
    .filter((test) => {
      const testSession = sessions.find((s) => s.passage_id === test.id);
      const session = testSession && !testSession.is_completed ? testSession : undefined;
      return matchesTab(test, session, activeTab) && matchesSearch(test, query);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
