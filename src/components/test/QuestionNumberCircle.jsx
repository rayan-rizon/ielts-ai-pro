import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared component for displaying clickable question numbers with flag state.
 * Used in Reading and Listening tests for question navigation and review flagging.
 *
 * @param {number|string} number - Question number to display
 * @param {boolean} isFlagged - Whether the question is flagged for review
 * @param {function} onClick - Handler for click events
 * @param {'sm'|'md'|'lg'} size - Size variant
 * @param {string} className - Additional CSS classes
 */
const QuestionNumberCircle = React.memo(
  ({ number, isFlagged, onClick, status = 'default', size = 'md', className = '' }) => {
    const sizeClasses = {
      sm: 'min-w-[1.25rem] h-5 p-[4px] text-[12px] border-1.5',
      md: 'min-w-[1.5rem] h-6 p-[4px] text-[12px] border-2',
      lg: 'min-w-[2rem] h-8 p-[4px] text-[12px] border-2',
    };

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          'flex-none rounded-full flex items-center justify-center font-bold transition-all duration-300 active:scale-90 whitespace-nowrap',
          sizeClasses[size] || sizeClasses.md,
          isFlagged && status === 'default'
            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
            : status === 'correct'
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : status === 'typo'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : status === 'incorrect'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                  : status === 'unanswered'
                    ? 'bg-amber-400 text-amber-900 border-amber-500 shadow-sm'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:border-orange-300 dark:hover:border-orange-500/50',
          className
        )}
        title={isFlagged ? 'Uncheck to unflag' : 'Click to flag for review'}
        data-oid="ksh.17o"
      >
        {number}
      </button>
    );
  }
);

QuestionNumberCircle.displayName = 'QuestionNumberCircle';

export default QuestionNumberCircle;
