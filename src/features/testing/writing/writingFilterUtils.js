import { pickLatestSessionForTest } from './writingSessionHelpers';
import { resolveWritingSessionState } from './writingFeedbackHelpers';

// Tab matcher strategy mapping
const TAB_MATCHERS = {
  all: () => true,
  'in-progress': (latestSession) => {
    const { activeSession, isEffectivelyCompleted } = resolveWritingSessionState(latestSession);
    return !!activeSession && !isEffectivelyCompleted;
  },
  cambridge: (latestSession, test) => !!test.is_official_cambridge,
};

function matchesTab(test, latestSession, activeTab) {
  const matcher = TAB_MATCHERS[activeTab];
  if (matcher) return matcher(latestSession, test);
  return test.test_type?.toLowerCase() === activeTab.toLowerCase();
}

function matchesSearch(test, query) {
  if (!query) return true;
  return (test.title || '').toLowerCase().includes(query);
}

export function filterWritingTests(passages, sessions, activeTab, searchQuery) {
  const query = searchQuery.toLowerCase();
  return passages
    .filter((test) => {
      const testId = String(test.id);
      const latestSession = pickLatestSessionForTest(sessions, testId);
      return matchesTab(test, latestSession, activeTab) && matchesSearch(test, query);
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
