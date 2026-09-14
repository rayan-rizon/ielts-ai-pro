import React from 'react';
import { cn } from '@/lib/cn';
import { WritingStatusBadge, WritingMetaBar, WritingActions } from './WritingCardComponents';
import { IconChip, MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';

// ---------------------------------------------------------------------------
// WritingCardView — grid card for Writing tests
// ---------------------------------------------------------------------------

export default function WritingCardView(props) {
  const {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayScore,
    displayTitle,
    Icon,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    duration,
    wordLimit,
    session,
    completedSessionId,
    feedbackReady,
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
        <div className="mb-3 flex items-start justify-between">
          <IconChip icon={Icon} tone="accent" size="md" />
          <WritingStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
          />
        </div>

        <div className={cn('mb-3', isLocked && 'select-none blur-[3px]')}>
          <ContainerLink {...linkProps} className="block">
            <h3
              className={cn(
                TITLE,
                'mb-2 line-clamp-2 text-base font-bold leading-6 tracking-[0.01em] transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:group-hover:text-[#afb5ff]'
              )}
            >
              {displayTitle}
            </h3>
          </ContainerLink>
          <p className={cn('line-clamp-2 text-xs font-medium leading-relaxed', MUTED)}>
            {test.description || 'Authentic IELTS Writing task practice with AI feedback.'}
          </p>
        </div>

        <div className={cn('mb-3', isLocked && 'select-none blur-[3px]')}>
          <WritingMetaBar
            duration={duration}
            wordLimit={wordLimit}
            takenCount={takenCount}
            isResuming={isResuming}
            isCompleted={isCompleted}
            displayScore={displayScore}
            progress={progress}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
        <WritingActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSessionId={completedSessionId}
          feedbackReady={feedbackReady}
        />
      </div>
    </div>
  );
}
