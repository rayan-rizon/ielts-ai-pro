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
        'absolute inset-0 bg-gradient-to-tr transition-opacity duration-300 opacity-0 group-hover:opacity-100 rounded-2xl sm:rounded-3xl backdrop-blur-xs pointer-events-none',
        colorVariants[color].hover
      )}
    />
  );
}

function GridCardHeader({ color, Icon, isLocked, isResuming, isCompleted }) {
  return (
    <div className="flex justify-between items-start mb-3.5 relative z-10 shrink-0">
      <div
        className={cn(
          'w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300',
          'bg-white/90 dark:bg-white/10 backdrop-blur-md',
          colorVariants[color].text,
          'shadow-xs border',
          colorVariants[color].border,
          'group-hover:scale-105 group-hover:rotate-2'
        )}
      >
        <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
      </div>
      <div className="flex flex-col items-end gap-2">
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
    <div className={cn('mb-3.5 relative z-10 shrink-0', isLocked && 'filter blur-sm select-none')}>
      <ContainerLink {...linkProps} className="block group/title">
        <h3
          className={cn(
            'text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1 transition-colors cursor-pointer line-clamp-2',
            `group-hover:${colorVariants[color].text.split(' ')[0]}`
          )}
        >
          {displayTitle}
        </h3>
      </ContainerLink>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed">
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
        'group relative flex flex-col justify-between h-full min-h-[300px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out',
        'bg-white dark:bg-[#10131f] border border-[#e0e4f1] dark:border-white/10 hover:border-[#5661e9]/50 dark:hover:border-indigo-400/50',
        'shadow-xs hover:shadow-md transition-all duration-200',
        'hover:-translate-y-1 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      <GridCardOverlay color={color} />
      <div className="flex flex-col">
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

        <div
          className={cn('mb-3.5 relative z-10 shrink-0', isLocked && 'filter blur-sm select-none')}
        >
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
      </div>

      <div className="relative z-10 mt-auto pt-2.5 border-t border-slate-100/80 dark:border-white/5 shrink-0">
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
