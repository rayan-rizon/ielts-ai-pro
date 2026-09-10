import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timer, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  Pill,
  MUTED,
  NUM,
  MICRO,
  PANEL,
} from '@/features/dashboard/components/primitives';

/**
 * Compact "Time's Up" dialog for timed IELTS test modules (Reading, Listening, Writing).
 * Strictly adheres to the Learner Panel Design System and UI polish rules:
 * - High density, low height instrument panel layout
 * - Inline header with amber Timer IconChip, title, and Time Expired Pill
 * - Single-strip auto-save & metric indicator
 * - 36px (h-9) tactile buttons with brand accent (#5a63df) primary action
 * - Optional customFooter for module-specific actions (e.g. AI feedback vs submit)
 */
function TimeUpMetricsStrip({ statusText, answeredCount, totalQuestions }) {
  const hasQuestionMetrics = typeof totalQuestions === 'number' && totalQuestions > 0;
  const answeredDisplay = answeredCount !== undefined ? answeredCount : '—';

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e4e2f0] bg-[#f7f6fd] px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium min-w-0">
        <CheckCircle2 className="h-3.5 w-3.5 text-[rgb(var(--signal-ok))] shrink-0" />
        <span className="truncate">{statusText}</span>
      </div>

      {hasQuestionMetrics && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span className={MICRO}>Recorded</span>
          <span className={cn(NUM, 'font-semibold text-slate-800 dark:text-slate-100')}>
            {answeredDisplay} / {totalQuestions}
          </span>
        </div>
      )}
    </div>
  );
}

function TimeUpDefaultFooter({ onCancel, onConfirm, isSubmitting, cancelLabel, confirmLabel }) {
  return (
    <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0">
      <AlertDialogCancel
        onClick={onCancel}
        disabled={isSubmitting}
        className="h-9 w-full rounded-md border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 text-xs font-semibold text-slate-700 shadow-none transition-all hover:bg-[#f4f3fb] hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9 dark:focus-visible:ring-offset-[#131315] sm:w-auto cursor-pointer"
      >
        {cancelLabel}
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={onConfirm}
        disabled={isSubmitting}
        className="h-9 w-full rounded-md border-0 bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4d55c7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315] disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Evaluating…</span>
          </>
        ) : (
          <>
            <span>{confirmLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  );
}

/**
 * Compact "Time's Up" dialog for timed IELTS test modules (Reading, Listening, Writing).
 * Strictly adheres to the Learner Panel Design System and UI polish rules:
 * - High density, low height instrument panel layout
 * - Inline header with amber Timer IconChip, title, and Time Expired Pill
 * - Single-strip auto-save & metric indicator
 * - 36px (h-9) tactile buttons with brand accent (#5a63df) primary action
 * - Optional customFooter for module-specific actions (e.g. AI feedback vs submit)
 */
const TimeUpDialog = memo(function TimeUpDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isSubmitting = false,
  answeredCount,
  totalQuestions,
  title = "Time's Up",
  description = 'Time is up. You can check your answers now, or come back to them later.',
  statusText = 'Responses auto-saved',
  badgeLabel = 'Time Expired',
  confirmLabel = 'Check answers',
  cancelLabel = 'Cancel',
  customFooter = null,
  className = '',
}) {
  const handleConfirm = (e) => {
    e?.preventDefault();
    onConfirm?.();
  };

  const handleCancel = (e) => {
    e?.preventDefault();
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          PANEL,
          'max-w-[400px] gap-3 p-4 sm:p-4.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] rounded-xl',
          className
        )}
      >
        <AlertDialogHeader className="space-y-1.5 text-left">
          {/* Top row: Alert chip + Title + Status Pill in a single line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconChip icon={Timer} tone="amber" size="sm" />
              <AlertDialogTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </AlertDialogTitle>
            </div>
            <Pill
              tone="amber"
              className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase shrink-0"
            >
              {badgeLabel}
            </Pill>
          </div>

          <AlertDialogDescription className={cn('text-xs leading-relaxed', MUTED)}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Compact Reassurance & Session Instrument Strip */}
        <TimeUpMetricsStrip
          statusText={statusText}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
        />

        {/* Actions Footer */}
        {customFooter || (
          <TimeUpDefaultFooter
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
            cancelLabel={cancelLabel}
            confirmLabel={confirmLabel}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
});

TimeUpDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool,
  answeredCount: PropTypes.number,
  totalQuestions: PropTypes.number,
  title: PropTypes.string,
  description: PropTypes.string,
  statusText: PropTypes.string,
  badgeLabel: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  customFooter: PropTypes.node,
  className: PropTypes.string,
};

export default TimeUpDialog;
