import { useState } from 'react';
import { RefreshCw, CreditCard, Clock, AlertCircle, Users } from 'lucide-react';
import { Stat, PANEL, MUTED, TITLE, NUM, MICRO } from '@/features/dashboard/components/primitives';
import { AdminButton } from '../ui/primitives';
import { formatDateTime } from './billingFormat';
import { byNewest, matchesSubscription, needsAttention } from './subscriptionPresentation';
import SubscriptionTable from './SubscriptionTable';
import PaymentAttention from './PaymentAttention';
const FILTERS = [
  ['current', 'Current'],
  ['active', 'Active subscriptions'],
  ['attention', 'Needs attention'],
  ['ending', 'Ending'],
  ['all', 'All subscriptions'],
];

const STRIP = [
  ['active', 'Stripe', ''],
  ['manual', 'Prepaid', ''],
  ['attention', 'Attention', 'text-[rgb(var(--signal-fault))]'],
  ['ending', 'Ending', 'text-[rgb(var(--signal-warn))]'],
  ['pending', 'Review', ''],
];

/** Phone: one compact strip instead of five tall tiles, so the list sits near the top. */
function StatStrip({ summary }) {
  return (
    <dl
      className={`${PANEL} grid grid-cols-5 divide-x divide-[#e4e2f0] dark:divide-white/[0.07] sm:hidden`}
    >
      {STRIP.map(([key, label, tone]) => (
        <div key={key} className="px-1 py-2 text-center">
          <dd className={`text-lg font-semibold leading-none ${NUM} ${tone}`}>
            {summary[key] ?? '—'}
          </dd>
          <dt className={`${MICRO} mt-1.5 truncate !text-[9px] !tracking-wide`}>{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function OverviewStats({ summary }) {
  return (
    <div className="hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-5">
      <Stat
        size="sm"
        icon={CreditCard}
        label="Stripe active"
        value={summary.active}
        sub="Paid subscription status"
        tone="emerald"
      />
      <Stat
        size="sm"
        icon={Users}
        label="Prepaid access"
        value={summary.manual}
        sub="Current fixed-term plans"
      />
      <Stat
        size="sm"
        icon={AlertCircle}
        label="Needs attention"
        value={summary.attention}
        sub="Failed or interrupted billing"
        tone="rose"
      />
      <Stat
        size="sm"
        icon={Clock}
        label="Ending"
        value={summary.ending}
        sub="Active until period end"
        tone="amber"
      />
      <Stat
        size="sm"
        icon={Clock}
        className="col-span-2 lg:col-span-1"
        label="Manual review"
        value={summary.pending ?? '—'}
        sub="Pending payment requests"
      />
    </div>
  );
}
export default function PaymentOverviewPanel({
  data,
  loading = false,
  error = '',
  onRefresh,
  onReview,
  search = '',
}) {
  const [filter, setFilter] = useState('current');
  if (!data && loading)
    return (
      <section role="status" aria-label="Loading subscription overview" className="space-y-3">
        <span className="sr-only">Loading subscription overview</span>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${PANEL} h-24 animate-pulse motion-reduce:animate-none`} />
          ))}
        </div>
        <div className={`${PANEL} h-40 animate-pulse motion-reduce:animate-none`} />
      </section>
    );
  return (
    <section aria-label="Subscriptions and payment attention" className="space-y-3 sm:space-y-4">
      {error && (
        <div role="alert" className={`${PANEL} p-3 text-sm text-[rgb(var(--signal-fault))]`}>
          {error}
          <AdminButton variant="outline" onClick={onRefresh}>
            Retry overview
          </AdminButton>
        </div>
      )}
      {data && (
        <>
          <StatStrip summary={data.summary} />
          <OverviewStats summary={data.summary} />
          {!data.complete && (
            <p role="alert" className="text-xs text-[rgb(var(--signal-warn))]">
              Some Stripe statuses could not be verified. Totals are partial; alerts remain unread.
              Refresh to retry.
            </p>
          )}
          <PaymentAttention rows={data.subscriptions.filter(needsAttention)} onReview={onReview} />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className={TITLE}>Subscriptions</h2>
              <p className={`mt-1 text-[11px] ${MUTED}`}>
                Stripe status checked {formatDateTime(data.observedAt)}
                {error ? ' · Last successful snapshot' : ''}
              </p>
            </div>
            <AdminButton
              variant="outline"
              loading={loading}
              onClick={onRefresh}
              aria-label="Refresh status"
            >
              <RefreshCw className="size-3" />
              <span className="hidden sm:inline">Refresh status</span>
            </AdminButton>
          </div>
          <div
            className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 sm:mx-0 sm:flex-wrap sm:px-0"
            role="group"
            aria-label="Subscription filters"
          >
            {FILTERS.map(([value, label]) => (
              <button
                type="button"
                aria-pressed={filter === value}
                key={value}
                onClick={() => setFilter(value)}
                className={`min-h-9 shrink-0 whitespace-nowrap rounded-md border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#5a63df] ${filter === value ? 'border-[#5a63df] bg-[#5a63df]/10 text-[#5a63df] dark:text-indigo-300' : 'border-[#e4e2f0] dark:border-white/[0.07] text-slate-600 dark:text-slate-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <SubscriptionTable
            rows={data.subscriptions
              .filter((row) => matchesSubscription(row, filter, search))
              .sort(byNewest)}
            onReview={onReview}
          />
        </>
      )}
    </section>
  );
}
