import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const UpgradeDialog = React.memo(({ open, onOpenChange, authUser, isExitingRef }) => {
  const navigate = useNavigate();
  const tier = (authUser?.subscription_tier || 'free').toLowerCase();
  const isPremiumOrAdmin = tier === 'premium' || tier === 'admin';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(PANEL, 'max-w-md overflow-hidden p-0')}>
        <div className="relative overflow-hidden bg-slate-900 px-8 pb-8 pt-10 text-center">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/8">
            <Mic className="h-8 w-8 text-white" />
          </div>

          <div className="relative space-y-2 z-10">
            <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-white">
              Speaking Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rose-200 text-sm font-medium px-4 leading-relaxed">
              {isPremiumOrAdmin ? (
                "You've reached your speaking evaluation limit for this period. Your limit will reset next month."
              ) : (
                <>
                  You've used all your speaking evaluations for this period. Upgrade to unlock{' '}
                  <b>more evaluations</b> and keep improving.
                </>
              )}
            </AlertDialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-white dark:bg-slate-950">
          <div className="grid grid-cols-1 gap-4">
            {[
              'AI-Powered Band Score (0-9)',
              'Fluency & Pronunciation Analysis',
              'Detailed Examiner Feedback',
              'Personalized Improvement Tips',
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 transition-colors group-hover:scale-110 duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {feature}
              </div>
            ))}
          </div>

          <AlertDialogFooter className="flex-col gap-3 pt-2">
            {!isPremiumOrAdmin && (
              <Button
                onClick={() => {
                  isExitingRef.current = true;
                  navigate('/pricing');
                }}
                className="h-12 w-full rounded-xl bg-[#5a63df] font-bold text-white transition-colors hover:bg-[#4a52c9] active:scale-[0.99]"
              >
                {tier === 'pro' ? 'Upgrade to Premium' : 'Upgrade to Pro'}
              </Button>
            )}
            <AlertDialogCancel className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-0">
              {isPremiumOrAdmin ? 'Got It' : 'Maybe Later'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
});

UpgradeDialog.displayName = 'UpgradeDialog';
export default UpgradeDialog;
