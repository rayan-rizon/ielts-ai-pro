import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock,
  MessageSquare,
  Users,
  Lock,
  CheckCircle2,
  Play,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getSpeakingColorVariants } from './speakingColorConfig';
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

// ---------------------------------------------------------------------------
// Sub-components (extracted to lower CC)
// ---------------------------------------------------------------------------

function CardStatusBadge({ isLocked, isResuming, isCompleted, colorVariants }) {
  if (isLocked) {
    return (
      <div
        className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md transform rotate-12"
        data-oid="5bm:9ax"
      >
        <Lock className="w-3.5 h-3.5 text-white" data-oid="96riw8z" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
          colorVariants.badge
        )}
        data-oid="w3:66zz"
      >
        <span className="relative flex h-1.5 w-1.5" data-oid="nngk90m">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants.ping
            )}
            data-oid="bgb6jg0"
          />
          <span
            className={cn('relative inline-flex rounded-full h-1.5 w-1.5', colorVariants.dot)}
            data-oid="si_fvbl"
          />
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase" data-oid="sjobrqa">
          In Progress
        </span>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border backdrop-blur-md shadow-xs',
          colorVariants.badge
        )}
        data-oid="8c4b9yh"
      >
        <CheckCircle2 className="w-3 h-3" data-oid="cji.oc:" />
        <span className="text-[10px] font-bold tracking-wider uppercase" data-oid="grtthm:">
          Completed
        </span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-xs"
      data-oid=":u9d0cl"
    >
      New Practice
    </Badge>
  );
}

function CardMeta({ duration, takenCount }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-oid="ayj1gw.">
      <div
        className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs"
        data-oid="8:vrw0v"
      >
        <Clock className="w-3 h-3 text-slate-400" data-oid="5bass4-" />
        <span
          className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300"
          data-oid="bx4z_m1"
        >
          {duration} min
        </span>
      </div>
      <div
        className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs"
        data-oid="y2s:j2q"
      >
        <MessageSquare className="w-3 h-3 text-slate-400" data-oid="8pdnfnd" />
        <span
          className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300"
          data-oid="jfhh80-"
        >
          3 Parts
        </span>
      </div>
      {takenCount > 0 && (
        <div
          className="bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 rounded-md sm:rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs"
          data-oid="a7ca:--"
        >
          <Users className="w-3 h-3 text-slate-400" data-oid="l2w0mp1" />
          <span
            className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300"
            data-oid="ek7qvh4"
          >
            {takenCount} Taken
          </span>
        </div>
      )}
    </div>
  );
}

function formatScore(score) {
  return typeof score === 'number' ? score.toFixed(1) : score;
}

