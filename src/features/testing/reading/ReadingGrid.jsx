import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoizedTestCard } from './ReadingTestCard';
import { resolveTestSessions } from './readingCardHelpers';
import ReadingCardListView from './ReadingCardListView';
import { cn } from '@/lib/cn';
import { Empty, PANEL } from '@/features/dashboard/components/primitives';

// ---------------------------------------------------------------------------
// Layout class constants
// ---------------------------------------------------------------------------

const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';
const LIST_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';

function getTestNumber(test) {
  if (test.cambridge_test_number) return test.cambridge_test_number;
  const match = test.title.match(/Test\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function getGroupInfo(test) {
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    return {
      key: `cambridge-${bookNumber}`,
      label: `IELTS ${bookNumber}`,
      subtitle: `Official Cambridge ${test.cambridge_year}`,
      bookNumber,
    };
  }
  return {
    key: 'general',
    label: 'General Practice',
    subtitle: 'Curated IELTS exercises',
    bookNumber: 0,
  };
}

// Helper to group tests by Cambridge Book volume
function groupTestsByVolume(tests) {
  const groups = {};

  tests.forEach((test) => {
    const { key, label, subtitle } = getGroupInfo(test);
    if (!groups[key]) {
      groups[key] = { key, label, subtitle, tests: [] };
    }
    groups[key].tests.push(test);
  });

  Object.values(groups).forEach((group) => {
    group.tests.sort((a, b) => getTestNumber(a) - getTestNumber(b));
  });

  return Object.values(groups).sort((a, b) => {
    if (a.key === 'general') return 1;
    if (b.key === 'general') return -1;

    const numA = getGroupInfo(a.tests[0]).bookNumber;
    const numB = getGroupInfo(b.tests[0]).bookNumber;
    return numB - numA;
  });
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ searchQuery }) {
  return (
    <div className={cn(PANEL, 'col-span-full p-4 sm:p-5')}>
      <Empty icon={BookOpen}>
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </Empty>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function SkeletonListItem({ i }) {
  return (
    <div key={i} className={cn(PANEL, 'flex h-[210px] flex-col justify-between p-4')}>
      <div>
        <div className="mb-3 flex items-center justify-between border-b border-[#eceafa] pb-3 dark:border-white/[0.07]">
          <div className="flex flex-1 items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-3 w-2/3 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <Skeleton key={idx} className="h-8 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonGridItem({ i }) {
  return (
    <div key={i} className={cn(PANEL, 'flex h-[280px] flex-col p-4')}>
      <div className="mb-3 flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grow space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="mt-3 h-9.5 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonGrid({ viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className={LIST_CLASS}>
        {[...Array(6)].map((_, i) => (
          <SkeletonListItem key={i} i={i} />
        ))}
      </div>
    );
  }
  return (
    <div className={GRID_CLASS}>
      {[...Array(8)].map((_, i) => (
        <SkeletonGridItem key={i} i={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests grid + empty state
// ---------------------------------------------------------------------------

export function TestsGrid({
  filteredTests,
  sessions,
  testCounts,
  questionCounts,
  durations,
  userData,
  isAdmin,
  hasMounted,
  viewMode,
  searchQuery,
  activeTab,
}) {
  if (viewMode === 'list') {
    const groups = groupTestsByVolume(filteredTests);
    return (
      <AnimatePresence mode="wait">
        <m.div
          key={activeTab + '-' + viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={LIST_CLASS}
        >
          {groups.map((group) => (
            <ReadingCardListView
              key={group.key}
              group={group}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              questionCounts={questionCounts}
            />
          ))}
          {groups.length === 0 && <EmptyState searchQuery={searchQuery} />}
        </m.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={activeTab + '-' + viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={GRID_CLASS}
      >
        {filteredTests.map((test) => {
          const { session, completedSession } = resolveTestSessions(
            sessions.find((s) => s.passage_id === test.id)
          );
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
              viewMode={viewMode}
            />
          );
        })}
        {filteredTests.length === 0 && <EmptyState searchQuery={searchQuery} />}
      </m.div>
    </AnimatePresence>
  );
}
