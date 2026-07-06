import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import ListeningHeader from '@/features/testing/listening/ListeningHeader';
import ListeningFilters from '@/features/testing/listening/ListeningFilters';
import { MemoizedTestCard } from '@/features/testing/listening/TestCard';
import { useListeningData } from '@/features/testing/listening/useListeningData';

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
// Small presentational components
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-[400px]"
        >
          <div className="flex justify-between items-start mb-6">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
          <div className="flex-grow space-y-4">
            <Skeleton className="h-7 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-24 text-center bg-transparent"
    >
      <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Headphones className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tests available</h3>
      <p className="text-slate-500 dark:text-slate-400">
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </p>
    </motion.div>
  );
}

/** Animated grid of test cards (or the empty-state fallback). */
function TestsGrid({
  activeTab,
  filteredTests,
  sessions,
  testCounts,
  questionCounts,
  durations,
  userData,
  isAdmin,
  hasMounted,
  searchQuery,
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
      >
        {filteredTests.map((test) => {
          const testSession = sessions.find((s) => s.passage_id === test.id);
          const session = testSession && !testSession.is_completed ? testSession : undefined;
          const completedSession =
            testSession && testSession.is_completed ? testSession : undefined;

          return (
            <MemoizedTestCard
              key={test.id}
              test={test}
              session={session}
              completedSession={completedSession}
              takenCount={testCounts[test.id] || 0}
              questionCount={questionCounts[test.id] || 0}
              duration={durations[test.id]}
              user={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
            />
          );
        })}

        {filteredTests.length === 0 && <EmptyState searchQuery={searchQuery} />}
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Listening() {
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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
        />

        <div className="min-h-[600px]">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            <TestsGrid
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