function CardProgress({ isResuming, isCompleted, displayScore, progress, color, colorVariants }) {
  if (isResuming) {
    return (
      <div
        className="space-y-2 pt-2 border-t border-slate-100/80 dark:border-white/5"
        data-oid="z.tomk1"
      >
        <div
          className="flex justify-between text-[11px] font-bold tracking-wide"
          data-oid="oa2tksl"
        >
          <span
            className="text-slate-600 dark:text-slate-400 uppercase text-[10px]"
            data-oid="fycg16p"
          >
            Completion
          </span>
          <span
            className={cn('font-black text-xs', colorVariants.text.split(' ')[0])}
            data-oid="lo2yfyj"
          >
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"
          indicatorClassName={cn(
            'bg-gradient-to-r',
            color === 'rose' ? 'from-rose-500 to-red-600' : 'from-violet-500 to-indigo-600'
          )}
          data-oid="fg5uxrp"
        />
      </div>
    );
  }
  if (isCompleted && displayScore !== undefined) {
    return (
      <div className="pt-2 border-t border-slate-100/80 dark:border-white/5" data-oid="18slee0">
        <div className="flex items-center justify-between" data-oid="om0e4zl">
          <span
            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase"
            data-oid="nbh.cz8"
          >
            Your Score
          </span>
          <div className="flex items-center gap-1.5" data-oid="shpc1n3">
            <span
              className={cn('text-xl font-black', colorVariants.text.split(' ')[0])}
              data-oid="8lelnw9"
            >
              {formatScore(displayScore)}
            </span>
            <span className="text-[11px] font-semibold text-slate-400" data-oid="lvrgg68">
              / 9.0
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function CardActions({
  isLocked,
  isResuming,
  isCompleted,
  test,
  completedSessionId,
  colorVariants,
}) {
  if (isLocked) {
    return (
      <Link to={createPageUrl('Pricing')} className="block mt-3" data-oid="1-3e0hv">
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg sm:rounded-xl h-10 text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          data-oid="5fm42bn"
        >
          <Crown className="w-4 h-4 mr-1.5" data-oid="5-w_or7" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link
        to={withLearningActivity(`/speaking-test/${test.id}`)}
        className="block mt-3"
        data-oid=":zh0p1."
      >
        <Button
          className={cn(
            'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-10 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
            colorVariants.button
          )}
          data-oid="kkql700"
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-1.5 fill-current" data-oid="3itzqz:" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-3" data-oid="z7ec8v0">
        <Link
          to={`/speaking-test/${completedSessionId}?view-score=true`}
          className="flex-1"
          data-oid="6pcyt9-"
        >
          <Button
            className={cn(
              'w-full bg-white/90 dark:bg-transparent backdrop-blur-md border font-bold rounded-lg sm:rounded-xl h-10 text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]',
              colorVariants.button
            )}
            data-oid="qhptw:o"
          >
            View Feedback <ArrowRight className="w-4 h-4 ml-1.5" data-oid="kqmoi6:" />
          </Button>
        </Link>
        <Link
          to={withLearningActivity(`/speaking-test?test-id=${test.id}&retake=true`)}
          data-oid="uyc57.d"
        >
          <Button
            variant="outline"
            className="h-10 px-3.5 rounded-lg sm:rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 backdrop-blur-md active:scale-[0.98]"
            data-oid="mwvc8dz"
          >
            <RotateCcw className="w-4 h-4" data-oid="pdh8st4" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link
      to={withLearningActivity(`/speaking-test?test-id=${test.id}`)}
      className="block mt-3"
      data-oid="telg.3f"
    >
      <Button
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-lg sm:rounded-xl h-10 text-xs sm:text-sm shadow-md shadow-slate-900/10 dark:shadow-rose-900/30 transition-all hover:scale-[1.01] active:scale-[0.98] border-0"
        data-oid="7ks8n2n"
      >
        Start Practice <ChevronRight className="w-4 h-4 ml-1" data-oid="u_qthly" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------

function SpeakingCardOverlay({ colorVariants }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-gradient-to-tr transition-opacity duration-300 opacity-0 group-hover:opacity-100 rounded-2xl sm:rounded-3xl backdrop-blur-xs pointer-events-none',
        colorVariants.hover
      )}
    />
  );
}

function SpeakingCardHeader({ Icon, colorVariants, isLocked, isResuming, isCompleted }) {
  return (
    <div className="flex justify-between items-start mb-3.5 relative z-10 shrink-0">
      <div
        className={cn(
          'w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300',
          'bg-white/90 dark:bg-white/10 backdrop-blur-md',
          colorVariants.text,
          'shadow-xs border',
          colorVariants.border,
          'group-hover:scale-105 group-hover:rotate-2'
        )}
      >
        <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <CardStatusBadge
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          colorVariants={colorVariants}
        />
      </div>
    </div>
  );
}

function SpeakingCardTitleBody({
  isLocked,
  colorVariants,
  displayTitle,
  test,
  ContainerLink,
  linkProps,
}) {
  return (
    <div className={cn('mb-3.5 relative z-10 shrink-0', isLocked && 'filter blur-sm select-none')}>
      <ContainerLink {...linkProps} className="block group/title">
        <h3
          className={cn(
            'text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1 transition-colors cursor-pointer line-clamp-2',
            `group-hover:${colorVariants.text.split(' ')[0]}`
          )}
        >
          {displayTitle}
        </h3>
      </ContainerLink>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal line-clamp-2 leading-relaxed">
        {test.description || 'Authentic IELTS Speaking practice with interactive AI models.'}
      </p>
    </div>
  );
}

function SpeakingCardView(props) {
  const {
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
    completedSessionId,
  } = props;

  const colorVariants = getSpeakingColorVariants(color);

  return (
    <motion.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col justify-between h-full min-h-[300px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-out',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-white/10',
        `bg-gradient-to-b ${colorVariants.gradient}`,
        'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)]',
        'dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.6)]',
        'hover:-translate-y-1.5 hover:border-slate-300/80 dark:hover:border-white/20 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
    >
      <SpeakingCardOverlay colorVariants={colorVariants} />
      <div className="flex flex-col">
        <SpeakingCardHeader
          Icon={Icon}
          colorVariants={colorVariants}
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
        />
        <SpeakingCardTitleBody
          isLocked={isLocked}
          colorVariants={colorVariants}
          displayTitle={displayTitle}
          test={test}
          ContainerLink={ContainerLink}
          linkProps={linkProps}
        />

        <div
          className={cn(
            'mb-3.5 relative z-10 space-y-2.5 shrink-0',
            isLocked && 'filter blur-sm select-none'
          )}
        >
          <CardMeta duration={duration} takenCount={takenCount} />
          <CardProgress
            isResuming={isResuming}
            isCompleted={isCompleted}
            displayScore={displayScore}
            progress={progress}
            color={color}
            colorVariants={colorVariants}
          />
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-2.5 border-t border-slate-100/80 dark:border-white/5 shrink-0">
        <CardActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          completedSessionId={completedSessionId}
          colorVariants={colorVariants}
        />
      </div>
    </motion.div>
  );
}

export default memo(SpeakingCardView);
