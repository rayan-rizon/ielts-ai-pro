import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Award } from 'lucide-react';
import { computeSpeakingAccessLock, resolveSpeakingLinkConfig } from './speakingCardHelpers';
import { BookProgressBadge, TestRowBadge, TestRowAction } from './SpeakingCardComponents';
import { IconChip, MUTED, PANEL, TILE, TITLE } from '@/features/dashboard/components/primitives';

function getTestName(test) {
  const num = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
  return `Test ${num}`;
}

function resolveTestState(test, sessions, userData, isAdmin) {
  const testSession = sessions.find((s) => s.passage_id === test.id);
  const isLocked = computeSpeakingAccessLock(test, userData, isAdmin);
  const isCompleted = !!testSession?.is_completed;
  const isResuming = !!testSession && !isCompleted;
  return { testSession, isLocked, isCompleted, isResuming };
}

function BookTestRow({ test, sessions, userData, isAdmin }) {
  const { testSession, isLocked, isCompleted, isResuming } = resolveTestState(
    test,
    sessions,
    userData,
    isAdmin
  );
  const testName = getTestName(test);

  const { ContainerLink, linkProps } = resolveSpeakingLinkConfig(isLocked, test);

  return (
    <div
      className={cn(
        TILE,
        'flex items-center justify-between px-2.5 py-1.5 transition-all duration-150'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <ContainerLink {...linkProps} className="block min-w-0">
          <span className="block truncate text-xs font-bold text-slate-800 transition-colors hover:text-[#5a63df] dark:text-slate-200">
            {testName}
          </span>
        </ContainerLink>

        <TestRowBadge
          isLocked={isLocked}
          isCompleted={isCompleted}
          isResuming={isResuming}
          score={testSession?.score}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <TestRowAction
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

export default function SpeakingCardListView({ group, sessions, userData, isAdmin, hasMounted }) {
  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        PANEL,
        'flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#eceafa] pb-3 dark:border-white/[0.07]">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={Award} tone="accent" size="md" />
          <div className="min-w-0">
            <h4 className={cn(TITLE, 'truncate text-sm')}>{group.label}</h4>
            <p className={cn('truncate text-xs font-semibold', MUTED)}>{group.subtitle}</p>
          </div>
        </div>
        <BookProgressBadge tests={group.tests} sessions={sessions} />
      </div>

      <div className="flex flex-col gap-1.5">
        {group.tests.map((test) => (
          <BookTestRow
            key={test.id}
            test={test}
            sessions={sessions}
            userData={userData}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </m.div>
  );
}
