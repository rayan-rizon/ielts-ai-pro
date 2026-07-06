import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoizedTestCard } from './ReadingTestCard';
import { resolveTestSessions } from './readingCardHelpers';

// ---------------------------------------------------------------------------
// Layout class constants
// ---------------------------------------------------------------------------

const GRID_CLASS =
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8';
const LIST_CLASS = 'flex flex-col gap-4';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ searchQuery }) {
  return (
    <div className="col-span-full py-24 text-center bg-transparent" data-oid="4h-agyx">
      <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tests available</h3>
      <p className="text-slate-500 dark:text-slate-400">
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function SkeletonListItem({ i }) {
  return (
    <div
      key={i}
      className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200/60 dark:border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-[92px] animate-pulse"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonGridItem({ i }) {
  return (
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
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={activeTab + '-' + viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={viewMode === 'list' ? LIST_CLASS : GRID_CLASS}
        data-oid="35fc5ra"
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
