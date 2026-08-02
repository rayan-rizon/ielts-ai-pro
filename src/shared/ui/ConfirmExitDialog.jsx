import { memo } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL } from '@/features/dashboard/components/primitives';

/**
 * Shared confirmation dialog for exiting tests.
 * Warns users about losing progress when navigating away.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Callback when open state changes
 * @param {Function} props.onConfirm - Callback when user confirms exit
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {string} props.title - Dialog title
 * @param {string} props.description - Dialog description
 */
const ConfirmExitDialog = memo(function ConfirmExitDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Exit Test?',
  description = 'Your progress will be saved, but the timer will continue. Are you sure you want to leave?',
  confirmLabel = 'Exit',
  confirmingLabel = 'Saving…',
  isConfirming = false,
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} data-oid="8hmt4j5">
      <AlertDialogContent
        className={cn(PANEL, 'max-w-md gap-4 p-4 shadow-xl sm:p-5')}
        data-oid="domudzj"
      >
        <AlertDialogHeader data-oid="n5wn28f">
          <div className="flex items-center gap-2.5" data-oid="a4iwy3u">
            <IconChip icon={AlertTriangle} tone="amber" size="sm" data-oid="pmupejb" />
            <AlertDialogTitle
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl"
              data-oid=":p:j7l3"
            >
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription
            className={cn('mt-0.5 text-left text-sm leading-relaxed', MUTED)}
            data-oid=".hqje.j"
          >
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-end sm:space-x-0" data-oid="lw6291v">
          <AlertDialogCancel
            onClick={handleCancel}
            className="h-10 w-full rounded-lg border-[#e4e2f0] bg-[#fbfbfe] px-4 text-sm font-semibold text-slate-700 shadow-none transition-colors hover:bg-[#f4f3fb] dark:border-white/[0.11] dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.09] sm:w-auto"
            data-oid=".1y4tu2"
          >
            Continue Test
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirming}
            className="h-10 w-full rounded-lg border-0 bg-rose-600 px-4 text-sm font-bold text-white shadow-sm shadow-rose-600/20 transition-colors hover:bg-rose-700 active:scale-[0.99] dark:bg-rose-500 dark:hover:bg-rose-400 sm:w-auto"
            data-oid="kqyb333"
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

export default ConfirmExitDialog;
