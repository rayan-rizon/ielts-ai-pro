import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import ReadingHeader from '@/features/testing/reading/ReadingHeader';
import { SkeletonGrid, TestsGrid } from '@/features/testing/reading/ReadingGrid';
import { useReadingData } from '@/features/testing/reading/useReadingData';
import { filterReadingTests } from '@/features/testing/reading/readingFilterUtils';

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
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="wm8:xgq"
    >
      <div
        className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-2 sm:pt-3 pb-6 space-y-4"
        data-oid="f56k7km"
      >
        <ReadingHeader
          totalPassages={passages.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="min-h-[600px]" data-oid="e0wud_g">
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

          {!isLoading && readingData?.hasMore && (
            <div className="flex justify-center mt-12" data-oid="zv16_e_">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="px-8 py-3 rounded-2xl border-2 border-blue-500/20 bg-white/80 dark:bg-white/5 backdrop-blur-xl text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-xs hover:bg-blue-500/10 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/5"
                data-oid="y.p0nr8"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Load More Tests <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          )}

          {!isLoading && readingData?.totalCount > 0 && (
            <p className="text-center text-xs text-slate-400 mt-4" data-oid="74nc1:d">
              Showing {filteredTests.length} of {readingData.totalCount} tests
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
