import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL, Kpi } from '../ui/primitives';

function calculateMetricTotal(conversion, metricKey) {
  if (!Array.isArray(conversion)) return 0;
  return conversion.reduce((acc, row) => acc + Number(row?.[metricKey] || 0), 0);
}

function countActiveTiers(tiers) {
  if (!Array.isArray(tiers)) return 0;
  return tiers.filter((tier) => Boolean(tier?.is_active)).length;
}

function countFlaggedAdvocates(conversion) {
  if (!Array.isArray(conversion)) return 0;
  return conversion.filter((row) => Boolean(row?.risk_flags?.length)).length;
}

function resolveTopReferrerCount(stats) {
  const topList = stats?.topReferrers;
  return Array.isArray(topList) && topList.length > 0 ? topList[0].count : 0;
}

export function ReferralKpis({ stats, conversion, tiers }) {
  const totalReferrals = (stats?.totalReferrals || 0).toLocaleString();
  const activatedTotal = calculateMetricTotal(conversion, 'activated');
  const paidTotal = calculateMetricTotal(conversion, 'paid');
  const activeCount = countActiveTiers(tiers);
  const totalTiers = Array.isArray(tiers) ? tiers.length : 0;
  const topReferrer = resolveTopReferrerCount(stats);
  const flaggedCount = countFlaggedAdvocates(conversion);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total referrals" value={totalReferrals} />
        <Kpi label="Activated learners" value={activatedTotal} />
        <Kpi label="Paid subscribers" value={paidTotal} />
        <Kpi label="Active tiers" value={activeCount} sub={`of ${totalTiers} total`} />
        <Kpi label="Top referrer" value={topReferrer} sub="referrals by #1" />
      </div>

      {flaggedCount > 0 && (
        <div className={cn(PANEL, 'flex items-center gap-3 p-3')}>
          <ShieldAlert className="h-4 w-4 text-[rgb(var(--signal-warn))]" />
          <p className="text-xs font-bold text-stone-700 dark:text-stone-200">
            {flaggedCount} advocate account(s) need referral-pattern review.
          </p>
        </div>
      )}
    </>
  );
}

export default ReferralKpis;
