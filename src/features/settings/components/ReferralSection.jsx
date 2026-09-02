import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Check,
  Share2,
  Calendar,
  PenLine,
  Mic,
  Trophy,
  Sparkles,
  Copy,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUserReferrals, useReferralTiers } from '../hooks/useUserReferrals';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Bar,
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

const STAGGER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const FADE_UP = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.25 } },
};

const STEPS = [
  { step: '1', label: 'Share link' },
  { step: '2', label: 'Friend joins' },
  { step: '3', label: 'Earn rewards' },
];

export default function ReferralSection() {
  const { data: stats, isLoading, claimRewards, isClaiming } = useUserReferrals();
  const { data: tiers } = useReferralTiers();
  const [copied, setCopied] = useState(false);

  const referralLink = stats?.referral_code
    ? `${window.location.origin}/signup?ref=${stats.referral_code}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join IELTS Mastery Pro',
          text: 'Practice IELTS with AI-powered feedback. Unlock premium features with my link!',
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleClaimRewards = () => {
    claimRewards(undefined, {
      onSuccess: (data) => {
        if (data?.success) {
          toast.success('Rewards claimed successfully!', {
            description: `+${data.days_granted} Days AI Access, +${data.writing_credits_granted} Writing, +${data.speaking_credits_granted} Speaking`,
          });
        } else {
          toast.error(data?.error || 'No pending rewards to claim');
        }
      },
      onError: (error) => {
        toast.error('Failed to claim rewards', { description: error.message });
      },
    });
  };

  const hasUnclaimedRewards =
    stats?.next_tier && stats?.referral_count >= stats?.next_tier?.referrals_required;

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="w-full space-y-3"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2"
          >
            <div className={cn(PANEL, 'h-68 p-4 sm:p-5')}>
              <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
              <Skeleton className="mb-4 h-6 w-40 rounded" />
              <Skeleton className="mb-4 h-10 w-full rounded-lg" />
              <Skeleton className="mt-auto h-9 w-full rounded-lg" />
            </div>
            <div className={cn(PANEL, 'flex h-68 flex-col justify-between p-4 sm:p-5')}>
              <Skeleton className="mb-4 h-6 w-36 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
              <Skeleton className="mt-4 h-7 w-full rounded" />
            </div>
            <div className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-2')}>
              <Skeleton className="mb-4 h-6 w-48 rounded" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          </m.div>
        ) : (
          <m.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid w-full grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch"
          >
            <m.div
              variants={STAGGER}
              initial="hidden"
              animate="visible"
              className={cn(PANEL, 'flex h-full flex-col justify-between p-4 sm:p-5 lg:col-span-6')}
            >
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <IconChip icon={Gift} size="lg" />
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Invite &amp; earn rewards
                    </h3>
                    <p className={cn('text-xs font-medium', MUTED)}>
                      Invite friends to unlock bonus AI access.
                    </p>
                  </div>
                </div>

                <div className={cn(TILE, 'flex items-center justify-between gap-3 p-3')}>
                  <span className="truncate px-1 font-mono text-lg font-extrabold tracking-widest text-slate-900 dark:text-white">
                    {stats?.referral_code || '...'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all active:scale-95',
                      copied ? 'bg-[rgb(var(--signal-ok))] text-white' : 'bg-[#5a63df] text-white'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy code
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {STEPS.map((s) => (
                    <div key={s.step} className={cn(TILE, 'flex items-center gap-2 p-2.5')}>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-[10px] font-extrabold text-[#5a63df]">
                        {s.step}
                      </span>
                      <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5a63df] text-sm font-bold text-white transition-all active:scale-95"
              >
                <Share2 className="h-4 w-4" /> Share referral link
              </button>
            </m.div>

            <m.div
              variants={STAGGER}
              initial="hidden"
              animate="visible"
              className={cn(PANEL, 'flex h-full flex-col justify-between p-4 sm:p-5 lg:col-span-6')}
            >
              <div className="flex items-center justify-between border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
                <PanelTitle label="Referral status" accent className="mb-0" />
                {hasUnclaimedRewards && (
                  <button
                    type="button"
                    onClick={handleClaimRewards}
                    disabled={isClaiming}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Claim
                  </button>
                )}
              </div>

              <div className="my-4 grid grid-cols-2 gap-2.5">
                <div className={cn(TILE, 'p-3.5 text-center')}>
                  <span className="block text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                    {stats?.referral_count || 0}
                  </span>
                  <span className={cn(MICRO, MUTED)}>Successful invites</span>
                </div>
                <div className={cn(TILE, 'border-[#5a63df]/25 bg-[#5a63df]/5 p-3.5 text-center')}>
                  <span className="block text-2xl font-black tabular-nums text-[#5a63df]">
                    {stats?.bonus_writing_credits || 0}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a63df]">
                    Bonus credits
                  </span>
                </div>
              </div>

              {stats?.next_tier && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={MUTED}>
                      Next reward:{' '}
                      <span className="font-bold text-[#5a63df]">
                        +{stats.next_tier.extra_days} days AI access
                      </span>
                    </span>
                    <Pill tone="neutral">
                      {stats.referral_count} / {stats.next_tier.referrals_required}
                    </Pill>
                  </div>
                  <Bar value={(stats.referral_count / stats.next_tier.referrals_required) * 100} />
                </div>
              )}
            </m.div>

            {tiers && tiers.length > 0 && (
              <m.div
                variants={STAGGER}
                initial="hidden"
                animate="visible"
                className={cn(PANEL, 'p-4 sm:p-5 lg:col-span-12')}
              >
                <div className="flex items-center gap-3 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
                  <IconChip icon={Trophy} tone="amber" />
                  <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Milestones &amp; rewards
                    </h3>
                    <p className={cn('text-xs font-medium', MUTED)}>
                      Unlock extra AI practice time and evaluation credits as your friends sign up.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.map((tier) => {
                    const claimed = stats?.claimed_rewards?.some(
                      (r) => r.referrals_required === tier.referrals_required
                    );
                    const canClaim = stats?.referral_count >= tier.referrals_required && !claimed;

                    return (
                      <m.div
                        key={tier.id}
                        variants={FADE_UP}
                        className={cn(
                          TILE,
                          'flex h-full flex-col justify-between gap-3 p-4',
                          claimed &&
                            'border-[rgba(var(--signal-ok),0.3)] bg-[rgba(var(--signal-ok),0.05)]',
                          canClaim && 'border-amber-400/50 bg-amber-50/50 dark:bg-amber-500/6'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Pill tone={claimed ? 'ok' : canClaim ? 'amber' : 'neutral'}>
                            {tier.referrals_required}{' '}
                            {tier.referrals_required === 1 ? 'friend' : 'friends'}
                          </Pill>

                          {claimed && (
                            <span className="flex items-center gap-1 text-xs font-bold text-[rgb(var(--signal-ok))]">
                              <Check className="h-3.5 w-3.5" /> Claimed
                            </span>
                          )}
                          {canClaim && (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <Sparkles className="h-3.5 w-3.5" /> Unlocked
                            </span>
                          )}
                          {!claimed && !canClaim && (
                            <span
                              className={cn('flex items-center gap-1 text-xs font-medium', MUTED)}
                            >
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <IconChip icon={Calendar} size="sm" />
                            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                              +{tier.extra_days} days AI access
                            </span>
                          </div>
                          <div className="space-y-1 pl-[26px]">
                            {tier.writing_credits > 0 && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <PenLine className="h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
                                <span>+{tier.writing_credits} writing evaluations</span>
                              </div>
                            )}
                            {tier.speaking_credits > 0 && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <Mic className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]" />
                                <span>+{tier.speaking_credits} speaking evaluations</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              </m.div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
