import React, { memo } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MUTED, PANEL, Pill, TITLE } from '@/features/dashboard/components/primitives';
import {
  StatusBadge,
  TestCardActions,
  TestNumeralTile,
  TestProgressStrip,
  TestSpecFootnote,
} from './TestCardParts';
import {
  buildDisplayTitle,
  buildLinkTarget,
  computeAccessLock,
  computeProgress,
  resolveLinkConfig,
} from './helpers';

/**
 * Grid card for a single test.
 *
 * Reading order follows the dashboard's hierarchy rule — identity, then
 * movement, then supporting spec, then the action:
 *
 *   1. Numeral tile + official/status pills  (which paper is this?)
 *   2. Title                                 (what is it called?)
 *   3. Band score or progress meter          (where do I stand?)
 *   4. Spec footnote                         (duration / questions / attempts)
 *   5. Primary action
 *
 * Two things the previous card spent space on are deliberately gone: the
 * decorative icon chip (identical on every card in the grid, so it carried no
 * information) and the description paragraph, which fell back to the same
 * boilerplate sentence for every test that had no real description.
 */
function TestGridCard({
  skill,
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
  const isCompleted = !!completedSession?.is_completed;
  const isLocked = computeAccessLock(test, user, isAdmin);
  const progress = computeProgress(session, test, questionCount);
  const displayTitle = buildDisplayTitle(test, skill);
  const isOfficial = !!test.is_official_cambridge;

  const linkTo = buildLinkTarget(
    { isResuming, isCompleted, session, completedSession, test },
    skill
  );
  const { ContainerLink, linkProps } = resolveLinkConfig(isLocked, linkTo);

  // Only real, author-written descriptions earn space.
  const description =
    test.description && test.description.trim() !== skill.emptyDescription
      ? test.description
      : null;

  const hasStrip = isResuming || isCompleted;

  return (
    <m.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        PANEL,
        'flex h-full flex-col gap-2.5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]',
        isLocked && 'opacity-90'
      )}
    >
      {/* 1 — identity */}
      <div className="flex items-start gap-2.5">
        <TestNumeralTile test={test} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1">
            {isOfficial && <Pill tone="accent">Official</Pill>}
            <StatusBadge isLocked={isLocked} isResuming={isResuming} isCompleted={isCompleted} />
          </div>
          {/* 2 — title */}
          <ContainerLink {...linkProps} className="block min-w-0">
            <h3
              className={cn(
                TITLE,
                'line-clamp-2 leading-snug transition-colors hover:text-[#5a63df] dark:hover:text-[#afb5ff]',
                isLocked && 'select-none blur-[3px]'
              )}
              title={displayTitle}
            >
              {displayTitle}
            </h3>
          </ContainerLink>
        </div>
      </div>

      {description && (
        <p className={cn('line-clamp-2 text-[11px] font-medium leading-relaxed', MUTED)}>
          {description}
        </p>
      )}

      {/* 3 — movement */}
      {hasStrip && (
        <div
          className={cn(
            'border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]',
            isLocked && 'select-none blur-[3px]'
          )}
        >
          <TestProgressStrip
            isResuming={isResuming}
            isCompleted={isCompleted}
            progress={progress}
            completedSession={completedSession}
          />
        </div>
      )}

      {/* 4 + 5 — spec then action, pinned to the bottom so every card lines up */}
      <div className="mt-auto flex flex-col gap-2 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
        <TestSpecFootnote
          duration={duration}
          questionCount={questionCount}
          takenCount={takenCount}
        />
        <TestCardActions
          skill={skill}
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
        />
      </div>
    </m.div>
  );
}

function areEqual(prev, next) {
  return (
    prev.skill === next.skill &&
    prev.test.id === next.test.id &&
    prev.test.description === next.test.description &&
    prev.session?.id === next.session?.id &&
    prev.session?.completed_questions === next.session?.completed_questions &&
    prev.completedSession?.id === next.completedSession?.id &&
    prev.completedSession?.score === next.completedSession?.score &&
    prev.takenCount === next.takenCount &&
    prev.questionCount === next.questionCount &&
    prev.duration === next.duration &&
    prev.user?.subscription_tier === next.user?.subscription_tier &&
    prev.isAdmin === next.isAdmin &&
    prev.hasMounted === next.hasMounted
  );
}

export default memo(TestGridCard, areEqual);
