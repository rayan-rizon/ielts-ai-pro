import React, { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenTool } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import WritingCardView from './WritingCardView';
import {
  buildWritingDisplayTitle,
  resolveWritingIcon,
  resolveWritingLinkConfig,
  computeWritingAccessLock,
} from './writingCardHelpers';
import { resolveWritingSessionState, getScoreFromFeedback } from './writingFeedbackHelpers';
import { pickLatestSessionForTest } from './writingSessionHelpers';
import { computeWritingProgressFull } from './writingProgressHelpers';

import { getWritingColor } from './writingColorConfig';

// ---------------------------------------------------------------------------
// TestCard — prop derivation + delegation to WritingCardView
// ---------------------------------------------------------------------------

function buildWritingCardProps({
  test,
  latestSession,
  takenCount,
  duration,
  wordLimit,
  user,
  isAdmin,
  hasMounted,
}) {
  const { activeSession, completedSession, isEffectivelyCompleted } =
    resolveWritingSessionState(latestSession);

  const isResuming = !!activeSession && !isEffectivelyCompleted;
  const isCompleted = isEffectivelyCompleted;
  const completedSessionId = (completedSession || activeSession)?.id;
  const displayScore =
    (completedSession || activeSession)?.score ??
    getScoreFromFeedback((completedSession || activeSession)?.content_data);

  const isLocked = computeWritingAccessLock(test, user, isAdmin);
  const progress = computeWritingProgressFull(activeSession, test);
  const displayTitle = buildWritingDisplayTitle(test);
  const color = getWritingColor(displayTitle || 'default');
  const Icon = resolveWritingIcon(test);
  const { ContainerLink, linkProps } = resolveWritingLinkConfig(isLocked, test);

  return {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayScore,
    displayTitle,
    color,
    Icon,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    duration,
    wordLimit,
    session: activeSession,
    completedSessionId,
  };
}

function WritingTestCard({
  test,
  latestSession,
  takenCount,
  duration,
  wordLimit,
  user,
  isAdmin,
  hasMounted,
}) {
  const props = buildWritingCardProps({
    test,
    latestSession,
    takenCount,
    duration,
    wordLimit,
    user,
    isAdmin,
    hasMounted,
  });
  return <WritingCardView {...props} />;
}

function arePropsEqual(prev, next) {
  const keys = ['takenCount', 'duration', 'wordLimit', 'isAdmin', 'hasMounted'];
  if (keys.some((k) => prev[k] !== next[k])) return false;
  return (
    prev.test.id === next.test.id &&
    prev.latestSession?.id === next.latestSession?.id &&
    prev.user?.subscription_tier === next.user?.subscription_tier
  );
}

export const MemoizedWritingCard = memo(WritingTestCard, arePropsEqual);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function WritingSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-[400px]"
          data-oid="2d804an"
        >
          <div className="flex justify-between items-start mb-6" data-oid="cn292:d">
            <Skeleton className="w-12 h-12 rounded-xl" data-oid="3rlo03b" />
            <Skeleton className="h-6 w-20 rounded-lg" data-oid="qsdqolm" />
          </div>
          <div className="flex-grow space-y-4 shadow-none" data-oid=":pzsp8x">
            <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="73k:s9g" />
            <Skeleton className="h-4 w-full rounded-lg" data-oid="qi342e." />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="jbb.5d4" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function WritingEmptyState({ searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-24 text-center bg-transparent"
      data-oid="p2zjnef"
    >
      <div
        className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
        data-oid="rc79rf2"
      >
        <PenTool className="w-10 h-10 text-slate-300 dark:text-slate-600" data-oid="8xium.d" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2" data-oid="lv_4mec">
        No tasks available
      </h3>
      <p className="text-slate-500 dark:text-slate-400" data-oid="o-_p36c">
        {searchQuery ? `No tasks matching "${searchQuery}"` : "Admins haven't added any tasks yet."}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tests grid
// ---------------------------------------------------------------------------

export function WritingTestsGrid({
  filteredTests,
  sessions,
  testCounts,
  durations,
  wordLimits,
  userData,
  isAdmin,
  hasMounted,
  activeTab,
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
        data-oid="5.erghn"
      >
        {filteredTests.map((test) => {
          const testId = String(test.id);
          const latestSession = pickLatestSessionForTest(sessions, testId);
          return (
            <MemoizedWritingCard
              key={testId}
              test={test}
              latestSession={latestSession}
              takenCount={testCounts[test.id] || 0}
              duration={durations[test.id]}
              wordLimit={wordLimits[test.id]}
              user={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
            />
          );
        })}
        {filteredTests.length === 0 && <WritingEmptyState searchQuery={searchQuery} />}
      </motion.div>
    </AnimatePresence>
  );
}
