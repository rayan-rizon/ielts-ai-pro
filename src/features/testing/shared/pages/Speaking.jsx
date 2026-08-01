import React, { useState, useEffect } from 'react';
import { LayoutGrid, Award, Clock } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import DocumentHead from '@/components/shared/DocumentHead';

import SpeakingHeader from '@/features/testing/speaking/SpeakingHeader';
import { SpeakingSkeletonGrid, SpeakingTestsGrid } from '@/features/testing/speaking/SpeakingGrid';
import { useSpeakingPageData } from '@/features/testing/speaking/useSpeakingPageData';
import { filterSpeakingTests } from '@/features/testing/speaking/speakingFilterUtils';

const TABS_CONFIG = [
  { id: 'all', label: 'All Tests', icon: LayoutGrid },
  { id: 'cambridge', label: 'Cambridge', icon: Award },
  { id: 'in-progress', label: 'In Progress', icon: Clock },
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
    <>
      <DocumentHead
        title="IELTS Speaking Practice | IELTS Ai Pro"
        description="Practise IELTS Speaking responses and receive automatic AI evaluation and grammar evidence."
      />
      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-[size:20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />

        <div className="relative z-10 mx-auto max-w-[1600px] space-y-4">
          <SpeakingHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={TABS_CONFIG}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

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

          {speakingData?.hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e2e5f2] bg-white px-6 text-xs font-bold uppercase tracking-wider text-[#5a63df] transition-all hover:bg-[#5a63df]/[0.06] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#a9afff]"
              >
                {isLoadingMore ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#5a63df]/30 border-t-[#5a63df]" />
                    Loading...
                  </>
                ) : (
                  'Load More Tests'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
