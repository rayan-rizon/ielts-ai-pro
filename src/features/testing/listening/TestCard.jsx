import TakeWithFriend from '@/features/testing/paired/TakeWithFriend';
import React, { memo } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { TestCardStatusBadge, TestCardMetaBar, TestCardActions } from './ListeningCardComponents';
import {
  computeAccessLock,
  computeProgress,
  buildDisplayTitle,
  resolveIcon,
  buildLinkTarget,
  resolveLinkConfig,
} from './testCardHelpers';
import { IconChip, MUTED, PANEL, TITLE } from '@/features/dashboard/components/primitives';

// ---------------------------------------------------------------------------
// Main TestCard component
// ---------------------------------------------------------------------------

function TestCard({
  test,
  session,
  completedSession,
  takenCount,
  questionCount,
  duration,
  user,
  isAdmin,
  hasMounted,
}) {
  const isResuming = !!session && !session.is_completed;
  const isCompleted = !!completedSession && completedSession.is_completed;

  const isLocked = computeAccessLock(test, user, isAdmin);
  const progress = computeProgress(session, test, questionCount);
  const displayTitle = buildDisplayTitle(test);
  const Icon = resolveIcon(test);
  const linkTo = buildLinkTarget({ isResuming, isCompleted, session, completedSession, test });
  const { ContainerLink, linkProps } = resolveLinkConfig(isLocked, linkTo);

  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        PANEL,
        'flex h-full min-h-[280px] flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12',
        isLocked && 'opacity-90'
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-start justify-between">
          <IconChip icon={Icon} tone="accent" size="md" />
          <TestCardStatusBadge
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
                'mb-2 line-clamp-2 text-base font-bold leading-6 tracking-[0.01em]'
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
            {test.description || 'Authentic IELTS Listening practice with curated audio.'}
          </p>
        </div>

        <div className={cn('mb-3', isLocked && 'select-none blur-[3px]')}>
          <TestCardMetaBar
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
        <TestCardActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
        />
      </div>
      <TakeWithFriend test={test} type="listening" isLocked={isLocked} />
    </m.div>
  );
}

export const MemoizedTestCard = memo(TestCard, (prev, next) => {
  return (
    prev.test.id === next.test.id &&
    prev.session?.id === next.session?.id &&
    prev.completedSession?.id === next.completedSession?.id &&
    prev.takenCount === next.takenCount &&
    prev.questionCount === next.questionCount &&
    prev.duration === next.duration &&
    prev.user?.subscription_tier === next.user?.subscription_tier &&
    prev.isAdmin === next.isAdmin &&
    prev.hasMounted === next.hasMounted
  );
});

export default TestCard;
