import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  ROW_HOVER,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { BookProgressBadge, TestRowBadge, TestRowAction } from './TestCardParts';
import {
  buildLinkTarget,
  computeAccessLock,
  computeProgress,
  resolveLinkConfig,
  testNumber,
} from './helpers';

function resolveRowState(test, sessions, userData, isAdmin) {
  const testSession = sessions.find((s) => s.passage_id === test.id);
  const isCompleted = !!testSession?.is_completed;
  return {
    testSession,
    isLocked: computeAccessLock(test, userData, isAdmin),
    isCompleted,
    isResuming: !!testSession && !isCompleted,
  };
}

function GroupTestRow({ skill, test, sessions, userData, isAdmin, questionCounts }) {
  const { testSession, isLocked, isCompleted, isResuming } = resolveRowState(
    test,
    sessions,
    userData,
    isAdmin
  );
  const progress = computeProgress(testSession, test, questionCounts[test.id]);
  const num = testNumber(test) || '—';

  const linkTo = buildLinkTarget(
    {
      isResuming,
      isCompleted,
      session: isResuming ? testSession : undefined,
      completedSession: isCompleted ? testSession : undefined,
      test,
    },
    skill
  );
  const { ContainerLink, linkProps } = resolveLinkConfig(isLocked, linkTo);

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 transition-all duration-150',
        ROW_HOVER
      )}
    >
      {/* Test number reads as a numeral, matching the dashboard's number-first rule */}
      <span
        className={cn(
          WELL,
          NUM,
          'flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-extrabold text-slate-700 dark:text-slate-200'
        )}
      >
        {num}
      </span>

      <ContainerLink {...linkProps} className="block min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-800 transition-colors group-hover:text-[#5a63df] dark:text-slate-200 dark:group-hover:text-[#afb5ff]">
          Test {num}
        </span>
      </ContainerLink>

      <TestRowBadge
        isLocked={isLocked}
        isCompleted={isCompleted}
        isResuming={isResuming}
        progress={progress}
        score={testSession?.score}
      />

      <div className="flex shrink-0 items-center gap-1">
        <TestRowAction
          skill={skill}
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          testSession={testSession}
          test={test}
        />
      </div>
    </div>
  );
}

/**
 * List-view card: one Cambridge volume (or the general-practice bucket) with
 * its tests as compact rows.
 *
 * The volume number is the identity anchor here too, replacing the generic
 * award icon that was identical on every group card.
 */
export default function TestGroupCard({
  skill,
  group,
  sessions,
  userData,
  isAdmin,
  hasMounted,
  questionCounts,
}) {
  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        PANEL,
        'flex flex-col p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
      )}
    >
      <div className="mb-2.5 flex items-center gap-2.5 border-b border-[#eceafa] pb-2.5 dark:border-white/[0.07]">
        <div
          className={cn(
            WELL,
            'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md'
          )}
        >
          <span
            className={cn(
              MICRO,
              'text-[8px] font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
            )}
          >
            {group.volumeNumber ? 'VOL' : 'SET'}
          </span>
          <span
            className={cn(
              NUM,
              'mt-0.5 text-sm font-extrabold leading-none text-slate-900 dark:text-slate-50'
            )}
          >
            {group.volumeNumber || group.tests.length}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={cn(TITLE, 'truncate')}>{group.label}</h4>
          <p className={cn(MICRO, MUTED, 'truncate')}>{group.subtitle}</p>
        </div>

        <BookProgressBadge tests={group.tests} sessions={sessions} />
      </div>

      <div className="flex flex-col gap-0.5">
        {group.tests.map((test) => (
          <GroupTestRow
            key={test.id}
            skill={skill}
            test={test}
            sessions={sessions}
            userData={userData}
            isAdmin={isAdmin}
            questionCounts={questionCounts}
          />
        ))}
      </div>
    </m.div>
  );
}
