import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import ReadingHeader from '@/features/testing/reading/ReadingHeader';
import { SkeletonGrid, TestsGrid } from '@/features/testing/reading/ReadingGrid';
import { useReadingData } from '@/features/testing/reading/useReadingData';
import { filterReadingTests } from '@/features/testing/reading/readingFilterUtils';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import PairedPracticeSpotlight from '@/features/testing/paired/PairedPracticeSpotlight';

export default function Reading() {
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    readingData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    passages,
    sessions,
    testCounts,
    questionCounts,
    durations,
  } = useReadingData(userData, authLoading);

  const filteredTests = filterReadingTests(passages, sessions, activeTab, debouncedSearchQuery);

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto max-w-[1600px] space-y-4">
        <ReadingHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <PairedPracticeSpotlight type="reading" />

        <div id="available-tests" className="scroll-mt-4">
          {isLoading ? (
            <SkeletonGrid viewMode={viewMode} />
          ) : (
            <TestsGrid
              filteredTests={filteredTests}
              sessions={sessions}
              testCounts={testCounts}
              questionCounts={questionCounts}
              durations={durations}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              viewMode={viewMode}
              searchQuery={searchQuery}
              activeTab={activeTab}
            />
          )}
        </div>

        {!isLoading && readingData?.hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5f2] bg-white px-6 text-xs font-bold uppercase tracking-wider text-[#5a63df] transition-all hover:bg-[#5a63df]/6 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/4 dark:text-[#a9afff]"
            >
              {isLoadingMore ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#5a63df]/30 border-t-[#5a63df]" />
                  Loading...
                </>
              ) : (
                <>
                  Load More Tests <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {!isLoading && readingData?.totalCount > 0 && (
          <p className={cn(MICRO, MUTED, 'pt-1 text-center')}>
            Showing {filteredTests.length} of {readingData.totalCount} tests
          </p>
        )}
      </div>
    </main>
  );
}
