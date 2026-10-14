import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ReceiptText, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BillingService } from '@/features/admin/services/BillingService';
import {
  AdminButton,
  BODY,
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
  StatCell,
  StatRail,
} from '../ui/primitives';
import {
  REFUND_STATUS_TONE,
  formatDateTime,
  formatMoney,
  providerLabel,
  refundStatusLabel,
  verdictMeta,
} from './billingFormat';

/**
 * Every refund and chargeback, whichever way it happened: from this panel,
 * from the Stripe dashboard (via webhook), or recorded for bKash/Nagad.
 */
export default function RefundLedgerPanel({ onOpenCustomer, refreshKey = 0 }) {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLedger(await BillingService.getRefundLedger(100));
    } catch (loadError) {
      setError(loadError.message || 'Refund ledger unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const rows = ledger?.rows || [];
  const summary = ledger?.summary || {};
  const needsAction = rows.filter((row) => row.accessStillActive || row.status === 'failed');

  return (
    <section className={cn(PANEL, 'overflow-hidden')}>
      <PanelHeader
        label="Refunds & chargebacks"
        title="Refund ledger"
        description="Refunds from this panel, from the Stripe dashboard, and recorded bKash/Nagad transfers. Kept for six months."
      >
        <AdminButton size="sm" variant="outline" onClick={load} aria-label="Refresh refund ledger">
          <RefreshCcw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </AdminButton>
      </PanelHeader>

      <StatRail className="grid-cols-2 sm:grid-cols-4">
        <StatCell label="Refunded · 30d" value={summary.succeeded30d ?? 0} />
        <StatCell
          label="Amount · 30d"
          value={
            [
              summary.refundedUsd30d ? formatMoney(summary.refundedUsd30d, 'USD') : null,
              summary.refundedBdt30d ? formatMoney(summary.refundedBdt30d, 'BDT') : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'
          }
        />
        <StatCell
          label="Open disputes"
          value={summary.openChargebacks ?? 0}
          tone={summary.openChargebacks ? 'fault' : undefined}
        />
        <StatCell
          label="Pending / failed"
          value={`${summary.pending ?? 0} / ${summary.failed ?? 0}`}
          tone={summary.failed ? 'fault' : undefined}
        />
      </StatRail>

      {needsAction.length > 0 && (
        <div className="flex items-start gap-2 border-b border-stone-200/80 bg-[rgb(var(--signal-warn)/0.06)] px-4 py-2.5 dark:border-white/[0.07]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-warn))]" />
          <p className={BODY}>
            {needsAction.length} refund{needsAction.length === 1 ? '' : 's'} need attention: a
            refunded account still on a paid plan, or a refund Stripe did not complete. Open the
            customer to fix it.
          </p>
        </div>
      )}

      {error ? (
        <Empty icon={AlertTriangle} title="Refund ledger unavailable">
          {error}
        </Empty>
      ) : !loading && rows.length === 0 ? (
        <Empty icon={ReceiptText} title="No refunds yet">
          Refunds issued here, refunds made in the Stripe dashboard, and chargebacks appear in this
          list.
        </Empty>
      ) : (
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/[0.07]">
                {['Customer', 'Amount', 'Reason', 'Evidence at decision', 'Status', ''].map(
                  (heading) => (
                    <th key={heading} className={cn(MICRO, MUTED, 'px-4 py-2.5 font-bold')}>
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {rows.map((row) => {
                const verdict = row.verdictAtDecision ? verdictMeta(row.verdictAtDecision) : null;
                return (
                  <tr key={row.id} className="text-[11px] text-stone-700 dark:text-stone-200">
                    <td className="px-4 py-2.5">
                      <p className="max-w-[200px] truncate font-extrabold text-stone-900 dark:text-stone-50">
                        {row.fullName || row.email || 'Deleted account'}
                      </p>
                      <p className={cn(NUM, 'max-w-[200px] truncate text-[10px] text-stone-500')}>
                        {row.email || row.providerPaymentRef || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className={cn(NUM, 'font-bold text-stone-900 dark:text-stone-50')}>
                        {formatMoney(row.amount, row.currency)}
                      </p>
                      <p className={cn(MICRO, MUTED)}>
                        {row.kind} · {providerLabel(row.provider)}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="capitalize">{String(row.reason).replace(/_/g, ' ')}</p>
                      <p className={cn(NUM, 'text-[10px] text-stone-500')}>
                        {formatDateTime(row.createdAt)}
                        {row.initiatedBy ? ` · ${row.initiatedBy}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      {verdict ? (
                        <Pill tone={verdict.tone}>{verdict.label}</Pill>
                      ) : (
                        <span className={MUTED}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        <Pill tone={REFUND_STATUS_TONE[row.status] || 'neutral'}>
                          {refundStatusLabel(row)}
                        </Pill>
                        {row.accessStillActive && (
                          <span className="text-[10px] font-bold text-[rgb(var(--signal-warn))]">
                            Still on {row.currentTier}
                          </span>
                        )}
                        {row.failureReason && row.status !== 'succeeded' && (
                          <span
                            className="max-w-[180px] truncate text-[10px] text-stone-500"
                            title={row.failureReason}
                          >
                            {row.failureReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {row.userId && onOpenCustomer && (
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenCustomer(row.userId)}
                        >
                          Open
                        </AdminButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
