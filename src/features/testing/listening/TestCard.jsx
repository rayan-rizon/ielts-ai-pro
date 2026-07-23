import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Users,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { colorVariants, getColor } from './colorConfig';
import {
  computeAccessLock,
  computeProgress,
  buildDisplayTitle,
  resolveIcon,
  buildLinkTarget,
  resolveLinkConfig,
} from './testCardHelpers';

// ---------------------------------------------------------------------------
// Sub-components — each handles one visual region of the card
// ---------------------------------------------------------------------------

/** Top-right status badge (Locked / In-Progress / Completed / New). */
function TestCardStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md transform rotate-12">
        <Lock className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }

  if (isResuming) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
          colorVariants[color].badge
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              colorVariants[color].dot
            )}
          />
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase">In Progress</span>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
          colorVariants[color].badge
        )}
      >
        <CheckCircle2 className="w-3 h-3" />
        <span className="text-[10px] font-bold tracking-wider uppercase">Completed</span>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs"
    >
      New Test
    </Badge>
  );
}

/** Progress bar shown while a test is in-progress. */
function InProgressBar({ progress, color }) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-100/80 dark:border-white/5">
      <div className="flex justify-between text-[11px] font-bold tracking-wide">
        <span className="text-slate-600 dark:text-slate-400 uppercase text-[10px]">Completion</span>
        <span className={cn('font-black text-xs', colorVariants[color].text.split(' ')[0])}>
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
        indicatorClassName={cn('bg-gradient-to-r', colorVariants[color].progress)}
      />
    </div>
  );
}

/** Score display shown when a test is completed and has a score. */
function CompletedScore({ score, color }) {
  return (
    <div className="pt-2 border-t border-slate-100/80 dark:border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
          Your Score
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xl font-black', colorVariants[color].text.split(' ')[0])}>
            {typeof score === 'number' ? score.toFixed(1) : score}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">/ 9.0</span>
        </div>
      </div>
    </div>
  );
}

/** Meta-bar: duration, question count, taken count, and progress/score section. */
function TestCardMetaBar({
  duration,
  questionCount,
  takenCount,
  isResuming,
  isCompleted,
  completedSession,
  progress,
  color,
}) {
  return (
    <div className="mb-4 relative z-10 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            {duration} min
          </span>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300">
              {takenCount} Taken
            </span>
          </div>
        )}
      </div>

      {isResuming ? (
        <InProgressBar progress={progress} color={color} />
      ) : isCompleted && completedSession?.score !== undefined ? (
        <CompletedScore score={completedSession.score} color={color} />
      ) : null}
    </div>
  );
}

/** Action buttons at the bottom of the card. */
function TestCardActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSession,
  color,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]">
          <Crown className="w-4 h-4 mr-1.5" /> Upgrade to Access
        </Button>
      </Link>
    );
  }

  if (isResuming) {
    return (
      <Link to={`/listening-test/${session.id}`} className="block">
        <Button
          className={cn(
            'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
            colorVariants[color].button
          )}
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-1.5 fill-current" />
        </Button>
      </Link>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex gap-2">
        <Link to={`/listening-test/${completedSession.id}?view-results=true`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
              colorVariants[color].button
            )}
          >
            View Results <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
        <Link to={`/listening-test?test-id=${test.id}&retake=true`}>
          <Button
            variant="outline"
            className="h-9.5 px-3.5 rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-md active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Link to={`/listening-test?test-id=${test.id}`} className="block">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold rounded-lg sm:rounded-xl h-9.5 text-xs sm:text-sm shadow-md shadow-slate-900/10 dark:shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.98] border-0">
        Start Practice <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </Link>
  );
}

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
  const color = getColor(displayTitle || 'default');
  const Icon = resolveIcon(test);
  const linkTo = buildLinkTarget({ isResuming, isCompleted, session, completedSession, test });
  const { ContainerLink, linkProps } = resolveLinkConfig(isLocked, linkTo);

  return (
    <motion.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col justify-between h-full min-h-[300px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-white/10',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)]',
        'dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.6)]',
        'hover:-translate-y-1.5 hover:border-slate-300/80 dark:hover:border-white/20 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-300 opacity-0 group-hover:opacity-100 rounded-2xl sm:rounded-3xl backdrop-blur-xs pointer-events-none',
          colorVariants[color].hover
        )}
      />

      <div className="flex flex-col">
        {/* Header row: icon + status badge */}
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
            <TestCardStatusBadge
              isLocked={isLocked}
              isResuming={isResuming}
              isCompleted={isCompleted}
              color={color}
            />
          </div>
        </div>

        {/* Title + description */}
        <div
          className={cn('mb-3.5 relative z-10 shrink-0', isLocked && 'filter blur-sm select-none')}
        >
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
            {test.description || 'Authentic IELTS Listening practice with curated audio.'}
          </p>
        </div>

        {/* Meta bar */}
        <div
          className={cn('mb-3.5 relative z-10 shrink-0', isLocked && 'filter blur-sm select-none')}
        >
          <TestCardMetaBar
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

      {/* Actions */}
      <div className="relative z-10 mt-auto pt-2.5 border-t border-slate-100/80 dark:border-white/5 shrink-0">
        <TestCardActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
          color={color}
        />
      </div>
    </motion.div>
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
