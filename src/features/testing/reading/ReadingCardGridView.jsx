import React from 'react';
import { m } from 'framer-motion';
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
import { colorVariants, PROGRESS_GRADIENTS } from './readingColorConfig';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GridStatusBadge({ isLocked, isResuming, isCompleted, color }) {
  if (isLocked) {
    return (
      <div
        className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12"
        data-oid="jx_c_07"
      >
        <Lock className="w-4 h-4 text-white" data-oid="xo3i_dy" />
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
        data-oid="ym.thci"
      >
        <span className="relative flex h-2 w-2" data-oid="4cnsne.">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colorVariants[color].ping
            )}
            data-oid="gsdkoz1"
          />
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', colorVariants[color].dot)}
            data-oid="y3bg-tn"
          />
        </span>
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="l8u4l2c">
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
        data-oid="w4vpfj-"
      >
        <CheckCircle2 className="w-3.5 h-3.5" data-oid="c6-sh8k" />
        <span className="text-[11px] font-bold tracking-wide uppercase" data-oid="fasg:of">
          Completed
        </span>
      </div>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
      data-oid="5rlvbu5"
    >
      New Test
    </Badge>
  );
}

function GridMetaBar({
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
    <div className="mb-6 relative z-10 space-y-4" data-oid="poq6spf">
      <div className="flex flex-wrap items-center gap-2" data-oid="1:75gmx">
        <div
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
          data-oid="1dr4wej"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" data-oid="4iuckbh" />
          <span
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            data-oid="hcu16dd"
          >
            {duration} min
          </span>
        </div>
        <div
          className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
          data-oid="chqdca8"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" data-oid="hdn9t8g" />
          <span
            className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            data-oid="27c3f.7"
          >
            {questionCount} Qs
          </span>
        </div>
        {takenCount > 0 && (
          <div
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
            data-oid="3x1tv_1"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" data-oid="8io1hgn" />
            <span
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              data-oid="acfxxw8"
            >
              {takenCount} Taken
            </span>
          </div>
        )}
      </div>

      {isResuming && (
        <div
          className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5"
          data-oid="i3sj1k8"
        >
          <div className="flex justify-between text-xs font-bold tracking-wide" data-oid="49_bho0">
            <span className="text-slate-700 dark:text-slate-300 uppercase" data-oid="ilb5gxy">
              Completion
            </span>
            <span
              className={cn('font-black', colorVariants[color].text.split(' ')[0])}
              data-oid="ih.cv4u"
            >
              {progress}%
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full"
            indicatorClassName={cn(
              'bg-gradient-to-r',
              PROGRESS_GRADIENTS[color] || PROGRESS_GRADIENTS.indigo
            )}
            data-oid="z.a866b"
          />
        </div>
      )}

      {!isResuming && isCompleted && completedSession?.score !== undefined && (
        <div className="pt-2 border-t border-slate-100 dark:border-white/5" data-oid="qpmbtc_">
          <div className="flex items-center justify-between" data-oid="roj4ndc">
            <span
              className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase"
              data-oid="hy8h1cb"
            >
              Your Score
            </span>
            <div className="flex items-center gap-2" data-oid="::krmiq">
              <span
                className={cn('text-2xl font-black', colorVariants[color].text.split(' ')[0])}
                data-oid="5aeli2w"
              >
                {typeof completedSession.score === 'number'
                  ? completedSession.score.toFixed(1)
                  : completedSession.score}
              </span>
              <span className="text-xs text-slate-400" data-oid="tjsedhl">
                / 9.0
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GridActions({
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
      <Link to={createPageUrl('Pricing')} className="block mt-4" data-oid="p:qw.u8">
        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-11 text-sm shadow-lg transition-all"
          data-oid=".z4b.pp"
        >
          <Crown className="w-4 h-4 mr-2" data-oid="ybgertq" /> Upgrade to Access
        </Button>
      </Link>
    );
  }
  if (isResuming) {
    return (
      <Link to={`/reading-test/${session.id}`} className="block mt-4" data-oid="dpbkae:">
        <Button
          className={cn(
            'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
            colorVariants[color].button
          )}
          data-oid="ru02_92"
        >
          Resume Test <Play className="w-3.5 h-3.5 ml-2 fill-current" data-oid="-t13h0_" />
        </Button>
      </Link>
    );
  }
  if (isCompleted) {
    return (
      <div className="flex gap-2 mt-4" data-oid="w7xpwnp">
        <Link
          to={`/reading-test/${completedSession.id}?view-results=true`}
          className="flex-1"
          data-oid="pa5e:mx"
        >
          <Button
            className={cn(
              'w-full bg-white dark:bg-transparent border font-bold rounded-xl h-11 text-sm shadow-none transition-all',
              colorVariants[color].button
            )}
            data-oid="1.0n5kb"
          >
            View Results <ArrowRight className="w-3.5 h-3.5 ml-2" data-oid="2nb6rv2" />
          </Button>
        </Link>
        <Link to={`/reading-test?test-id=${test.id}&retake=true`} data-oid="2:6nne9">
          <Button
            variant="outline"
            className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            data-oid="1q78zwe"
          >
            <RotateCcw className="w-4 h-4" data-oid="515r7cu" />
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <Link to={`/reading-test?test-id=${test.id}`} className="block mt-4" data-oid="5dnutpa">
      <Button
        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl h-11 text-sm shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 transition-all group-hover:scale-[1.02] border-0"
        data-oid="s9zb8u5"
      >
        Start Practice <ChevronRight className="w-4 h-4 ml-1.5" data-oid="g-or.q6" />
      </Button>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Grid-view card for Reading tests
// ---------------------------------------------------------------------------

export default function ReadingCardGridView({
  test,
  isLocked,
  isResuming,
  isCompleted,
  progress,
  displayTitle,
  color,
  Icon,
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
        'group relative flex flex-col h-full rounded-[1.5rem] sm:rounded-[2rem] p-4 xs:p-5 sm:p-6 transition-all duration-500 ease-sidebar',
        'bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5',
        `bg-gradient-to-b ${colorVariants[color].gradient}`,
        'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15)]',
        'dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]',
        'hover:-translate-y-2 will-change-transform',
        isLocked && 'opacity-90 grayscale-[0.2]'
      )}
      data-oid="kznwcsl"
    >
      {/* Hover gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-tr transition-opacity duration-500 opacity-0 group-hover:opacity-100 rounded-[2rem]',
          colorVariants[color].hover
        )}
        data-oid="6oom_dy"
      />

      {/* Header row: icon + status badge */}
      <div className="flex justify-between items-start mb-6 relative z-10" data-oid="7243sbp">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-white dark:bg-white/5',
            colorVariants[color].text,
            'shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-none border',
            colorVariants[color].border,
            'group-hover:scale-110 group-hover:rotate-3'
          )}
          data-oid="hwmntep"
        >
          <Icon className="w-7 h-7" data-oid="kfw2o4t" />
        </div>
        <div className="flex flex-col items-end gap-2.5" data-oid="iis2dge">
          <GridStatusBadge
            isLocked={isLocked}
            isResuming={isResuming}
            isCompleted={isCompleted}
            color={color}
          />
        </div>
      </div>

      {/* Title and Description */}
      <div
        className={cn('mb-6 flex-grow relative z-10', isLocked && 'filter blur-sm select-none')}
        data-oid="zkj9a0t"
      >
        <ContainerLink {...linkProps} className="block group/title" data-oid="3wc-6qv">
          <h3
            className={cn(
              'text-xl font-bold text-slate-900 dark:text-white leading-snug mb-2 transition-colors cursor-pointer line-clamp-2',
              `group-hover:${colorVariants[color].text.split(' ')[0]}`
            )}
            data-oid="ro8v-ow"
          >
            {displayTitle}
          </h3>
        </ContainerLink>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2"
          data-oid="53.i6u:"
        >
          {test.description || 'Authentic IELTS Reading practice with curated passages.'}
        </p>
      </div>

      {/* Meta bar — conditionally blurred when locked */}
      <div className={cn(isLocked && 'filter blur-sm select-none')}>
        <GridMetaBar
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
      <div
        className="relative z-10 mt-auto pt-2 border-t border-slate-50 dark:border-white/5"
        data-oid="j-ihb1_"
      >
        <GridActions
          isLocked={isLocked}
          isResuming={isResuming}
          isCompleted={isCompleted}
          test={test}
          session={session}
          completedSession={completedSession}
          color={color}
        />
      </div>
    </m.div>
  );
}
