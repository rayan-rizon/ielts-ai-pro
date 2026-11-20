import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, MICRO, MUTED, NUM } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import LibraryUsagePanel from './LibraryUsagePanel';

function allowanceDetail(usage) {
  if (usage.remaining === 0) return 'Monthly limit reached';
  if (usage.dailyReached) return `Daily limit reached · ${usage.remaining} left this month`;
  if (usage.limit === null) return 'Unlimited monthly allowance';
  return `${usage.remaining} left this month`;
}

export default function ProductiveAllowancePanel({ skill, allowance }) {
  const { usage, canUpgrade } = allowance ?? {};
  if (!usage) return null;
  const label = skill === 'writing' ? 'Writing evaluations' : 'Speaking starts';
  const usedLabel =
    usage.limit === null ? `${usage.used} used this month` : `${usage.used} of ${usage.limit} used`;
  const upgrade = canUpgrade && (
    <Link
      to="/pricing?plan=pro"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-2 text-xs font-bold text-[#5a63df] hover:text-[#4a52c9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-[#afb5ff]"
    >
      Unlock with Pro <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );

  return (
    <LibraryUsagePanel
      label={`${label} usage`}
      title={label}
      detail={allowanceDetail(usage)}
      blocked={usage.blocked}
      action={upgrade}
    >
      <div className="flex items-center justify-end gap-2.5">
        {usage.limit !== null && (
          <Bar value={(usage.used / usage.limit) * 100} className="min-w-0 flex-1" />
        )}
        <span className={cn(MICRO, MUTED, NUM)}>{usedLabel}</span>
      </div>
    </LibraryUsagePanel>
  );
}
