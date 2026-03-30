import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Share2, Users, Calendar, PenLine, Mic, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
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
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
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
          toast.success('Rewards claimed!', {
            description: `+${data.days_granted} days, +${data.writing_credits_granted} writing, +${data.speaking_credits_granted} speaking`,
          });
        } else {
          toast.error(data?.error || 'No rewards to claim');
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full"
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
            <div className="glass-card-premium rounded-[2.5rem] p-6 lg:p-7 h-[22rem]">
              <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
              <Skeleton className="h-8 w-48 mb-6" />
              <Skeleton className="h-14 w-full rounded-2xl mb-6" />
              <Skeleton className="h-12 w-full rounded-2xl mt-auto" />
            </div>

            <div className="glass-card-premium rounded-[2.5rem] p-6 lg:p-7 h-[22rem] flex flex-col justify-between">
              <Skeleton className="h-10 w-48 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-[1.5rem]" />
                <Skeleton className="h-32 rounded-[1.5rem]" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </div>

            <div className="lg:col-span-2 glass-card-premium rounded-[2.5rem] p-7 lg:p-8">
              <Skeleton className="h-8 w-64 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Skeleton className="h-32 rounded-[2rem]" />
                <Skeleton className="h-32 rounded-[2rem]" />
                <Skeleton className="h-32 rounded-[2rem]" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full"
          >
            {/* Share Card - Main Hero */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass-card-premium rounded-[2.5rem] p-6 lg:p-7 flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 dark:from-indigo-950/60 dark:to-violet-950/60 border-indigo-400/40 dark:border-indigo-500/20 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)]"
              data-oid="7ko1a73"
            >
              <div className="space-y-5" data-oid="7i:yx06">
                <div className="flex items-center gap-4" data-oid="4h:byw1">
                  <div
                    className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20"
                    data-oid=":1hcuk8"
                  >
                    <Gift className="w-6 h-6 text-white" data-oid="7tj03oy" />
                  </div>
                  <div data-oid="s6xsa49">
                    <h3
                      className="text-xl lg:text-2xl font-black tracking-tight text-white leading-tight"
                      data-oid="8td:cc_"
                    >
                      Invite & Earn
                    </h3>
                    <p className="text-white/70 font-bold text-xs" data-oid="neuluwf">
                      Invite friends and unlock premium rewards.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4 group transition-all hover:bg-black/30"
                  data-oid="yfam51c"
                >
                  <div
                    className="font-mono text-lg lg:text-xl font-black tracking-widest text-white truncate px-1"
                    data-oid="x8b5d6f"
                  >
                    {stats?.referral_code || '...'}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      'h-9 px-4 rounded-xl transition-all duration-500 shadow-xl font-black uppercase tracking-wider text-[10px]',
                      copied
                        ? 'bg-emerald-500 text-white scale-105'
                        : 'bg-white text-indigo-700 hover:bg-indigo-50'
                    )}
                    data-oid="6rc.c9y"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="flex justify-between items-center px-2 py-1" data-oid="z9zi.7e">
                  {[{ label: 'Share' }, { label: 'Join' }, { label: 'Earn' }].map((step, i) => (
                    <div key={i} className="flex items-center gap-2" data-oid="2p2_92r">
                      <div
                        className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[9px] font-black border border-white/10"
                        data-oid="re0i9bp"
                      >
                        {i + 1}
                      </div>
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.05em] text-white/50"
                        data-oid=".6tw1eg"
                      >
                        {step.label}
                      </span>
                      {i < 2 && (
                        <div className="w-4 lg:w-8 h-[1px] bg-white/10 ml-1" data-oid="w789xst" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3" data-oid="w1__upt">
                <Button
                  onClick={handleShare}
                  className="flex-1 h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black border border-white/10 shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
                  data-oid="o.g1_ve"
                >
                  <Share2 className="w-4 h-4 mr-2" data-oid="up8.q6j" />
                  Send Invite
                </Button>
              </div>
            </motion.div>

            {/* Stats & Rewards Overview */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="glass-card-premium rounded-[2.5rem] p-6 lg:p-7 flex flex-col gap-6 bg-white/50 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-white/10 shadow-xl shadow-black/[0.02]"
              data-oid="042re75"
            >
              <div className="flex items-start justify-between" data-oid="sswq9qc">
                <div className="flex items-center gap-3" data-oid="aao7gk-">
                  <div
                    className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary border border-primary/5"
                    data-oid="l_auona"
                  >
                    <Users className="w-5 h-5" data-oid="3ak.1kx" />
                  </div>
                  <div data-oid="fnid7y7">
                    <h3
                      className="text-lg font-black text-foreground tracking-tight"
                      data-oid="17txyvf"
                    >
                      Referral Status
                    </h3>
                    <p
                      className="text-[10px] text-muted-foreground font-black uppercase tracking-widest"
                      data-oid="_x1d_im"
                    >
                      Your progress & earnings
                    </p>
                  </div>
                </div>
                {hasUnclaimedRewards && (
                  <Button
                    size="sm"
                    onClick={handleClaimRewards}
                    disabled={isClaiming}
                    className="h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black shadow-lg animate-pulse text-[10px] px-4"
                    data-oid="y.sv396"
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" data-oid="7op-rt0" />
                    Claim Reward
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2" data-oid="i8012j:">
                <div
                  className="p-5 rounded-[1.5rem] bg-secondary/10 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-white/5 flex flex-col justify-center items-center text-center group transition-all hover:bg-secondary/20"
                  data-oid="mqa2fn6"
                >
                  <span className="text-4xl font-black text-foreground mb-1" data-oid="r_kwhcu">
                    {stats?.referral_count || 0}
                  </span>
                  <span
                    className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.05em] leading-tight"
                    data-oid="npwrh-_"
                  >
                    Successful
                    <br data-oid="pxtuxqu" />
                    Invites
                  </span>
                </div>
                <div
                  className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 flex flex-col justify-center items-center text-center group transition-all hover:bg-primary/10"
                  data-oid="-su75jo"
                >
                  <div className="flex items-center gap-1.5 mb-1" data-oid="j0_ui1:">
                    <PenLine className="w-5 h-5 text-primary" data-oid="u9t0fbh" />
                    <span className="text-2xl font-black text-primary" data-oid="6-bnvmu">
                      {stats?.bonus_writing_credits || 0}
                    </span>
                  </div>
                  <span
                    className="text-[9px] uppercase font-black text-primary/80 tracking-[0.05em] leading-tight"
                    data-oid="knwit64"
                  >
                    Bonus
                    <br data-oid="-08._p8" />
                    Credits
                  </span>
                </div>
              </div>

              {/* Progress Bar for Next Tier */}
              {stats?.next_tier && (
                <div className="mt-auto pt-2" data-oid="hv6.pad">
                  <div
                    className="flex justify-between text-[10px] font-black mb-3"
                    data-oid="ispqiwo"
                  >
                    <span
                      className="text-muted-foreground uppercase tracking-widest"
                      data-oid="8f2ght:"
                    >
                      Next Reward:{' '}
                      <span className="text-primary" data-oid="6-oiczi">
                        +{stats.next_tier.extra_days} Days AI Access
                      </span>
                    </span>
                    <span
                      className="text-foreground bg-primary/10 px-1.5 py-0.5 rounded font-mono"
                      data-oid="3fzm.oq"
                    >
                      {stats.referral_count} / {stats.next_tier.referrals_required}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-secondary/50 overflow-hidden border border-zinc-200/40 dark:border-white/5 shadow-inner"
                    data-oid="75h817e"
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((stats.referral_count / stats.next_tier.referrals_required) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1.2, ease: 'circOut' }}
                      data-oid="8q8h73t"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Compact Tier List - Full Width */}
            {tiers && tiers.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-2 glass-card-premium rounded-[2.5rem] p-7 lg:p-8 bg-white/40 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-white/10 shadow-xl shadow-black/[0.01]"
                data-oid=".u:cevm"
              >
                <div className="flex items-center gap-3 mb-6" data-oid="dl7_wnc">
                  <div
                    className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"
                    data-oid="2g-zoaa"
                  >
                    <Trophy className="w-5 h-5 text-amber-500" data-oid="122lzor" />
                  </div>
                  <h3
                    className="text-xl font-black text-foreground tracking-tight"
                    data-oid="p:4tt0s"
                  >
                    Milestones & Rewards
                  </h3>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  data-oid="d5ys8f:"
                >
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
                          'relative overflow-hidden p-5 rounded-[2rem] border transition-all duration-500',
                          claimed
                            ? 'bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/20'
                            : canClaim
                              ? 'bg-amber-500/5 border-amber-500/40 dark:border-amber-500/20 shadow-lg scale-[1.01]'
                              : 'bg-white/40 dark:bg-card/40 border-zinc-200 dark:border-white/5 hover:border-primary/30 shadow-sm'
                        )}
                        data-oid="s-rqg56"
                      >
                        <div className="flex justify-between items-start mb-4" data-oid="bv692bg">
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-black px-3 py-1 rounded-lg border text-[10px] transition-colors',
                              claimed
                                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5'
                                : canClaim
                                  ? 'border-amber-500/20 text-amber-600 bg-amber-500/5'
                                  : 'border-zinc-200/80 dark:border-white/10 text-muted-foreground bg-secondary/10'
                            )}
                            data-oid="0fiy56k"
                          >
                            {tier.referrals_required}{' '}
                            {tier.referrals_required === 1 ? 'Friend' : 'Friends'}
                          </Badge>

                          {canClaim && (
                            <div className="flex items-center gap-1.5 pt-1" data-oid="sx6uw1i">
                              <span
                                className="text-[9px] font-black text-amber-600 uppercase tracking-widest animate-pulse"
                                data-oid="lswyv:o"
                              >
                                Ready
                              </span>
                              <div className="relative flex h-2 w-2" data-oid="3:o7qlq">
                                <span
                                  className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                                  data-oid="ltl6e08"
                                ></span>
                                <span
                                  className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"
                                  data-oid="c6jl1za"
                                ></span>
                              </div>
                            </div>
                          )}
                          {claimed && (
                            <div className="p-1 rounded-full bg-emerald-500/10" data-oid="iob3g5.">
                              <Check className="w-3 h-3 text-emerald-500" data-oid="a2etp16" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3" data-oid="4zqjd11">
                          <div
                            className="flex items-center gap-3 text-sm font-black text-foreground"
                            data-oid="rpgo2md"
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center border transition-colors',
                                claimed
                                  ? 'bg-emerald-500/10 border-emerald-500/20'
                                  : 'bg-primary/10 border-primary/20'
                              )}
                              data-oid="yzmkyyo"
                            >
                              <Calendar
                                className={cn(
                                  'w-4 h-4',
                                  claimed ? 'text-emerald-500' : 'text-primary'
                                )}
                                data-oid="d_bg:.:"
                              />
                            </div>
                            <span data-oid="odxbh.1">+{tier.extra_days} Days AI Access</span>
                          </div>
                          <div className="flex flex-col gap-1.5 pl-[2.8rem]" data-oid="0_-bkas">
                            {tier.writing_credits > 0 && (
                              <div
                                className="flex items-center gap-2 text-[11px] font-black text-muted-foreground/80"
                                data-oid="04el7uf"
                              >
                                <PenLine
                                  className="w-3.5 h-3.5 text-indigo-500/60"
                                  data-oid="19y6cdl"
                                />
                                <span data-oid="_w1kpa1">
                                  +{tier.writing_credits} Writing Evaluations
                                </span>
                              </div>
                            )}
                            {tier.speaking_credits > 0 && (
                              <div
                                className="flex items-center gap-2 text-[11px] font-black text-muted-foreground/80"
                                data-oid="kaf:_-8"
                              >
                                <Mic
                                  className="w-3.5 h-3.5 text-emerald-500/60"
                                  data-oid="6nr:16-"
                                />
                                <span data-oid="4hwg-qm">
                                  +{tier.speaking_credits} Speaking Evaluations
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {claimed && (
                          <div
                            className="absolute -bottom-3 -right-3 opacity-[0.05] pointer-events-none rotate-12"
                            data-oid="30oxkx_"
                          >
                            <Trophy className="w-20 h-20" data-oid="-y882q2" />
                          </div>
                        )}
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
