import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { colorVariants } from './writingColorConfig';
import { WritingStatusBadge, WritingMetaBar, WritingActions } from './WritingCardComponents';

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
