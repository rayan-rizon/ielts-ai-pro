import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <AlertDialogContent className="max-w-md bg-white dark:bg-slate-950 border-none shadow-2xl p-0 overflow-hidden rounded-3xl ring-1 ring-slate-900/5">
        <div className="relative pt-10 pb-8 px-8 text-center bg-slate-900 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/30 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/30 blur-[80px] rounded-full" />

          <div className="relative w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto shadow-2xl ring-1 ring-white/20 mb-6">
            <Mic className="w-10 h-10 text-white drop-shadow-md" />
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
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white h-14 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 dark:shadow-rose-500/20 transition-colors duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
