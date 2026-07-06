// ---------------------------------------------------------------------------
// Tab-matching strategy map — avoids long if/else chains in filter fn
// ---------------------------------------------------------------------------

const TAB_MATCHERS = {
  all: () => true,
  'in-progress': (test, sessions) =>
    sessions.some((s) => s.passage_id === test.id && !s.is_completed),
  cambridge: (test) => !!test.is_official_cambridge,
  academic: (test) => test.test_format?.toLowerCase() === 'academic',
};

function matchesTab(test, sessions, activeTab) {
  const matcher = TAB_MATCHERS[activeTab];
  if (matcher) return matcher(test, sessions);
  const tab = activeTab.toLowerCase();
  return (
    test.test_type?.toLowerCase() === tab ||
    test.type?.toLowerCase() === tab ||
    test.test_format?.toLowerCase() === tab
  );
}

function matchesSearch(test, query) {
  if (!query) return true;
  return (
    (test.title || '').toLowerCase().includes(query) ||
    (test.description || '').toLowerCase().includes(query)
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function filterReadingTests(passages, sessions, activeTab, searchQuery) {
  const query = searchQuery.toLowerCase();
  return passages
    .filter((test) => matchesTab(test, sessions, activeTab) && matchesSearch(test, query))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
