import React from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Clock,
  BookOpen,
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
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { colorVariants, PROGRESS_GRADIENTS } from './readingColorConfig';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ListStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div
        className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md shrink-0"
        data-oid="list-card-lock"
      >
        <Lock className="w-3 h-3 text-white" data-oid="list-card-lock-icon" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
          colorVariants[color].badge
        )}
        data-oid="list-card-resume-badge"
      >
        <span className="relative flex h-1.5 w-1.5" data-oid="list-card-resume-ping-wrap">
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
        In Progress
      </span>
    );
  }
  if (isCompleted) {
    return (
      <span
        className={cn(
          'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
          colorVariants[color].badge
        )}
        data-oid="list-card-completed-badge"
      >
        <CheckCircle2 className="w-3 h-3" data-oid="list-card-check-icon" />
        Completed
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shrink-0"
      data-oid="list-card-new-badge"
    >
      New
    </Badge>
  );
}

function ListScoreProgress({ isCompleted, isResuming, completedSession, progress, color }) {
  if (isCompleted && completedSession) {
    return (
      <div
        className="flex flex-col items-start sm:items-end justify-center min-w-[70px]"
        data-oid="list-card-score-container"
      >
        <span
          className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          data-oid="list-card-score-label"
        >
          Score
        </span>
        <div className="flex items-center gap-0.5" data-oid="list-card-score-val-wrap">
          <span
            className={cn('text-base font-black', colorVariants[color].text.split(' ')[0])}
            data-oid="list-card-score-val"
          >
            {typeof completedSession.score === 'number'
              ? completedSession.score.toFixed(1)
              : completedSession.score}
          </span>
          <span className="text-[10px] text-slate-400" data-oid="list-card-score-max">
            / 9.0
          </span>
        </div>
      </div>
    );
  }
  if (isResuming) {
    return (
      <div className="flex flex-col gap-1 w-20" data-oid="list-card-progress-container">
        <div
          className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          data-oid="list-card-progress-labels"
        >
          <span>Progress</span>
          <span
            className={colorVariants[color].text.split(' ')[0]}
            data-oid="list-card-progress-percent"
          >
            {progress}%
          </span>
        </div>
        <div
          className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden"
          data-oid="list-card-progress-bar-wrap"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 bg-gradient-to-r',
              PROGRESS_GRADIENTS[color] || PROGRESS_GRADIENTS.indigo
            )}
            style={{ width: `${progress}%` }}
            data-oid="list-card-progress-bar"
          />
        </div>
      </div>
    );
  }
  return null;
}

function ListActions({
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
      <Link
        to={createPageUrl('Pricing')}
        className="w-full sm:w-auto"
        data-oid="list-card-link-lock"
      >
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md transition-all flex items-center justify-center"
          data-oid="list-card-btn-lock"
        >
          <Crown className="w-3.5 h-3.5 mr-1.5" /> Upgrade
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link
        to={`/reading-test/${session.id}`}
        className="w-full sm:w-auto"
        data-oid="list-card-link-resume"
      >
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-10 px-4 text-xs shadow-none transition-all flex items-center justify-center gap-1',
            colorVariants[color].button
          )}
          data-oid="list-card-btn-resume"
        >
          Resume <Play className="w-3 h-3 fill-current" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-1.5 w-full sm:w-auto" data-oid="list-card-completed-btns">
        <Link
          to={`/reading-test/${completedSession.id}?view-results=true`}
          className="flex-1 sm:flex-initial"
          data-oid="list-card-link-results"
        >
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-10 px-4 text-xs shadow-none transition-all flex items-center justify-center gap-1',
              colorVariants[color].button
            )}
            data-oid="list-card-btn-results"
          >
            Results <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`} data-oid="list-card-link-retake">
          <Button
            variant="outline"
            className="h-10 w-10 p-0 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
            data-oid="list-card-btn-retake"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link
      to={`/reading-test?test-id=${test.id}`}
      className="w-full sm:w-auto"
      data-oid="list-card-link-start"
    >
      <Button
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl h-10 px-4 text-xs shadow-md transition-all flex items-center justify-center border-0 gap-1"
        data-oid="list-card-btn-start"
      >
        Start Practice <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// List-view card for Reading tests
// ---------------------------------------------------------------------------

export default function ReadingCardListView({
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
}) {
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
      data-oid="list-card-container"
    >
      {/* Left: Icon, Title & Badge */}
      <div className="flex items-center gap-4 flex-1 min-w-0" data-oid="list-card-left">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border bg-white dark:bg-white/5 shrink-0',
            colorVariants[color].text,
            colorVariants[color].border,
            'group-hover:scale-105'
          )}
          data-oid="list-card-icon-container"
        >
          <BookOpen className="w-6 h-6" data-oid="list-card-icon" />
        </div>

        <div className="flex-1 min-w-0" data-oid="list-card-info">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap" data-oid="list-card-title-row">
            <ContainerLink
              {...linkProps}
              className="block group/title max-w-full"
              data-oid="list-card-title-link"
            >
              <h3
                className={cn(
                  'text-base font-bold text-slate-900 dark:text-white leading-snug cursor-pointer line-clamp-1 hover:text-blue-500 transition-colors',
                  `group-hover:${colorVariants[color].text.split(' ')[0]}`
                )}
                data-oid="list-card-title-text"
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
          <p
            className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1"
            data-oid="list-card-desc"
          >
            {test.description || 'Authentic IELTS Reading practice with curated passages.'}
          </p>
        </div>
      </div>

      {/* Right: Meta + Score/Progress + Actions */}
      <div
        className="flex flex-wrap sm:flex-nowrap items-center gap-6 justify-between sm:justify-end w-full sm:w-auto shrink-0"
        data-oid="list-card-right-group"
      >
        <div
          className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400"
          data-oid="list-card-metrics"
        >
          <span className="flex items-center gap-1.5" data-oid="list-card-metric-duration">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {duration}m
          </span>
          <span className="flex items-center gap-1.5" data-oid="list-card-metric-questions">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            {questionCount} Qs
          </span>
          <span className="flex items-center gap-1.5" data-oid="list-card-metric-taken">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {takenCount} Taken
          </span>
        </div>

        <ListScoreProgress
          isCompleted={isCompleted}
          isResuming={isResuming}
          completedSession={completedSession}
          progress={progress}
          color={color}
        />

        <div
          className="flex items-center gap-2 min-w-[130px] justify-end"
          data-oid="list-card-actions-container"
        >
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
    </m.div>
  );
}
