import React, { memo } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { PenTool } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import WritingCardView from './WritingCardView';
import {
  buildWritingDisplayTitle,
  resolveWritingIcon,
  resolveWritingLinkConfig,
  computeWritingAccessLock,
} from './writingCardHelpers';
import {
  resolveWritingSessionState,
  getScoreFromFeedback,
  hasValidAiFeedback,
} from './writingFeedbackHelpers';
import { pickLatestSessionForTest } from './writingSessionHelpers';
import { computeWritingProgressFull } from './writingProgressHelpers';
import WritingCardListView from './WritingCardListView';
import { cn } from '@/lib/cn';
import { Empty, PANEL } from '@/features/dashboard/components/primitives';

const GRID_CLASS =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 -mx-1.5 px-1.5 -mt-1 pt-2 pb-1.5';

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
  const completedRecord = completedSession || activeSession;
  const feedbackReady =
    completedRecord?.evaluation_status === 'legacy' ||
    completedRecord?.evaluation_status === 'complete' ||
    hasValidAiFeedback(completedRecord?.content_data);

  const isLocked = computeWritingAccessLock(test, user, isAdmin);
  const progress = computeWritingProgressFull(activeSession, test);
  const displayTitle = buildWritingDisplayTitle(test);
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
    Icon,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    duration,
    wordLimit,
    session: activeSession,
    completedSessionId,
    feedbackReady,
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
    prev.latestSession?.evaluation_status === next.latestSession?.evaluation_status &&
    prev.latestSession?.evaluation_version === next.latestSession?.evaluation_version &&
    prev.latestSession?.score === next.latestSession?.score &&
    prev.latestSession?.is_completed === next.latestSession?.is_completed &&
    prev.user?.subscription_tier === next.user?.subscription_tier
  );
}

export const MemoizedWritingCard = memo(WritingTestCard, arePropsEqual);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function WritingSkeletonGrid() {
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

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function WritingEmptyState({ searchQuery }) {
  return (
    <div className={cn(PANEL, 'col-span-full p-4 sm:p-5')}>
      <Empty icon={PenTool}>
        {searchQuery ? `No tasks matching "${searchQuery}"` : "Admins haven't added any tasks yet."}
      </Empty>
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

export function WritingTestsGrid(props) {
  const {
    viewMode,
    filteredTests,
    sessions,
    userData,
    isAdmin,
    hasMounted,
    searchQuery,
    activeTab,
    testCounts = {},
    durations = {},
    wordLimits = {},
  } = props;

  const isVolumes = viewMode === 'volumes';
  const grouped = isVolumes ? groupTestsByVolume(filteredTests) : [];

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isVolumes ? (
        <m.div
          key={'writing-volumes-' + activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={GRID_CLASS}
        >
          {grouped.map((group) => (
            <WritingCardListView
              key={group.id}
              group={group}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
            />
          ))}
          {filteredTests.length === 0 && <WritingEmptyState searchQuery={searchQuery} />}
        </m.div>
      ) : (
        <m.div
          key={'writing-grid-' + activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={GRID_CLASS}
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
        </m.div>
      )}
    </AnimatePresence>
  );
}

function WritingGridOnly(props) {
  return <WritingTestsGrid {...props} viewMode="grid" />;
}
