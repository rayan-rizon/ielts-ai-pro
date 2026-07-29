import React, { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SpeakingCardView from './SpeakingCardView';
import { getSpeakingColor } from './speakingColorConfig';
import SpeakingCardListView from './SpeakingCardListView';

const COLOR_KEYS = ['rose', 'orange', 'blue', 'indigo', 'violet', 'cyan'];

import {
  buildSpeakingDisplayTitle,
  resolveSpeakingIcon,
  resolveSpeakingLinkConfig,
  computeSpeakingAccessLock,
} from './speakingCardHelpers';

// ---------------------------------------------------------------------------
// Pure prop-builder (extracted from render to lower CC in grid)
// ---------------------------------------------------------------------------

function computeSpeakingProgress(latestSession, test, questionCount) {
  const isResuming = !!latestSession && !latestSession.is_completed;
  if (!isResuming) return 0;
  const currentPart = latestSession.content_data?.currentPart || 0;
  const total = test.total_questions || questionCount || 3;
  return Math.round((currentPart / total) * 100);
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
  const color = getSpeakingColor(displayTitle || 'default');
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
    color,
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-24 text-center bg-transparent"
      data-oid="4yqk4q6"
    >
      <div
        className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6"
        data-oid="45-2:h5"
      >
        <Mic className="w-10 h-10 text-slate-300 dark:text-slate-600" data-oid="8x2:p.1" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2" data-oid="t5l_0n_">
        No speaking tests available
      </h3>
      <p className="text-slate-500 dark:text-slate-400" data-oid="6e2r-_z">
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton grid
// ---------------------------------------------------------------------------

export function SpeakingSkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6"
      data-oid="650soz."
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col h-[400px]"
          data-oid="100:8ew"
        >
          <div className="flex justify-between items-start mb-6" data-oid="ks1ujq2">
            <Skeleton className="w-12 h-12 rounded-xl" data-oid="w368d.-" />
            <Skeleton className="h-6 w-20 rounded-lg" data-oid="rzg-50d" />
          </div>
          <div className="flex-grow space-y-4" data-oid="h96l49a">
            <Skeleton className="h-7 w-3/4 rounded-lg" data-oid="mf0m1uf" />
            <Skeleton className="h-4 w-full rounded-lg" data-oid="gjscu8z" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-6" data-oid="o51t76q" />
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        >
          {grouped.map((group, index) => {
            const color = COLOR_KEYS[index % COLOR_KEYS.length];
            return (
              <SpeakingCardListView
                key={group.id}
                group={group}
                sessions={sessions}
                userData={userData}
                isAdmin={isAdmin}
                hasMounted={hasMounted}
                color={color}
              />
            );
          })}
          {filteredTests.length === 0 && <SpeakingEmptyState searchQuery={searchQuery} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6"
        data-oid="f:qit:j"
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
      </motion.div>
    </AnimatePresence>
  );
}
