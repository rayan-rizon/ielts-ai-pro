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
      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12">
        <Lock className="w-4 h-4 text-white" />
      </div>
    );
  }

  if (isResuming) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 border',
          colorVariants[color].badge
        )}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', colorVariants[color].dot)}
          />
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase">In Progress</span>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-3 py-1 border',
          colorVariants[color].badge
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold tracking-wide uppercase">Completed</span>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
    >
      New Test
    </Badge>
  );
}

/** Progress bar shown while a test is in-progress. */
function InProgressBar({ progress, color }) {
  return (
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
      <div className="flex justify-between text-xs font-bold tracking-wide">
        <span className="text-slate-700 dark:text-slate-300 uppercase">Completion</span>
        <span className={cn('font-black', colorVariants[color].text.split(' ')[0])}>
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
        indicatorClassName={cn('bg-gradient-to-r', colorVariants[color].progress)}
      />
    </div>
  );
}

/** Score display shown when a test is completed and has a score. */
function CompletedScore({ score, color }) {
  return (
    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
          Your Score
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}>
            {typeof score === 'number' ? score.toFixed(1) : score}
          </span>
          <span className="text-xs text-slate-400">/ 9.0</span>
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
    <div className="mb-6 relative z-10 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {duration} min
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
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
      <Link to={createPageUrl('Pricing')} className="block mt-4">
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all">
          <Crown className="w-4 h-4 mr-2" /> Upgrade to Access
        </Button>
      </Link>
    );
  }

  if (isResuming) {
    return (
      <Link to={`/listening-test/${session.id}`} className="block mt-4">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants[color].button
          )}
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" />
        </Button>
      </Link>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4">
        <Link to={`/listening-test/${completedSession.id}?view-results=true`} className="flex-1">
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants[color].button
            )}
          >
            View Results <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </Link>
        <Link to={`/listening-test?test-id=${test.id}&retake=true`}>
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Link to={`/listening-test?test-id=${test.id}`} className="block mt-4">
      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-purple-900/40 transition-all group-hover:scale-[1.02] border-0">
        Start Practice <ChevronRight className="w-4 h-4 ml-1.5" />
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
        'group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] p-4 xs:p-5 sm:p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
      />

      {/* Header row: icon + status badge */}
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
          <TestCardStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
            color={color}
          />
        </div>
      </div>

      {/* Title + description */}
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
          {test.description || 'Authentic IELTS Listening practice with curated audio.'}
        </p>
      </div>

      {/* Meta bar */}
      <div className={cn(isLocked && 'filter blur-sm select-none')}>
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

      {/* Actions */}
      <div className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5">
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
