import { memo, useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Shared test timer component with warning states.
 * Displays countdown timer with visual warnings when time is running low.
 *
 * @param {Object} props
 * @param {number} props.timeRemaining - Time remaining in seconds
 * @param {Function} props.onTimeUp - Callback when time reaches zero
 * @param {boolean} props.isActive - Whether timer is actively counting down
 * @param {string} props.className - Additional CSS classes
 */
const TestTimer = memo(function TestTimer({ timeRemaining, onTimeUp, isActive = true, className }) {
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    // Warning at 10 minutes
    setIsWarning(timeRemaining <= 600 && timeRemaining > 120);
    // Critical at 2 minutes
    setIsCritical(timeRemaining <= 120);

    // Trigger callback when time is up
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimeColor = () => {
    if (isCritical) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-amber-600 dark:text-amber-400';
    return 'text-foreground';
  };

  const getBgColor = () => {
    if (isCritical) return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    if (isWarning) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    return 'bg-card border-border';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300',
        getBgColor(),
        isCritical && 'animate-pulse',
        className
      )}
      data-oid="ixa8a_w"
    >
      {isCritical ? (
        <AlertTriangle className={cn('w-5 h-5', getTimeColor())} data-oid="5f7lu.j" />
      ) : (
        <Clock className={cn('w-5 h-5', getTimeColor())} data-oid="2rso9iy" />
      )}
      <span
        className={cn('font-mono text-lg font-bold tabular-nums', getTimeColor())}
        data-oid="0ln0i9s"
      >
        {formatTime(timeRemaining)}
      </span>
      {isCritical && (
        <span className="text-xs text-red-600 dark:text-red-400 font-medium" data-oid="btnfokf">
          Time running out!
        </span>
      )}
    </div>
  );
});

export default TestTimer;
