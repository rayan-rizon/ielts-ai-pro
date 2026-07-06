import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { colorVariants } from './readingColorConfig';
import { GridStatusBadge, GridMetaBar, GridActions } from './ReadingCardComponents';

// ---------------------------------------------------------------------------
// Grid-view card for Reading tests
// ---------------------------------------------------------------------------

function GridCardOverlay({ color }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
        colorVariants[color].hover
      )}
    />
  );
}

function GridCardHeader({ color, Icon, isLocked, isResuming, isCompleted }) {
  return (
    <div className="flex justify-between items-start mb-6 relative z-10">
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
          'bg-white dark:bg-white/5',
          colorVariants[color].text,
          'shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border',
          colorVariants[color].border,
          'group-hover:scale-110 group-hover:rotate-3'
        )}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex flex-col items-end gap-2.5">
        <GridStatusBadge
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          color={color}
        />
      </div>
    </div>
  );
}

function GridCardTitleBody({ isLocked, color, displayTitle, test, ContainerLink, linkProps }) {
  return (
    <div className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}>
      <ContainerLink {...linkProps} className="block group/title">
        <h3
          className={cn(
            'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
            `group-hover:${colorVariants[color].text.split(' ')[0]}`
          )}
        >
          {displayTitle}
        </h3>
      </ContainerLink>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
        {test.description || 'Authentic IELTS Reading practice with curated passages.'}
      </p>
    </div>
  );
}

export default function ReadingCardGridView(props) {
  const {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayTitle,
    color,
    Icon,
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
        'group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] p-4 xs:p-5 sm:p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      <GridCardOverlay color={color} />
      <GridCardHeader
        color={color}
        Icon={Icon}
        isLocked={isLocked}
        isResuming={isResuming}
        isCompleted={isCompleted}
      />
      <GridCardTitleBody
        isLocked={isLocked}
        color={color}
        displayTitle={displayTitle}
        test={test}
        ContainerLink={ContainerLink}
        linkProps={linkProps}
      />

      <div className={cn(isLocked && 'filter blur-sm select-none')}>
        <GridMetaBar
          duration={duration}
          questionCount={questionCount}
          takenCount={takenCount}
          isResuming={isResuming}
          isCompleted={isCompleted}
          completedSession={completedSession}
          progress={progress}
          color={color}
        />
      </div>

      <div className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5">
        <GridActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
          color={color}
        />
      </div>
    </m.div>
  );
}
