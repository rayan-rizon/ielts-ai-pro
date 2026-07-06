import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Award } from 'lucide-react';
import { colorVariants } from './readingColorConfig';
import {
  computeReadingAccessLock,
  computeReadingProgress,
  buildReadingLinkTarget,
  resolveReadingLinkConfig,
} from './readingCardHelpers';
import { BookProgressBadge, TestRowBadge, TestRowAction } from './ReadingCardComponents';

function getTestName(test) {
  const num = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
  return `Test ${num}`;
}

function resolveTestState(test, sessions, userData, isAdmin) {
  const testSession = sessions.find((s) => s.passage_id === test.id);
  const isLocked = computeReadingAccessLock(test, userData, isAdmin);
  const isCompleted = !!testSession?.is_completed;
  const isResuming = !!testSession && !isCompleted;
  return { testSession, isLocked, isCompleted, isResuming };
}

function BookTestRow({ test, sessions, userData, isAdmin, questionCounts, color }) {
  const { testSession, isLocked, isCompleted, isResuming } = resolveTestState(
    test,
    sessions,
    userData,
    isAdmin
  );
  const progress = computeReadingProgress(testSession, test, questionCounts[test.id] || 40);
  const testName = getTestName(test);

  const linkTo = buildReadingLinkTarget({
    isResuming,
    isCompleted,
    session: isResuming ? testSession : undefined,
    completedSession: isCompleted ? testSession : undefined,
    test,
  });
  const { ContainerLink, linkProps } = resolveReadingLinkConfig(isLocked, linkTo);

  return (
    <div
      className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50/50 dark:hover:bg-white/5 border border-transparent hover:border-slate-100/50 dark:hover:border-white/5 transition-all duration-200"
      data-oid={`test-row-${test.id}`}
    >
      <div
        className="flex items-center gap-2.5 min-w-0 flex-1"
        data-oid={`test-row-info-${test.id}`}
      >
        <ContainerLink
          {...linkProps}
          className="block group/title min-w-0"
          data-oid={`test-row-link-${test.id}`}
        >
          <span
            className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-500 transition-colors truncate block"
            data-oid={`test-row-name-${test.id}`}
          >
            {testName}
          </span>
        </ContainerLink>

        <TestRowBadge
          isLocked={isLocked}
          isCompleted={isCompleted}
          isResuming={isResuming}
          progress={progress}
          score={testSession?.score}
        />
      </div>

      <div className="flex items-center gap-1.5 shrink-0" data-oid={`test-row-actions-${test.id}`}>
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

export default function ReadingCardListView({
  group,
  sessions,
  userData,
  isAdmin,
  hasMounted,
  questionCounts,
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
      data-oid="grouped-book-card"
    >
      <div>
        {/* Book Card Header */}
        <div
          className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200/50 dark:border-white/5"
          data-oid="book-card-header"
        >
          <div className="flex items-center gap-2.5 min-w-0" data-oid="book-card-header-left">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center border bg-white dark:bg-white/5 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300',
                colorVariants[color].text,
                colorVariants[color].border
              )}
              data-oid="book-card-icon-wrap"
            >
              <Award className="w-5 h-5" data-oid="book-card-award-icon" />
            </div>
            <div className="min-w-0" data-oid="book-card-title-wrap">
              <h4
                className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight truncate"
                data-oid="book-card-title"
              >
                {group.label}
              </h4>
              <p
                className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate"
                data-oid="book-card-subtitle"
              >
                {group.subtitle}
              </p>
            </div>
          </div>
          <div data-oid="book-card-progress-wrap">
            <BookProgressBadge tests={group.tests} sessions={sessions} />
          </div>
        </div>

        {/* List of Tests */}
        <div className="flex flex-col gap-1.5" data-oid="book-card-tests-list">
          {group.tests.map((test) => (
            <BookTestRow
              key={test.id}
              test={test}
              sessions={sessions}
              userData={userData}
              isAdmin={isAdmin}
              questionCounts={questionCounts}
              color={color}
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}
