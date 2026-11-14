import { Pill, NUM, MICRO, MUTED, PANEL } from '@/features/dashboard/components/primitives';
import { formatDate, formatMoney } from './billingFormat';
import { SUBSCRIPTION_STATUS, periodLabel } from './subscriptionPresentation';
import { AdminButton } from '../ui/primitives';

function SubscriptionState({ row }) {
  const [label, tone] = SUBSCRIPTION_STATUS[row.status] || [row.status, 'neutral'];
  return (
    <div className="space-y-1">
      <Pill tone={tone}>{label}</Pill>
      {row.cancelAtPeriodEnd && <p className={`text-[11px] ${MUTED}`}>Ends at period end</p>}
    </div>
  );
}
function SubscriptionPrice({ row }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${NUM}`}>
        {row.amount == null ? '—' : formatMoney(row.amount, row.currency)}
      </p>
      <p className={`text-[11px] capitalize ${MUTED}`}>
        {row.tier} · {row.interval}
      </p>
    </div>
  );
}
function SubscriptionIdentity({ row }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-bold" title={row.name}>
        {row.name}
      </p>
      <p className={`truncate text-[11px] ${MUTED}`} title={row.email}>
        {row.email}
      </p>
    </div>
  );
}
function SubscriptionPeriod({ row }) {
  return (
    <div>
      <p className={`text-[10px] ${MUTED}`}>{periodLabel(row)}</p>
      <p className={`text-xs ${NUM}`}>{formatDate(row.periodEnd)}</p>
    </div>
  );
}
export default function SubscriptionTable({ rows, onReview }) {
  if (!rows.length)
    return <p className={`p-6 text-center text-xs ${MUTED}`}>No subscriptions match</p>;
  return (
    <div className={PANEL}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-[#e4e2f0] dark:border-white/[0.07]">
              {['Learner', 'Plan', 'Status', 'Current period', ''].map((label) => (
                <th key={label} className={`px-4 py-3 ${MICRO} ${MUTED}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e4e2f0] dark:divide-white/[0.07]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="max-w-[220px] px-4 py-3">
                  <SubscriptionIdentity row={row} />
                </td>
                <td className="px-4 py-3">
                  <SubscriptionPrice row={row} />
                </td>
                <td className="px-4 py-3">
                  <SubscriptionState row={row} />
                </td>
                <td className="px-4 py-3">
                  <SubscriptionPeriod row={row} />
                </td>
                <td className="px-4 py-3">
                  <AdminButton variant="outline" onClick={() => onReview(row.userId)}>
                    Review
                  </AdminButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#e4e2f0] dark:divide-white/[0.07] md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <SubscriptionIdentity row={row} />
              <SubscriptionState row={row} />
            </div>
            <div className="flex items-end justify-between gap-3">
              <SubscriptionPrice row={row} />
              <SubscriptionPeriod row={row} />
            </div>
            <AdminButton variant="outline" onClick={() => onReview(row.userId)}>
              Review billing
            </AdminButton>
          </article>
        ))}
      </div>
    </div>
  );
}
