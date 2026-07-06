import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Award } from 'lucide-react';
import { colorVariants } from './writingColorConfig';
import { computeWritingAccessLock, resolveWritingLinkConfig } from './writingCardHelpers';
import { BookProgressBadge, TestRowBadge, TestRowAction } from './WritingCardComponents';

function getTestName(test) {
  const num = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
  return `Test ${num}`;
}

function resolveTestState(test, sessions, userData, isAdmin) {
  const testSession = sessions.find((s) => s.passage_id === test.id);
  const isLocked = computeWritingAccessLock(test, userData, isAdmin);
  const isCompleted = !!testSession?.is_completed;
  const isResuming = !!testSession && !isCompleted;
  return { testSession, isLocked, isCompleted, isResuming };
}

function BookTestRow({ test, sessions, userData, isAdmin, color }) {
  const { testSession, isLocked, isCompleted, isResuming } = resolveTestState(
    test,
    sessions,
    userData,
    isAdmin
  );
  const testName = getTestName(test);

  const { ContainerLink, linkProps } = resolveWritingLinkConfig(isLocked, test);

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50/50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100/50 dark:hover:border-white/5 transition-all duration-200">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <ContainerLink {...linkProps} className="block group/title min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-500 transition-colors truncate block">
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

      <div className="flex items-center gap-1.5 shrink-0">
        <TestRowAction
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          testSession={testSession}
          test={test}
          color={color}
        />
      </div>
    </div>
  );
}

export default function WritingCardListView({
  group,
  sessions,
  userData,
  isAdmin,
  hasMounted,
  color,
}) {
  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col bg-gradient-to-br border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300/80 dark:hover:border-white/20 hover:-translate-y-1 transition-all duration-300 ease-out',
        colorVariants[color].gradient
      )}
    >
      <div>
        {/* Book Card Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center border bg-white dark:bg-white/5 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300',
                colorVariants[color].text,
                colorVariants[color].border
              )}
            >
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                {group.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                {group.subtitle}
              </p>
            </div>
          </div>
          <div>
            <BookProgressBadge tests={group.tests} sessions={sessions} />
          </div>
        </div>

        {/* List of Tests */}
        <div className="flex flex-col gap-1.5">
          {group.tests.map((test) => (
            <BookTestRow
              key={test.id}
              test={test}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              color={color}
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}
