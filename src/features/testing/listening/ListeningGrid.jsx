import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoizedTestCard } from './TestCard';
import ListeningCardListView from './ListeningCardListView';
import { COLOR_KEYS } from './colorConfig';

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

export function ListeningSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
      {[...Array(8)].map((_, i) => (
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
      ))}
    </div>
  );
}

function ListeningEmptyState({ searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full py-24 text-center bg-transparent"
    >
      <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <Headphones className="w-10 h-10 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tests available</h3>
      <p className="text-slate-500 dark:text-slate-400">
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </p>
    </motion.div>
  );
}

function ListeningGridOnly({
  activeTab,
  filteredTests,
  sessions,
  testCounts,
  questionCounts,
  durations,
  userData,
  isAdmin,
  hasMounted,
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-6"
      >
        {filteredTests.map((test) => {
          const testSession = sessions.find((s) => s.passage_id === test.id);
          const session = testSession && !testSession.is_completed ? testSession : undefined;
          const completedSession =
            testSession && testSession.is_completed ? testSession : undefined;

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
            />
          );
        })}
        {filteredTests.length === 0 && <ListeningEmptyState searchQuery={searchQuery} />}
      </motion.div>
    </AnimatePresence>
  );
}

export function ListeningTestsGrid(props) {
  const { viewMode, filteredTests, sessions, userData, isAdmin, hasMounted, searchQuery } = props;

  if (viewMode === 'volumes') {
    const grouped = groupTestsByVolume(filteredTests);
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={props.activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
        >
          {grouped.map((group, index) => {
            const color = COLOR_KEYS[index % COLOR_KEYS.length];
            return (
              <ListeningCardListView
                key={group.id}
                group={group}
                sessions={sessions}
                userData={userData}
                isAdmin={isAdmin}
                hasMounted={hasMounted}
                questionCounts={props.questionCounts}
                color={color}
              />
            );
          })}
          {filteredTests.length === 0 && <ListeningEmptyState searchQuery={searchQuery} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return <ListeningGridOnly {...props} />;
}
