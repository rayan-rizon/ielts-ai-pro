import { AlertCircle, ExternalLink } from 'lucide-react';
import { PANEL, MICRO, NUM, MUTED, Pill } from '@/features/dashboard/components/primitives';
import { formatMoney, formatDateTime } from './billingFormat';
import { SUBSCRIPTION_STATUS } from './subscriptionPresentation';
import { AdminButton } from '../ui/primitives';

function FailureEvidence({ invoice }) {
  if (!invoice)
    return <p className={`text-xs ${MUTED}`}>Review billing to resolve this subscription.</p>;
  return (
    <div className="space-y-1 text-xs">
      <p className="font-medium">
        {invoice.failure || 'Payment has not completed. Review the invoice for details.'}
      </p>
      <p className={MUTED}>
        <span className={NUM}>{invoice.attempts} attempts</span> ·{' '}
        {invoice.nextRetryAt
          ? `Next retry ${formatDateTime(invoice.nextRetryAt)}`
          : 'No automatic retry scheduled'}
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
        <article
          key={row.id}
          className={`${PANEL} border-l-2 border-l-[rgb(var(--signal-fault))] p-4`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-bold">{row.name}</p>
                <Pill tone="fault">{SUBSCRIPTION_STATUS[row.status]?.[0] || row.status}</Pill>
              </div>
              <p className={`break-all text-xs ${MUTED}`}>{row.email}</p>
              <FailureEvidence invoice={row.invoice} />
            </div>
            <div className="text-right">
              <p className={MICRO}>Outstanding</p>
              <p className={`mt-1 text-xl font-semibold ${NUM}`}>
                {row.invoice ? formatMoney(row.invoice.amountDue, row.invoice.currency) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminButton
              variant="outline"
              aria-label={`Review failed payment for ${row.name}`}
              onClick={() => onReview(row.userId)}
            >
              Review billing
            </AdminButton>
            {row.invoice?.id && (
              <a
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#5a63df] underline focus-visible:outline-2"
                href={`https://dashboard.stripe.com/invoices/${encodeURIComponent(row.invoice.id)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Stripe invoice
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </article>
      ))}
      <p className={`text-[11px] ${MUTED}`}>
        Times shown in your local time zone. Opening this page marks alerts read; unresolved issues
        stay here.
      </p>
    </section>
  );
}
