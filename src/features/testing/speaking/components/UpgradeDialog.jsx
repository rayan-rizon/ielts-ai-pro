import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Award, AudioWaveform, FileText, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconChip, MICRO, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SPEAKING_UPGRADE_FEATURES = [
  {
    icon: Award,
    tone: 'accent',
    title: 'AI Band Score (0–9)',
    desc: 'Instant overall and criterion band estimation',
  },
  {
    icon: AudioWaveform,
    tone: 'sky',
    title: 'Fluency & Pronunciation',
    desc: 'Pacing, pause frequency, and phoneme accuracy',
  },
  {
    icon: FileText,
    tone: 'emerald',
    title: 'Examiner Criterion Breakdown',
    desc: 'Lexical resource, grammatical range, and coherence',
  },
  {
    icon: Sparkles,
    tone: 'amber',
    title: 'Targeted Coaching Tips',
    desc: 'Customized recommendations to lift your speaking band',
  },
];

const UpgradeDialog = React.memo(({ open, onOpenChange, authUser, isExitingRef }) => {
  const navigate = useNavigate();
  const tier = (authUser?.subscription_tier || 'free').toLowerCase();
  const isPremiumOrAdmin = tier === 'premium' || tier === 'admin';

  const handleUpgrade = () => {
    if (isExitingRef && typeof isExitingRef === 'object' && 'current' in isExitingRef) {
      isExitingRef.current = true;
    }
    navigate(tier === 'pro' ? '/pricing?plan=premium' : '/upgrade?focus=speaking');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          PANEL,
          'max-w-[460px] gap-0 overflow-hidden p-0 rounded-2xl border border-[#e4e2f0] dark:border-white/[0.07] bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] '
        )}
      >
        <div className="relative p-6 sm:p-7 space-y-5">
          {/* Subtle background radial pattern */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[16px_16px] opacity-[0.06] dark:opacity-[0.10]"
          />

          {/* Header Section */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/18 dark:text-[#afb5ff] shadow-xs">
              <Mic className="h-5 w-5" strokeWidth={2.25} />
            </div>

            {/* Quota Status Eyebrow Badge */}
            <div className="mb-2">
              <Pill
                tone="amber"
                className="text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider shrink-0"
              >
                {isPremiumOrAdmin ? 'Monthly Limit' : 'Allowance Used'}
              </Pill>
            </div>

            <AlertDialogHeader className="space-y-2 text-center sm:text-center w-full">
              <AlertDialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 text-center w-full">
                Keep your Speaking feedback going
              </AlertDialogTitle>
              <AlertDialogDescription
                className={cn(
                  'mx-auto max-w-[360px] text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300'
                )}
              >
                {isPremiumOrAdmin ? (
                  "You've reached your speaking evaluation limit for this period. Your limit will reset on your next billing cycle."
                ) : (
                  <>
                    You&apos;ve used all your speaking evaluations for this period. Upgrade to
                    unlock{' '}
                    <b className="font-semibold text-slate-800 dark:text-slate-100">
                      more evaluations
                    </b>{' '}
                    and continue practice.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          {/* Grouped Feature Spec Panel with Hairline Dividers */}
          <div className="relative z-10 rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] overflow-hidden bg-[#fbfbfe] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between border-b border-[#eeedf7] bg-[#f4f3fb] px-4 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
              <span className={cn(MICRO, MUTED)}>INCLUDED WITH PLAN</span>
              <span className={cn(MICRO, 'font-bold text-[#5a63df] dark:text-[#afb5ff]')}>
                AI SPEAKING FEEDBACK
              </span>
            </div>

            <div className="divide-y divide-[#eeedf7] dark:divide-white/[0.07]">
              {SPEAKING_UPGRADE_FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-[#f7f6fd] dark:hover:bg-white/[0.04]"
                >
                  <IconChip icon={item.icon} tone={item.tone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                      {item.title}
                    </p>
                    <p
                      className={cn(
                        MICRO,
                        MUTED,
                        'mt-0.5 normal-case leading-snug tracking-normal'
                      )}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <Check
                    className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-[#8f97ff]"
                    strokeWidth={2.5}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col gap-2.5 pt-1">
            {!isPremiumOrAdmin && (
              <Button
                onClick={handleUpgrade}
                className="h-11 w-full rounded-xl bg-[#5a63df] px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#4a52c9] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{tier === 'pro' ? 'Upgrade to Premium' : 'Upgrade to Pro'}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 w-full rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors active:scale-[0.98] cursor-pointer"
            >
              {isPremiumOrAdmin ? 'Got It' : 'Continue with free practice'}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
});

UpgradeDialog.displayName = 'UpgradeDialog';

UpgradeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  authUser: PropTypes.object,
  isExitingRef: PropTypes.object,
};

export default UpgradeDialog;
