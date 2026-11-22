import { AlertCircle, ExternalLink } from 'lucide-react';
import { PANEL, MICRO, NUM, MUTED, Pill } from '@/features/dashboard/components/primitives';
import { formatMoney, formatDateTime } from './billingFormat';
import { SUBSCRIPTION_STATUS } from './subscriptionPresentation';
import { AdminButton } from '../ui/primitives';

function FailureEvidence({ invoice }) {
  if (!invoice)
    return <p className={`text-xs ${MUTED}`}>Review billing to resolve this subscription.</p>;
  return (
    <div className="rounded-md bg-[rgb(var(--signal-fault))]/[0.06] px-2.5 py-2">
      <p className="text-xs font-medium leading-snug">
        {invoice.failure || 'Payment has not completed. Review the invoice for details.'}
      </p>
      <p className={`mt-1 flex flex-wrap gap-x-2 text-[11px] ${MUTED}`}>
        <span className={NUM}>
          {invoice.attempts} {invoice.attempts === 1 ? 'attempt' : 'attempts'}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {invoice.nextRetryAt
            ? `Retry ${formatDateTime(invoice.nextRetryAt)}`
            : 'No automatic retry'}
        </span>
      </p>
    </div>
  );
}
export default function PaymentAttention({ rows, onReview }) {
  if (!rows.length) return null;
  return (
    <section aria-label="Payment issues" className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <AlertCircle className="size-4 text-[rgb(var(--signal-fault))]" />
        Needs attention <Pill tone="fault">{rows.length}</Pill>
      </h2>
      {rows.map((row) => (
        <article key={row.id} className={`${PANEL} p-3 sm:p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="truncate text-sm font-bold">{row.name}</p>
                <Pill tone="fault">{SUBSCRIPTION_STATUS[row.status]?.[0] || row.status}</Pill>
              </div>
              <p className={`mt-0.5 truncate text-xs ${MUTED}`}>{row.email}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-lg font-semibold leading-none ${NUM}`}>
                {row.invoice ? formatMoney(row.invoice.amountDue, row.invoice.currency) : '—'}
              </p>
              <p className={`${MICRO} mt-1`}>Due</p>
            </div>
          </div>
          <div className="mt-2.5">
            <FailureEvidence invoice={row.invoice} />
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <AdminButton
              variant="outline"
              className="flex-1 sm:flex-none"
              aria-label={`Review failed payment for ${row.name}`}
              onClick={() => onReview(row.userId)}
            >
              Review billing
            </AdminButton>
            {row.invoice?.id && (
              <a
                className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md border border-[#e4e2f0] px-3 text-xs font-semibold text-[#5a63df] transition-transform active:scale-[0.97] focus-visible:outline-2 dark:border-white/[0.07] dark:text-indigo-300 sm:flex-none"
                href={`https://dashboard.stripe.com/invoices/${encodeURIComponent(row.invoice.id)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe invoice
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </article>
      ))}
      <p className={`hidden text-[11px] sm:block ${MUTED}`}>
        Times shown in your local time zone. Opening this page marks alerts read; unresolved issues
        stay here.
      </p>
    </section>
  );
}
