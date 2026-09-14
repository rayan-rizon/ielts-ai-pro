import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import {
  AudioLines,
  BadgeCheck,
  CalendarDays,
  Edit3,
  FilePenLine,
  Gift,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL } from '../ui/primitives';

function RewardChip({ Icon, tone, label }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] uppercase whitespace-nowrap',
        tone
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function RewardTierRow({ tier, onToggleActive, onEditTier, onDeleteTier }) {
  const isLive = Boolean(tier.is_active);
  const targetLabel = `${tier.referrals_required} referral${tier.referrals_required === 1 ? '' : 's'} target`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-lg border p-3.5 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
        isLive
          ? 'border-stone-200 bg-white shadow-2xs hover:border-[#5a63df]/60 hover:shadow-xs dark:border-white/8 dark:bg-white/2.5 dark:hover:border-[#5a63df]/40'
          : 'border-stone-100 bg-stone-50/60 opacity-60 dark:border-white/4 dark:bg-white/1.5'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            NUM,
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-sm font-black',
            isLive
              ? 'border-violet-200 bg-violet-500/8 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200'
              : 'border-stone-200 bg-stone-100 text-stone-500 dark:border-white/8 dark:bg-white/5 dark:text-stone-400'
          )}
        >
          {tier.referrals_required}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <p className="mr-1 text-xs font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {targetLabel}
          </p>
          {tier.extra_days > 0 && (
            <RewardChip
              Icon={CalendarDays}
              tone="border-stone-200 bg-stone-50 text-stone-600 dark:border-white/10 dark:bg-white/4 dark:text-stone-300"
              label={`+${tier.extra_days} days`}
            />
          )}
          {tier.writing_credits > 0 && (
            <RewardChip
              Icon={FilePenLine}
              tone="border-indigo-200/80 bg-indigo-500/5 text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/8 dark:text-indigo-300"
              label={`+${tier.writing_credits} Writing`}
            />
          )}
          {tier.speaking_credits > 0 && (
            <RewardChip
              Icon={AudioLines}
              tone="border-indigo-200/80 bg-indigo-500/5 text-indigo-600 dark:border-indigo-400/25 dark:bg-indigo-400/8 dark:text-indigo-300"
              label={`+${tier.speaking_credits} Speaking`}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-stone-100 pt-2 dark:border-white/6 sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-2.5">
          <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            {isLive ? 'Live' : 'Paused'}
          </span>
          <Switch checked={isLive} onCheckedChange={() => onToggleActive(tier)} />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-white/8 dark:bg-white/4">
          <button
            type="button"
            aria-label={`Edit ${tier.referrals_required} referrals tier`}
            onClick={() => onEditTier(tier)}
            className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-all duration-150 ease-smooth-out active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${tier.referrals_required} referrals tier`}
            onClick={() => onDeleteTier(tier)}
            className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-all duration-150 ease-smooth-out active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--signal-fault))]/50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function RewardTiersEmpty() {
  return (
    <div className="text-center py-10">
      <Gift className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
      <p className="text-xs font-bold text-stone-900 dark:text-stone-50">No reward tiers yet</p>
      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-1')}>
        Add one to create your first milestone
      </p>
    </div>
  );
}

export function RewardTiersList({ tiers = [], onToggleActive, onEditTier, onDeleteTier }) {
  const activeCount = tiers.filter((tier) => Boolean(tier.is_active)).length;

  return (
    <div className={cn(PANEL, 'overflow-hidden')}>
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-4 py-4 dark:border-white/6 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              Milestone rewards
            </h3>
            <p className={cn(MICRO, 'mt-0.5 text-stone-500 dark:text-stone-400')}>
              Rewards unlock once a learner reaches each referral target.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[rgb(var(--signal-ok)/0.24)] bg-[rgb(var(--signal-ok)/0.06)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[rgb(var(--signal-ok))] sm:self-auto">
          <BadgeCheck className="h-3.5 w-3.5" />
          {activeCount} live
        </div>
      </div>

      <div className="space-y-2 p-3 sm:p-4">
        <AnimatePresence initial={false}>
          {tiers.map((tier) => (
            <RewardTierRow
              key={tier.id}
              tier={tier}
              onToggleActive={onToggleActive}
              onEditTier={onEditTier}
              onDeleteTier={onDeleteTier}
            />
          ))}
        </AnimatePresence>

        {tiers.length === 0 && <RewardTiersEmpty />}
      </div>
    </div>
  );
}

export default RewardTiersList;
