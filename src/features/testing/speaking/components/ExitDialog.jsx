import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
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

const ExitDialog = React.memo(({ open, onOpenChange, blocker, isExitingRef, onBeforeExit }) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleExit = async () => {
    if (isSaving) return;
    const target = blocker.location;
    setIsSaving(true);
    try {
      await onBeforeExit?.();
    } finally {
      isExitingRef.current = true;
      onOpenChange(false);
      setIsSaving(false);
    }

    if (blocker.state === 'blocked') {
      blocker.reset();
      setTimeout(() => navigate(target), 0);
    } else {
      navigate('/speaking');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center justify-center sm:justify-start gap-2 text-xl font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Exit Test?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Your progress will be saved. You can resume this test later from the Speaking Library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => {
              onOpenChange(false);
              blocker.reset?.();
            }}
            className="w-full sm:w-auto rounded-xl border-[#e4e2f0] dark:border-white/10 hover:bg-[#f4f3fb] dark:hover:bg-white/[0.06] transition-colors duration-200 px-6 font-semibold"
          >
            Continue Test
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleExit}
            disabled={isSaving}
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 border-none px-8 rounded-xl hover:scale-105 active:scale-95 transition-colors duration-200 font-bold"
          >
            {isSaving ? 'Saving…' : 'Save & Exit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

ExitDialog.displayName = 'ExitDialog';
export default ExitDialog;
