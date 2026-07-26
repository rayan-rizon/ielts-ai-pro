import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Check,
  Share2,
  Users,
  Calendar,
  PenLine,
  Mic,
  Trophy,
  Sparkles,
  Copy,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUserReferrals, useReferralTiers } from '../hooks/useUserReferrals';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="w-full space-y-6"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full"
          >
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 h-[20rem]">
              <Skeleton className="h-10 w-10 rounded-xl mb-4" />
              <Skeleton className="h-7 w-40 mb-6" />
              <Skeleton className="h-12 w-full rounded-xl mb-4" />
              <Skeleton className="h-10 w-full rounded-xl mt-auto" />
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 h-[20rem] flex flex-col justify-between">
              <Skeleton className="h-8 w-44 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <Skeleton className="h-8 w-full mt-4" />
            </div>

            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6">
              <Skeleton className="h-7 w-56 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch"
          >
            {/* Left Hero Box: Invite & Earn (6 cols) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl sm:rounded-3xl p-6 shadow-lg shadow-indigo-500/20 border border-indigo-500/30 text-white flex flex-col justify-between space-y-5 relative overflow-hidden h-full"
            >
              {/* Card Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Invite & Earn Rewards
                    </h3>
                    <p className="text-sm text-indigo-100/80 font-medium">
                      Invite friends to join IELTS Mastery Pro and unlock bonus access.
                    </p>
                  </div>
                </div>

                {/* Code Box */}
                <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/15 flex items-center justify-between gap-3 group">
                  <div className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white truncate px-1">
                    {stats?.referral_code || '...'}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      'h-9 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md text-xs border-0 shrink-0',
                      copied
                        ? 'bg-emerald-500 text-white scale-105'
                        : 'bg-white text-indigo-700 hover:bg-indigo-50'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1.5" /> Copy Code
                      </>
                    )}
                  </Button>
                </div>

                {/* 3 Step Timeline */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { step: '1', label: 'Share Link' },
                    { step: '2', label: 'Friend Joins' },
                    { step: '3', label: 'Earn Rewards' },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 flex items-center gap-2 border border-white/10"
                    >
                      <span className="w-5 h-5 rounded-lg bg-white/20 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <span className="text-xs font-semibold text-white/90 truncate">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  onClick={handleShare}
                  className="w-full h-11 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold shadow-md active:scale-95 transition-all text-sm border-0"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share Referral Link
                </Button>
              </div>
            </motion.div>

            {/* Right Box: Referral Status & Stats (6 cols) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-between space-y-5 h-full"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Referral Status
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Your current referral progress & earned credits.
                    </p>
                  </div>
                </div>

                {hasUnclaimedRewards && (
                  <Button
                    size="sm"
                    onClick={handleClaimRewards}
                    disabled={isClaiming}
                    className="h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md active:scale-95 transition-all text-xs border-0"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 animate-spin" /> Claim Reward
                  </Button>
                )}
              </div>

              {/* 2 Stat Cards */}
              <div className="grid grid-cols-2 gap-4 my-auto">
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-center space-y-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
                    {stats?.referral_count || 0}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Successful Invites
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-500/20 text-center space-y-1">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 block">
                    {stats?.bonus_writing_credits || 0}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Bonus Credits
                  </span>
                </div>
              </div>

              {/* Progress Bar for Next Tier */}
              {stats?.next_tier && (
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Next Reward:{' '}
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        +{stats.next_tier.extra_days} Days AI Access
                      </span>
                    </span>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-0 text-xs px-2 py-0.5">
                      {stats.referral_count} / {stats.next_tier.referrals_required}
                    </Badge>
                  </div>

                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((stats.referral_count / stats.next_tier.referrals_required) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Milestones & Rewards Section (Full Width) */}
            {tiers && tiers.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-5"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Milestones & Rewards
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Unlock extra AI practice time and evaluation credits as your friends sign up.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {tiers.map((tier) => {
                    const claimed = stats?.claimed_rewards?.some(
                      (r) => r.referrals_required === tier.referrals_required
                    );
                    const canClaim = stats?.referral_count >= tier.referrals_required && !claimed;

                    return (
                      <motion.div
                        key={tier.id}
                        variants={itemVariants}
                        className={cn(
                          'rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 h-full',
                          claimed
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : canClaim
                              ? 'bg-amber-500/5 border-amber-500/40 shadow-md ring-2 ring-amber-500/20'
                              : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        )}
                      >
                        {/* Tier Header */}
                        <div className="flex justify-between items-center">
                          <Badge
                            className={cn(
                              'font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider border-0',
                              claimed
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : canClaim
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {tier.referrals_required}{' '}
                            {tier.referrals_required === 1 ? 'Friend' : 'Friends'}
                          </Badge>

                          {claimed && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-4 h-4" /> Claimed
                            </span>
                          )}
                          {canClaim && (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                              <Sparkles className="w-4 h-4" /> Unlocked
                            </span>
                          )}
                          {!claimed && !canClaim && (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                              <Lock className="w-3.5 h-3.5" /> Locked
                            </span>
                          )}
                        </div>

                        {/* Reward Highlights */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                              +{tier.extra_days} Days AI Access
                            </span>
                          </div>

                          <div className="space-y-1.5 pl-12">
                            {tier.writing_credits > 0 && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <PenLine className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>+{tier.writing_credits} Writing Evaluations</span>
                              </div>
                            )}
                            {tier.speaking_credits > 0 && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <Mic className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>+{tier.speaking_credits} Speaking Evaluations</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
