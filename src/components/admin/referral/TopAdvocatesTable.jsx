import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL } from '../ui/primitives';

const RANK_TONES = [
  'bg-[rgb(var(--signal-warn))] text-white',
  'bg-stone-400 text-white',
  'bg-stone-500 text-white',
];

function getRankBadgeClass(rankIndex) {
  return RANK_TONES[rankIndex] || 'bg-stone-200 dark:bg-white/6 text-stone-600 dark:text-stone-300';
}

function AdvocateRow({ referrer, rankIndex, funnel }) {
  const badgeClass = getRankBadgeClass(rankIndex);
  const activatedCount = funnel?.activated || 0;
  const paidCount = funnel?.paid || 0;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/70 dark:bg-white/2 border border-stone-200/60 dark:border-white/5">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className={cn(
            NUM,
            'w-6 h-6 rounded-md grid place-items-center font-black text-[11px] shrink-0',
            badgeClass
          )}
        >
          {rankIndex + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
            {referrer.name}
          </p>
          <p className={cn(NUM, 'text-[10px] text-stone-500 dark:text-stone-400 truncate')}>
            {referrer.email}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className={cn(NUM, 'block text-[11px] font-bold text-stone-700 dark:text-stone-200')}>
          {referrer.count} referrals
        </span>
        <span className="text-[9px] font-bold text-stone-500 dark:text-stone-400">
          {activatedCount} activated · {paidCount} paid
        </span>
      </div>
    </div>
  );
}

export function TopAdvocatesTable({ stats, conversion = [] }) {
  const referrers = stats?.topReferrers;
  if (!Array.isArray(referrers) || referrers.length === 0) {
    return null;
  }

  const topFive = referrers.slice(0, 5);

  return (
    <div className={cn(PANEL, 'p-4')}>
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        <h3 className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Top advocates</h3>
      </div>
      <div className="space-y-1.5">
        {topFive.map((referrer, idx) => {
          const funnel = conversion.find((row) => row.referrer_id === referrer.id);
          return (
            <AdvocateRow key={referrer.id} referrer={referrer} rankIndex={idx} funnel={funnel} />
          );
        })}
      </div>
    </div>
  );
}

export default TopAdvocatesTable;
