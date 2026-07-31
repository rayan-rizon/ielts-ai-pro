import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoizedTestCard } from './TestCard';
import ListeningCardListView from './ListeningCardListView';
import { cn } from '@/lib/cn';
import { Empty, PANEL } from '@/features/dashboard/components/primitives';

const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3';

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

function SkeletonGridItem({ i }) {
  return (
    <div key={i} className={cn(PANEL, 'flex h-[280px] flex-col p-4')}>
      <div className="mb-3 flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex-grow space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="mt-3 h-10 w-full rounded-lg" />
    </div>
  );
}

export function ListeningSkeletonGrid() {
  return (
    <div className={GRID_CLASS}>
      {[...Array(8)].map((_, i) => (
        <SkeletonGridItem key={i} i={i} />
      ))}
    </div>
  );
}

function ListeningEmptyState({ searchQuery }) {
  return (
    <div className={cn(PANEL, 'col-span-full p-4 sm:p-5')}>
      <Empty icon={Headphones}>
        {searchQuery ? `No tests matching "${searchQuery}"` : "Admins haven't added any tests yet."}
      </Empty>
    </div>
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
      <m.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={GRID_CLASS}
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
      </m.div>
    </AnimatePresence>
  );
}

export function ListeningTestsGrid(props) {
  const { viewMode, filteredTests, sessions, userData, isAdmin, hasMounted, searchQuery } = props;

  if (viewMode === 'volumes') {
    const grouped = groupTestsByVolume(filteredTests);
    return (
      <AnimatePresence mode="wait">
        <m.div
          key={props.activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={GRID_CLASS}
        >
          {grouped.map((group) => (
            <ListeningCardListView
              key={group.id}
              group={group}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              hasMounted={hasMounted}
              questionCounts={props.questionCounts}
            />
          ))}
          {filteredTests.length === 0 && <ListeningEmptyState searchQuery={searchQuery} />}
        </m.div>
      </AnimatePresence>
    );
  }

  return <ListeningGridOnly {...props} />;
}
