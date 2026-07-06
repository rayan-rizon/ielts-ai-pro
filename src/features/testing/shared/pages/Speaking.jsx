import React, { useState, useEffect } from 'react';
import { LayoutGrid, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

import SpeakingHeader from '@/features/testing/speaking/SpeakingHeader';
import SpeakingProBanner from '@/features/testing/speaking/SpeakingProBanner';
import SpeakingFilters from '@/features/testing/speaking/SpeakingFilters';
import { SpeakingSkeletonGrid, SpeakingTestsGrid } from '@/features/testing/speaking/SpeakingGrid';
import { useSpeakingPageData } from '@/features/testing/speaking/useSpeakingPageData';
import { filterSpeakingTests } from '@/features/testing/speaking/speakingFilterUtils';

const TABS_CONFIG = [
  { id: 'all', label: 'All Tests', icon: LayoutGrid },
  { id: 'cambridge', label: 'Cambridge', icon: Award },
  { id: 'inprogress', label: 'In Progress', icon: Clock },
];

export default function Speaking() {
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
    speakingData,
    isLoading,
    isLoadingMore,
    handleLoadMore,
    passages,
    sessions,
    testCounts,
    questionCounts,
    durations,
  } = useSpeakingPageData(userData, authLoading);

  const filteredTests = filterSpeakingTests(passages, sessions, activeTab, debouncedSearchQuery);

  return (
    <div
      className="min-h-screen bg-[#FDFDFF] dark:bg-[#050505] font-sans text-slate-900 dark:text-slate-100"
      data-oid="b-dgzsd"
    >
      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4" data-oid="_:ejdhs">
        <SpeakingHeader totalPassages={passages.length} />
        <SpeakingProBanner userData={userData} />

        <SpeakingFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={TABS_CONFIG}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="min-h-[600px]" data-oid="toaita2">
          {isLoading ? (
            <SpeakingSkeletonGrid />
          ) : (
            <SpeakingTestsGrid
              filteredTests={filteredTests}
              sessions={sessions}
              testCounts={testCounts}
              questionCounts={questionCounts}
              durations={durations}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              activeTab={activeTab}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
          )}
        </div>

        {speakingData?.hasMore && (
          <div className="flex justify-center mt-12 pb-12" data-oid=".rl8k_q">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="rounded-full px-8 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold tracking-wide hover:bg-white dark:hover:bg-white/5 hover:border-rose-200 dark:hover:border-rose-900 transition-all shadow-sm"
              data-oid="m1vzfzh"
            >
              {isLoadingMore ? (
                <>
                  <div
                    className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2"
                    data-oid="4ie-gdy"
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
