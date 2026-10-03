import React from 'react';
import { Button } from '@/components/ui/button';
import { PRICING_LABELS } from '../services/history';
import { StatusBadge } from './StatusBadge';
import { NUM, MICRO, Pill } from '@/features/dashboard/components/primitives';

export function PricingTable({ rules = [], onEdit }) {
  if (rules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
        No pricing rules configured yet. Click &ldquo;Add pricing&rdquo; to set default or bulk
        tiers.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/40 dark:bg-[#131315]">
      <table className="w-full text-left text-xs [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5">
        <thead className="border-b border-border/80 bg-muted/40 dark:bg-white/[0.03]">
          <tr>
            {['Type', 'Plan', 'Months', 'Seats', 'Currency', 'Amount', 'Status', ''].map((x, i) => (
              <th key={i} className={`${MICRO} text-muted-foreground`}>
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rules.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-muted/20">
              <td className="font-semibold text-foreground">{PRICING_LABELS[r.kind] || r.kind}</td>
              <td>
                <Pill
                  tone={r.tier === 'premium' ? 'accent' : 'neutral'}
                  className="text-[10px] font-bold"
                >
                  {r.tier === 'premium' ? 'Premium' : 'Pro'}
                </Pill>
              </td>
              <td className={NUM}>
                {r.months} {r.months === 1 ? 'month' : 'months'}
              </td>
              <td className={NUM}>
                {r.kind === 'bulk'
                  ? `${r.quantity}+`
                  : r.kind === 'package'
                    ? `${r.quantity} exact`
                    : 'Any'}
              </td>
              <td className={`${NUM} text-[11px] font-semibold text-muted-foreground`}>
                {r.currency}
              </td>
              <td className={`${NUM} font-bold text-foreground`}>
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: r.currency,
                }).format(r.amount)}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                  {r.kind === 'package' ? 'total' : '/ seat'}
                </span>
              </td>
              <td>
                <StatusBadge status={r.enabled ? 'active' : 'revoked'} />
              </td>
              <td className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-semibold hover:border-[#5a63df]/40 hover:text-[#5a63df] hover:bg-[#f7f6fd] dark:hover:bg-white/5 cursor-pointer"
                  onClick={() => onEdit?.(r)}
                >
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PricingTable;
