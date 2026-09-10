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
import { AlertTriangle, CheckCircle2, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, Pill, MUTED, MICRO, PANEL } from '@/features/dashboard/components/primitives';

/**
 * Shared confirmation dialog for exiting active test sessions (Writing, Speaking, Reading, Listening).
 * Built strictly according to the Learner Panel Design System and UI polish rules:
 * - Compact, high-density instrument-panel layout with hairline rules and zero legacy glassmorphism
 * - Header with amber AlertTriangle IconChip, crisp title, and status Pill
 * - Inset reassurance instrument strip with signal-ok CheckCircle2 confirming progress is preserved
 * - Concentric radii (rounded-xl shell, rounded-lg strip, rounded-md tactile buttons)
 * - Tactile active press scale (0.98), brand indigo focus rings (#5a63df), and refined destructive Exit action
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {Function} props.onConfirm - Callback when user confirms exit
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {string} props.title - Dialog title
 * @param {string} props.description - Dialog description
 * @param {string} props.confirmLabel - Label for confirm/exit button
 * @param {string} props.confirmingLabel - Label when confirming/saving
 * @param {string} props.cancelLabel - Label for cancel/stay button
 * @param {string} props.badgeLabel - Status pill label
 * @param {boolean} props.isConfirming - Whether save/exit is currently in flight
 * @param {string} props.className - Additional class names
 */
const ConfirmExitDialog = memo(function ConfirmExitDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Exit Test?',
  description = 'Your progress will be saved. You can resume this test later from your dashboard.',
  confirmLabel = 'Exit',
  confirmingLabel = 'Saving…',
  cancelLabel = 'Continue Test',
  badgeLabel = 'Active Test',
  isConfirming = false,
  className = '',
}) {
  const handleConfirm = (e) => {
    e?.preventDefault();
    onConfirm?.();
    if (!isConfirming) {
      onOpenChange?.(false);
    }
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
          'max-w-[400px] gap-3 p-4 sm:p-4.5 border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] rounded-xl shadow-lg shadow-black/5 dark:shadow-2xl dark:shadow-black/40',
          className
        )}
      >
        <AlertDialogHeader className="space-y-1 text-left">
          {/* Top row: Alert chip + Title + Status Pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconChip icon={AlertTriangle} tone="amber" size="sm" />
              <AlertDialogTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </AlertDialogTitle>
            </div>
            {badgeLabel && (
              <Pill
                tone="amber"
                className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase shrink-0"
              >
                {badgeLabel}
              </Pill>
            )}
          </div>
        </AlertDialogHeader>

        {/* Reassurance Instrument Strip */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[#e4e2f0] bg-[#f7f6fd] p-2.5 sm:p-3 text-xs dark:border-white/[0.07] dark:bg-white/[0.03]">
          <div className="mt-0.5 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[rgb(var(--signal-ok))]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className={cn(MICRO, 'text-slate-600 dark:text-slate-300 font-semibold')}>
              Progress Preserved
            </p>
            <AlertDialogDescription className={cn('text-xs font-normal leading-relaxed', MUTED)}>
              {description}
            </AlertDialogDescription>
          </div>
        </div>

        {/* Actions Footer */}
        <AlertDialogFooter className="gap-2 pt-0.5 sm:justify-end sm:space-x-0">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isConfirming}
            className="h-9 w-full rounded-md border border-[#e4e2f0] bg-[#fbfbfe] px-3.5 text-xs font-semibold text-slate-700 shadow-none transition-all hover:bg-[#f4f3fb] hover:text-slate-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/11 dark:bg-white/5.5 dark:text-slate-200 dark:hover:bg-white/9 dark:focus-visible:ring-offset-[#131315] sm:w-auto cursor-pointer"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirming}
            className="h-9 w-full rounded-md border border-rose-500/30 bg-rose-600 px-3.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:border-rose-400/30 dark:bg-rose-600 dark:hover:bg-rose-500 sm:w-auto cursor-pointer flex items-center justify-center gap-1.5 disabled:pointer-events-none disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>{confirmingLabel}</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                <span>{confirmLabel}</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

ConfirmExitDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  confirmingLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  badgeLabel: PropTypes.string,
  isConfirming: PropTypes.bool,
  className: PropTypes.string,
};

export default ConfirmExitDialog;
