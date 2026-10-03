import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/features/dashboard/components/primitives';
import { Building2, Receipt, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { date, money } from '../institutionUtils';

function OrderDocuments({ order, admin, seats, open }) {
  const needsReconciliation = admin && order.status === 'reconciliation';

  return (
    <div className="flex items-center gap-2">
      {order.invoice_url && (
        <a
          href={order.invoice_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary dark:text-[#afb5ff] font-semibold underline text-xs"
        >
          <Receipt className="h-3 w-3" />
          Invoice
        </a>
      )}
      {order.receipt_url && (
        <a
          href={order.receipt_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary dark:text-[#afb5ff] font-semibold underline text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          Receipt
        </a>
      )}
      {needsReconciliation && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            open('reconcile_refund', 'Reconcile partial refund', {
              order,
              seats: seats.filter((s) => s.order_id === order.id && s.status !== 'revoked'),
            })
          }
        >
          Reconcile refund
        </Button>
      )}
    </div>
  );
}

export function BillingTab({ orders, seats, admin, open, busy, checkoutSuccess }) {
  const unusedSeats = seats.filter((s) => ['available', 'invited'].includes(s.status));

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
          <h2 className="text-base font-bold text-foreground">Orders & receipts</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Order receipts, payment history, and complimentary seat allocations.
        </p>

        {checkoutSuccess && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            Payment confirmed! If new seats do not appear immediately, refresh in a moment.
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                {[
                  'Date',
                  'Plan',
                  'Seats',
                  'Amount',
                  'Source',
                  'Status',
                  'Activate by',
                  'Documents',
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="font-mono tabular-nums text-xs whitespace-nowrap">
                    {date(o.created_at)}
                  </td>
                  <td>
                    <Badge
                      variant={o.tier === 'premium' ? 'default' : 'secondary'}
                      className="text-[11px]"
                    >
                      {o.tier === 'premium' ? 'Premium' : 'Pro'}
                    </Badge>
                  </td>
                  <td className="font-mono tabular-nums font-bold text-foreground">{o.quantity}</td>
                  <td className="font-mono tabular-nums font-bold text-foreground">
                    {money(o.amount_minor, o.currency)}
                  </td>
                  <td className="capitalize text-xs text-muted-foreground">
                    {o.source === 'complimentary' ? 'Free seats' : 'Purchase'}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="font-mono tabular-nums text-xs whitespace-nowrap">
                    {date(o.activation_deadline)}
                  </td>
                  <td>
                    <OrderDocuments order={o} admin={admin} seats={seats} open={open} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="p-8">
              <Empty
                icon={Building2}
                title="No purchases or free seats yet"
                description="Purchase seats from Buy seats, or ask a platform administrator about a free allocation."
              />
            </div>
          )}
        </div>
      </Card>

      {/* Admin view: Unused seats */}
      {admin && (
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground">Unused seats</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  {['Seat', 'Source', 'Plan', 'Status', 'Actions'].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unusedSeats.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="font-mono text-xs text-foreground">{s.id.slice(0, 8)}</td>
                    <td className="capitalize text-muted-foreground">{s.source}</td>
                    <td>{s.tier}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => open('revoke', 'Revoke unused seat', { seat: s })}
                      >
                        Revoke seat
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default BillingTab;
