import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { BookOpen, Clock, Users } from 'lucide-react';
import { colorVariants } from './readingColorConfig';
import { ListStatusBadge, ListScoreProgress, ListActions } from './ReadingCardComponents';

// ---------------------------------------------------------------------------
// List-view card for Reading tests
// ---------------------------------------------------------------------------

function ListCardLeft({
  color,
  isLocked,
  isResuming,
  isCompleted,
  displayTitle,
  test,
  ContainerLink,
  linkProps,
}) {
  return (
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border bg-white dark:bg-white/5 shrink-0',
          colorVariants[color].text,
          colorVariants[color].border,
          'group-hover:scale-105'
        )}
      >
        <BookOpen className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
          <ContainerLink {...linkProps} className="block group/title max-w-full">
            <h3
              className={cn(
                'text-base font-bold text-slate-900 dark:text-white leading-snug cursor-pointer line-clamp-1 hover:text-blue-500 transition-colors',
                `group-hover:${colorVariants[color].text.split(' ')[0]}`
              )}
            >
              {displayTitle}
            </h3>
          </ContainerLink>
          <ListStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
            color={color}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
          {test.description || 'Authentic IELTS Reading practice with curated passages.'}
        </p>
      </div>
    </div>
  );
}

function ListCardRight({
  duration,
  questionCount,
  takenCount,
  isCompleted,
  isResuming,
  completedSession,
  progress,
  color,
  isLocked,
  test,
  session,
}) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 justify-between sm:justify-end w-full sm:w-auto shrink-0">
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {duration}m
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          {questionCount} Qs
        </span>
        {takenCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {takenCount} Taken
          </span>
        )}
      </div>

      <ListScoreProgress
        isCompleted={isCompleted}
        isResuming={isResuming}
        completedSession={completedSession}
        progress={progress}
        color={color}
      />

      <div className="flex items-center gap-2 min-w-[130px] justify-end">
        <ListActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
          color={color}
        />
      </div>
    </div>
  );
}

export default function ReadingCardListView(props) {
  const {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayTitle,
    color,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    questionCount,
    duration,
    session,
    completedSession,
  } = props;

  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl transition-all duration-300 ease-in-out border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#121212] shadow-sm hover:shadow-md hover:-translate-y-0.5',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      <ListCardLeft
        color={color}
        isLocked={isLocked}
        isResuming={isResuming}
        isCompleted={isCompleted}
        displayTitle={displayTitle}
        test={test}
        ContainerLink={ContainerLink}
        linkProps={linkProps}
      />
      <ListCardRight
        duration={duration}
        questionCount={questionCount}
        takenCount={takenCount}
        isCompleted={isCompleted}
        isResuming={isResuming}
        completedSession={completedSession}
        progress={progress}
        color={color}
        isLocked={isLocked}
        test={test}
        session={session}
      />
    </m.div>
  );
}
