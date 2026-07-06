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

// ---------------------------------------------------------------------------
// Sub-components (extracted to lower CC)
// ---------------------------------------------------------------------------

function CardStatusBadge({ isLocked, isResuming, isCompleted, colorVariants }) {
  if (isLocked) {
    return (
      <div
        className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
        data-oid="5bm:9ax"
      >
        <Lock className="w-4 h-4 text-white" data-oid="96riw8z" />
      </div>
    );
  }
  if (isResuming) {
    return (
      <div
        className={cn('flex items-center gap-2 rounded-full px-3 py-1 border', colorVariants.badge)}
        data-oid="w3:66zz"
      >
        <span className="relative flex h-2 w-2" data-oid="nngk90m">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants.ping
            )}
            data-oid="bgb6jg0"
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', colorVariants.dot)}
            data-oid="si_fvbl"
          />
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="sjobrqa">
          In Progress
        </span>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div
        className={cn('flex items-center gap-2 rounded-full px-3 py-1 border', colorVariants.badge)}
        data-oid="8c4b9yh"
      >
        <CheckCircle2 className="w-3.5 h-3.5" data-oid="cji.oc:" />
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="grtthm:">
          Completed
        </span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
      data-oid=":u9d0cl"
    >
      New Practice
    </Badge>
  );
}

function CardMeta({ duration, takenCount }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-oid="ayj1gw.">
      <div
        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
        data-oid="8:vrw0v"
      >
        <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="5bass4-" />
        <span
          className="text-xs font-semibold text-slate-600 dark:text-slate-300"
          data-oid="bx4z_m1"
        >
          {duration} min
        </span>
      </div>
      <div
        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
        data-oid="y2s:j2q"
      >
        <MessageSquare className="w-3.5 h-3.5 text-slate-400" data-oid="8pdnfnd" />
        <span
          className="text-xs font-semibold text-slate-600 dark:text-slate-300"
          data-oid="jfhh80-"
        >
          3 Parts
        </span>
      </div>
      {takenCount > 0 && (
        <div
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
          data-oid="a7ca:--"
        >
          <Users className="w-3.5 h-3.5 text-slate-400" data-oid="l2w0mp1" />
          <span
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
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
        className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
        data-oid="z.tomk1"
      >
        <div className="flex justify-between text-xs font-bold tracking-wide" data-oid="oa2tksl">
          <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="fycg16p">
            Completion
          </span>
          <span className={cn('font-black', colorVariants.text.split(' ')[0])} data-oid="lo2yfyj">
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
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
      <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="18slee0">
        <div className="flex items-center justify-between" data-oid="om0e4zl">
          <span
            className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
            data-oid="nbh.cz8"
          >
            Your Score
          </span>
          <div className="flex items-center gap-2" data-oid="shpc1n3">
            <span
              className={cn('text-2xl font-black', colorVariants.text.split(' ')[0])}
              data-oid="8lelnw9"
            >
              {formatScore(displayScore)}
            </span>
            <span className="text-xs text-slate-400" data-oid="lvrgg68">
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
      <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="1-3e0hv">
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
          data-oid="5fm42bn"
        >
          <Crown className="w-4 h-4 mr-2" data-oid="5-w_or7" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link to={`/speaking-test/${test.id}`} className="block mt-4" data-oid=":zh0p1.">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants.button
          )}
          data-oid="kkql700"
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid="3itzqz:" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4" data-oid="z7ec8v0">
        <Link
          to={`/speaking-test/${completedSessionId}?view-score=true`}
          className="flex-1"
          data-oid="6pcyt9-"
        >
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants.button
            )}
            data-oid="qhptw:o"
          >
            View Feedback <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid="kqmoi6:" />
          </Button>
        </Link>
        <Link to={`/speaking-test?test-id=${test.id}&retake=true`} data-oid="uyc57.d">
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            data-oid="mwvc8dz"
          >
            <RotateCcw className="w-4 h-4" data-oid="pdh8st4" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link to={`/speaking-test?test-id=${test.id}`} className="block mt-4" data-oid="telg.3f">
      <Button
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-rose-900/40 transition-all group-hover:scale-[1.02] border-0"
        data-oid="7ks8n2n"
      >
        Start Practice <ChevronRight className="w-4 h-4 ml-1.5" data-oid="yuz4ryn" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main card view
// ---------------------------------------------------------------------------

function SpeakingCardView({
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
}) {
  const colorVariants = getSpeakingColorVariants(color);

  return (
    <motion.div
      initial={hasMounted ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col h-full rounded-[2rem] p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants.gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
      data-oid="t9f1m7e"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants.hover
        )}
        data-oid="bp:.te-"
      />

      {/* Header row: icon + status badge */}
      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="ifdqc.z">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-white dark:bg-white/5',
            colorVariants.text,
            'shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border',
            colorVariants.border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="sy9nen7"
        >
          <Icon className="w-7 h-7" data-oid="nots4-d" />
        </div>
        <div className="flex flex-col items-end gap-2.5" data-oid="ngizc_n">
          <CardStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
            colorVariants={colorVariants}
          />
        </div>
      </div>

      {/* Title + description */}
      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="dsiggr1"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="ptwizl8">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants.text.split(' ')[0]}`
            )}
            data-oid="-4myz11"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="lj4:12b"
        >
          {test.description || 'Authentic IELTS Speaking practice with interactive AI models.'}
        </p>
      </div>

      {/* Meta chips + progress */}
      <div
        className={cn('mb-6 relative z-10 space-y-4', isLocked && 'filter blur-sm select-none')}
        data-oid="06pani."
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

      {/* CTA buttons */}
      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="df7:163"
      >
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
