import React, { memo } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Mic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SpeakingCardView from './SpeakingCardView';
import SpeakingCardListView from './SpeakingCardListView';
import { cn } from '@/lib/cn';
import { Empty, PANEL } from '@/features/dashboard/components/primitives';

import {
  buildSpeakingDisplayTitle,
  resolveSpeakingIcon,
  resolveSpeakingLinkConfig,
  computeSpeakingAccessLock,
} from './speakingCardHelpers';

const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';

// ---------------------------------------------------------------------------
// Pure prop-builder (extracted from render to lower CC in grid)
// ---------------------------------------------------------------------------

export function computeSpeakingProgress(latestSession, test, questionCount) {
  const isResuming = !!latestSession && !latestSession.is_completed;
  if (!isResuming) return 0;
  const currentPart = Math.min(
    Math.max(Number(latestSession.content_data?.currentPart) || 1, 1),
    3
  );
  const total = test.total_questions || questionCount || 3;
  if (latestSession.content_data?.speakingVersion === 'v2') {
    const currentQuestionIndex = Math.max(
      0,
      Number(latestSession.answers?.currentQuestionIndex) || 0
    );
    const currentQuestionCount = Number(latestSession.content_data?.speakingV2State?.questionCount);
    const withinPart =
      currentQuestionCount > 0
        ? Math.min((currentQuestionIndex + 1) / currentQuestionCount, 0.99)
        : 0.5;
    return Math.min(99, Math.round(((currentPart - 1 + withinPart) / 3) * 100));
  }
  const legacyProgress = Math.round((currentPart / total) * 100);
  // A resumable legacy snapshot only tracks the part number. Treat its final
  // part as in progress instead of visually claiming the test is finished.
  return legacyProgress >= 100 ? 83 : legacyProgress;
}

function buildSpeakingCardProps({
  test,
  latestSession,
  takenCount,
  duration,
  questionCount,
  user,
  isAdmin,
  hasMounted,
}) {
  const isResuming = !!latestSession && !latestSession.is_completed;
  const isCompleted = !!latestSession && latestSession.is_completed;
  const isLocked = computeSpeakingAccessLock(test, user, isAdmin);
  const progress = computeSpeakingProgress(latestSession, test, questionCount);
  const displayTitle = buildSpeakingDisplayTitle(test);
  const Icon = resolveSpeakingIcon(test);
  const activeSession = isResuming ? latestSession : undefined;
  const completedSession = isCompleted ? latestSession : undefined;
  const { ContainerLink, linkProps } = resolveSpeakingLinkConfig(
    isLocked,
    test,
    activeSession,
    completedSession
  );

  return {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayScore: latestSession?.score,
    displayTitle,
    Icon,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    duration,
    questionCount,
    completedSessionId: isCompleted ? latestSession.id : undefined,
  };
}

// ---------------------------------------------------------------------------
// TestCard — memoized wrapper
// ---------------------------------------------------------------------------

const TestCard = memo(function TestCard({
  test,
  latestSession,
  takenCount,
  duration,
  questionCount,
  user,
  isAdmin,
  hasMounted,
}) {
  const cardProps = buildSpeakingCardProps({
    test,
    latestSession,
    takenCount,
    duration,
    questionCount,
    user,
    isAdmin,
    hasMounted,
  });
  return <SpeakingCardView {...cardProps} />;
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function SpeakingEmptyState({ searchQuery }) {
  return (
    <div className={cn(PANEL, 'col-span-full p-4 sm:p-5')}>
      <Empty icon={Mic}>
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </Empty>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton grid
// ---------------------------------------------------------------------------

export function SpeakingSkeletonGrid() {
  return (
    <div className={GRID_CLASS}>
      {[...Array(8)].map((_, i) => (
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
          <Skeleton className="mt-3 h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function getTestNumber(test) {
  return test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || 1;
}

function getGroupInfo(t) {
  if (t.is_official_cambridge && t.cambridge_year) {
    const volNum = t.cambridge_year - 2005;
    return {
      key: `cambridge-${volNum}`,
      label: `IELTS ${volNum}`,
      subtitle: `${t.cambridge_year} Official Tests`,
      year: t.cambridge_year,
      volumeNumber: volNum,
      isOfficial: true,
    };
  }
  return {
    key: 'general',
    label: 'General Practice',
    subtitle: 'Extra Practice Tests',
    year: 0,
    volumeNumber: 0,
    isOfficial: false,
  };
}

function groupTestsByVolume(tests) {
  const groups = {};
  tests.forEach((t) => {
    const info = getGroupInfo(t);
    if (!groups[info.key]) {
      groups[info.key] = {
        id: info.key,
        label: info.label,
        subtitle: info.subtitle,
        year: info.year,
        volumeNumber: info.volumeNumber,
        tests: [],
        isOfficial: info.isOfficial,
      };
    }
    groups[info.key].tests.push(t);
  });

  Object.values(groups).forEach((g) => {
    g.tests.sort((a, b) => getTestNumber(a) - getTestNumber(b));
  });

  return Object.values(groups).sort((a, b) => {
    if (a.id === 'general') return 1;
    if (b.id === 'general') return -1;
    return b.volumeNumber - a.volumeNumber;
  });
}

export function SpeakingTestsGrid({
  filteredTests,
  sessions,
  testCounts,
  durations,
  questionCounts,
  userData,
  isAdmin,
  hasMounted,
  activeTab,
  searchQuery,
  viewMode,
}) {
  if (viewMode === 'volumes') {
    const grouped = groupTestsByVolume(filteredTests);
    return (
      <AnimatePresence>
        <m.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={GRID_CLASS}
        >
          {grouped.map((group) => (
            <SpeakingCardListView
              key={group.id}
              group={group}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
            />
          ))}
          {filteredTests.length === 0 && <SpeakingEmptyState searchQuery={searchQuery} />}
        </m.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <m.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={GRID_CLASS}
      >
        {filteredTests.map((test) => {
          const latestSession = sessions.find((s) => s.passage_id === test.id);
          return (
            <TestCard
              key={test.id}
              test={test}
              latestSession={latestSession}
              takenCount={testCounts[test.id] || 0}
              duration={durations[test.id]}
              questionCount={questionCounts[test.id]}
              user={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
            />
          );
        })}
        {filteredTests.length === 0 && <SpeakingEmptyState searchQuery={searchQuery} />}
      </m.div>
    </AnimatePresence>
  );
}
