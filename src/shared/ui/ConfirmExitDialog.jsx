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
  title = 'Leave this test?',
  description = 'Your progress will be saved, but the timer will continue. Are you sure you want to leave?',
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
      <AlertDialogContent className="max-w-md" data-oid="domudzj">
        <AlertDialogHeader data-oid="n5wn28f">
          <div className="flex items-center gap-3" data-oid="a4iwy3u">
            <div
              className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center"
              data-oid="pmupejb"
            >
              <AlertTriangle
                className="w-6 h-6 text-amber-600 dark:text-amber-400"
                data-oid="-p1t6-:"
              />
            </div>
            <div data-oid="br3-.03">
              <AlertDialogTitle className="text-lg" data-oid=":p:j7l3">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-4 text-muted-foreground" data-oid=".hqje.j">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6" data-oid="lw6291v">
          <AlertDialogCancel onClick={handleCancel} data-oid=".1y4tu2">
            Continue Test
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
            data-oid="kqyb333"
          >
            Leave Test
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

export default ConfirmExitDialog;
