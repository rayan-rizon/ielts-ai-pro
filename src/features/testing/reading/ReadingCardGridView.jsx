import TakeWithFriend from '@/features/testing/paired/TakeWithFriend';
import React from 'react';
import { cn } from '@/lib/cn';
import { GridStatusBadge, GridMetaBar, GridActions } from './ReadingCardComponents';
import { IconChip, MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';

// ---------------------------------------------------------------------------
// Grid-view card for Reading tests
// ---------------------------------------------------------------------------

function GridCardHeader({ Icon, isLocked, isResuming, isCompleted }) {
  return (
    <div className="mb-3 flex items-start justify-between">
      <IconChip icon={Icon} tone="accent" size="md" />
      <GridStatusBadge isLocked={isLocked} isResuming={isResuming} isCompleted={isCompleted} />
    </div>
  );
}

function GridCardTitleBody({ isLocked, displayTitle, test, ContainerLink, linkProps }) {
  return (
    <div className={cn('mb-3', isLocked && 'select-none blur-[3px]')}>
      <ContainerLink {...linkProps} className="block">
        <h3
          className={cn(
            TITLE,
            'mb-2 line-clamp-2 text-base font-bold leading-6 tracking-[0.01em] transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:group-hover:text-[#afb5ff]'
          )}
        >
          {displayTitle}
          {test.partly_practised && (
            <span className="block text-xs font-normal text-muted-foreground">
              Partly practised
            </span>
          )}
        </h3>
      </ContainerLink>
      <p className={cn('line-clamp-2 text-xs font-medium leading-relaxed', MUTED)}>
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
    <div
      className={cn(
        PANEL,
        'group flex h-full min-h-[280px] flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12',
        isLocked && 'opacity-90'
      )}
    >
      <div className="flex flex-1 flex-col">
        <GridCardHeader
          Icon={Icon}
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
        />
        <GridCardTitleBody
          isLocked={isLocked}
          displayTitle={displayTitle}
          test={test}
          ContainerLink={ContainerLink}
          linkProps={linkProps}
        />

        <div className={cn('mb-3', isLocked && 'select-none blur-[3px]')}>
          <GridMetaBar
            duration={duration}
            questionCount={questionCount}
            takenCount={takenCount}
            isResuming={isResuming}
            isCompleted={isCompleted}
            completedSession={completedSession}
            progress={progress}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
        <GridActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
        />
      </div>
      <TakeWithFriend test={test} type="reading" isLocked={isLocked} />
    </div>
  );
}
