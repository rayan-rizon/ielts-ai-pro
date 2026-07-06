import React, { useState, useEffect } from 'react';
import { LayoutGrid, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import WritingHeader from '@/features/testing/writing/WritingHeader';
import WritingFilters from '@/features/testing/writing/WritingFilters';
import { WritingSkeletonGrid, WritingTestsGrid } from '@/features/testing/writing/WritingGrid';
import { useWritingData } from '@/features/testing/writing/useWritingData';
import { filterWritingTests } from '@/features/testing/writing/writingFilterUtils';

const TABS_CONFIG = [
  { id: 'all', label: 'All Tasks', icon: LayoutGrid },
  { id: 'cambridge', label: 'Cambridge', icon: Award },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
];

export default function Writing() {
  const { userProfile: userData, isAdmin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMounted, setHasMounted] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    writingData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    passages,
    sessions,
    testCounts,
    durations,
    wordLimits,
  } = useWritingData(userData, authLoading);

  const filteredTests = filterWritingTests(passages, sessions, activeTab, debouncedSearchQuery);

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="t_qr8bg"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="r7c-88f">
        <WritingHeader totalPassages={passages.length} />

        <WritingFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={TABS_CONFIG}
        />

        <div className="min-h-[600px]" data-oid="wex:qw8">
          {isLoading ? (
            <WritingSkeletonGrid />
          ) : (
            <WritingTestsGrid
              filteredTests={filteredTests}
              sessions={sessions}
              testCounts={testCounts}
              durations={durations}
              wordLimits={wordLimits}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              activeTab={activeTab}
              searchQuery={searchQuery}
            />
          )}
        </div>

        {writingData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12" data-oid="tz6lhrv">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-orange-200 dark:hover:border-orange-900 transition-all shadow-sm"
              data-oid=":zzein4"
            >
              {isLoadingMore ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2"
                    data-oid="8tzdpys"
                  />
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
