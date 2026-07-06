import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import ListeningHeader from '@/features/testing/listening/ListeningHeader';
import ListeningFilters from '@/features/testing/listening/ListeningFilters';
import { useListeningData } from '@/features/testing/listening/useListeningData';
import {
  ListeningSkeletonGrid,
  ListeningTestsGrid,
} from '@/features/testing/listening/ListeningGrid';

// ---------------------------------------------------------------------------
// Tab-matching logic (pure, module-level)
// ---------------------------------------------------------------------------

/**
 * Strategy map: each entry is a predicate (test, sessions) => boolean.
 * Tabs not listed here fall back to the generic type/format comparison.
 */
const TAB_MATCHERS = {
  all: () => true,
  'in-progress': (test, sessions) =>
    sessions.some((s) => s.passage_id === test.id && !s.is_completed),
  cambridge: (test) => !!test.is_official_cambridge,
};

/** Returns true when `test` belongs to the currently selected tab. */
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

/** Filters and sorts the passage list for the current UI state. */
function filterTests(passages, sessions, activeTab, searchQuery) {
  const query = searchQuery.toLowerCase();
  return passages
    .filter((test) => {
      if (!matchesTab(test, sessions, activeTab)) return false;
      if (!query) return true;
      return (
        (test.title || '').toLowerCase().includes(query) ||
        (test.description || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Listening() {
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [hasMounted, setHasMounted] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    listeningData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    passages,
    sessions,
    testCounts,
    questionCounts,
    durations,
  } = useListeningData(userData, authLoading);

  const filteredTests = filterTests(passages, sessions, activeTab, debouncedSearchQuery);

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100">
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
        <ListeningHeader totalPassages={passages.length} />

        <ListeningFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="min-h-[600px]">
          {isLoading ? (
            <ListeningSkeletonGrid />
          ) : (
            <ListeningTestsGrid
              activeTab={activeTab}
              filteredTests={filteredTests}
              sessions={sessions}
              testCounts={testCounts}
              questionCounts={questionCounts}
              durations={durations}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
          )}
        </div>

        {listeningData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-purple-200 dark:hover:border-purple-900 transition-all shadow-sm"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More Tests'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
