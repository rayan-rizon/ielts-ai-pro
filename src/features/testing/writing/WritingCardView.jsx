import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Users,
  Target,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { colorVariants } from './writingColorConfig';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WritingStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div
        className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
        data-oid="27:.nf7"
      >
        <Lock className="w-4 h-4 text-white" data-oid="zxs.:2p" />
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
        data-oid="_mbeaaq"
      >
        <span className="relative flex h-2 w-2" data-oid="kdfh9bd">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
            data-oid="r899y3g"
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', colorVariants[color].dot)}
            data-oid="upr7nn:"
          />
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="c5yj115">
          In Progress
        </span>
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
        data-oid="oc3nnug"
      >
        <CheckCircle2 className="w-3.5 h-3.5" data-oid="749s80g" />
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="sz0n4-0">
          Completed
        </span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
      data-oid="pfo_un_"
    >
      New Task
    </Badge>
  );
}

function MetaTakenPill({ takenCount }) {
  if (takenCount <= 0) return null;
  return (
    <div
      className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
      data-oid="pa5m0vj"
    >
      <Users className="w-3.5 h-3.5 text-slate-400" data-oid="re-cxjf" />
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300" data-oid="652m9ws">
        {takenCount} Taken
      </span>
    </div>
  );
}

function MetaProgressSection({ isResuming, progress, color }) {
  if (!isResuming) return null;
  return (
    <div
      className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
      data-oid="-691_:i"
    >
      <div className="flex justify-between text-xs font-bold tracking-wide" data-oid="c2iqc.6">
        <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="nldkwz1">
          Completion
        </span>
        <span
          className={cn('font-black', colorVariants[color].text.split(' ')[0])}
          data-oid="g8o-c2t"
        >
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
        indicatorClassName={cn('bg-gradient-to-r', colorVariants[color].progress)}
        data-oid="o:_ykvr"
      />
    </div>
  );
}

function MetaScoreSection({ isResuming, isCompleted, displayScore, color }) {
  if (isResuming) return null;
  if (!isCompleted) return null;
  if (displayScore === null || displayScore === undefined) return null;
  return (
    <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="s_jm:ja">
      <div className="flex items-center justify-between" data-oid="ju247t:">
        <span
          className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
          data-oid=":qlq:wt"
        >
          Your Score
        </span>
        <div className="flex items-center gap-2" data-oid="v:r3gzj">
          <span
            className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
            data-oid="kkng572"
          >
            {typeof displayScore === 'number' ? displayScore.toFixed(1) : displayScore}
          </span>
          <span className="text-xs text-slate-400" data-oid="xt3-_x5">
            / 9.0
          </span>
        </div>
      </div>
    </div>
  );
}

function WritingMetaBar({
  duration,
  wordLimit,
  takenCount,
  isResuming,
  isCompleted,
  displayScore,
  progress,
  color,
}) {
  const displayDuration = duration || 60;
  const displayWordLimit = wordLimit || 400;

  return (
    <div className="mb-6 relative z-10 space-y-4" data-oid="wrm-y7.">
      <div className="flex flex-wrap items-center gap-2" data-oid="2r3d.ub">
        <div
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
          data-oid="yu.ubve"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="-y2d13v" />
          <span
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            data-oid="czvnx9g"
          >
            {displayDuration} min
          </span>
        </div>
        <div
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
          data-oid="sow4x7q"
        >
          <Target className="w-3.5 h-3.5 text-slate-400" data-oid="6f64xnc" />
          <span
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            data-oid="1ic6vty"
          >
            {displayWordLimit} Words
          </span>
        </div>
        <MetaTakenPill takenCount={takenCount} />
      </div>

      <MetaProgressSection isResuming={isResuming} progress={progress} color={color} />
      <MetaScoreSection
        isResuming={isResuming}
        isCompleted={isCompleted}
        displayScore={displayScore}
        color={color}
      />
    </div>
  );
}

function WritingActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  session,
  completedSessionId,
  color,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="ixf:2gs">
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
          data-oid="gn6vgwj"
        >
          <Crown className="w-4 h-4 mr-2" data-oid="jo544-9" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link to={`/writing-task?sessionId=${session.id}`} className="block mt-4" data-oid="y2t8cyu">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants[color].button
          )}
          data-oid="s6xs6m2"
        >
          Resume Task <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid=".-4kr_9" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4" data-oid="zab9mjp">
        <Link
          to={`/writing-task?sessionId=${completedSessionId}&view=true`}
          className="flex-1"
          data-oid="jfg20.-"
        >
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants[color].button
            )}
            data-oid="k0u:nt6"
          >
            View Feedback <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid=":-av:yx" />
          </Button>
        </Link>
        <Link to={`/writing-task?taskId=${test.id}&new_attempt=true`} data-oid="_dqax-o">
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            data-oid="hp_onrw"
          >
            <RotateCcw className="w-4 h-4" data-oid="ty4dtj2" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link
      to={`/writing-task?taskId=${test.id}&new_attempt=true`}
      className="block mt-4"
      data-oid="b.7v7n_"
    >
      <Button
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-orange-900/40 transition-all group-hover:scale-[1.02] border-0"
        data-oid="8s0-v3x"
      >
        Start Writing <ChevronRight className="w-4 h-4 ml-1.5" data-oid="7d1d6w:" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// WritingCardView — grid card for Writing tests
// ---------------------------------------------------------------------------

export default function WritingCardView({
  test,
  isLocked,
  isResuming,
  isCompleted,
  progress,
  displayScore,
  displayTitle,
  color,
  Icon,
  ContainerLink,
  linkProps,
  hasMounted,
  takenCount,
  duration,
  wordLimit,
  session,
  completedSessionId,
}) {
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
      data-oid="_k4u2_e"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="o9pvpl6"
      />

      {/* Header: icon + status badge */}
      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="vu9byh8">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-white dark:bg-white/5',
            colorVariants[color].text,
            'shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border',
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="a9-urrz"
        >
          <Icon className="w-7 h-7" data-oid="05:_8kx" />
        </div>
        <div className="flex flex-col items-end gap-2.5" data-oid="0cckrht">
          <WritingStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
            color={color}
          />
        </div>
      </div>

      {/* Title + Description */}
      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="r.khxq1"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="nxh-d6w">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid="q_r2i7r"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="13gbdvp"
        >
          {test.description || 'Authentic IELTS Writing task practice with AI feedback.'}
        </p>
      </div>

      {/* Meta bar */}
      <div className={cn(isLocked && 'filter blur-sm select-none')}>
        <WritingMetaBar
          duration={duration}
          wordLimit={wordLimit}
          takenCount={takenCount}
          isResuming={isResuming}
          isCompleted={isCompleted}
          displayScore={displayScore}
          progress={progress}
          color={color}
        />
      </div>

      {/* Actions */}
      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="15yrq8t"
      >
        <WritingActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSessionId={completedSessionId}
          color={color}
        />
      </div>
    </motion.div>
  );
}
