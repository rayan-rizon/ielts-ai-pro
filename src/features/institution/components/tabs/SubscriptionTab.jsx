import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, CreditCard, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { NativeSelect } from '../NativeSelect';
import { Field } from '../formUtils';
import { money } from '../institutionUtils';
import { PRICING_LABELS } from '../../services/history';
import { cn } from '@/lib/cn';
import { NUM, MICRO, MUTED, Pill } from '@/features/dashboard/components/primitives';

const PRESET_QUANTITIES = [5, 10, 25, 50, 100];

export function SubscriptionTab({ institution, purchase, setPurchase, quote, buy, busy }) {
  const statusActive = institution.status === 'active';

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#5a63df]" />
            <h2 className="text-base font-bold text-foreground">Buy student seats</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            One-time payment with no recurring charges. Students have 90 days to activate their
            seat.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Non-recurring one-time order</span>
        </div>
      </div>

      {/* Configuration Box */}
      <div className="rounded-xl border border-[#e4e2f0] dark:border-white/10 bg-stone-50/50 dark:bg-white/[0.02] p-4 space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Plan">
            <NativeSelect
              disabled={busy}
              value={purchase.tier}
              onChange={(e) => setPurchase({ ...purchase, tier: e.target.value })}
              className="h-8.5 text-xs"
            >
              <option value="pro">Pro Plan</option>
              <option value="premium">Premium Plan</option>
            </NativeSelect>
          </Field>

          <Field label="Duration">
            <NativeSelect
              disabled={busy}
              value={purchase.months}
              onChange={(e) => setPurchase({ ...purchase, months: Number(e.target.value) })}
              className="h-8.5 text-xs"
            >
              <option value="1">1 month</option>
              <option value="3">3 months</option>
            </NativeSelect>
          </Field>

          <Field label="Seat quantity">
            <Input
              type="number"
              min="1"
              max="10000"
              disabled={busy}
              value={purchase.quantity}
              onChange={(e) =>
                setPurchase({ ...purchase, quantity: Math.max(1, Number(e.target.value) || 1) })
              }
              className="h-8.5 rounded-lg border border-[#e4e2f0] bg-white px-3 font-mono text-xs font-semibold hover:border-[#5a63df]/40 focus-visible:border-[#5a63df] focus-visible:ring-2 focus-visible:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319]"
            />
          </Field>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e4e2f0]/60 dark:border-white/[0.06]">
          <span className={cn(MICRO, MUTED, 'text-[10px] font-bold tracking-wider mr-1')}>
            Quick Presets:
          </span>
          {PRESET_QUANTITIES.map((qty) => (
            <button
              key={qty}
              type="button"
              disabled={busy}
              className={cn(
                'h-7 px-2.5 text-xs font-semibold rounded-md border transition-all cursor-pointer',
                purchase.quantity === qty
                  ? 'bg-[#5a63df] text-white border-[#5a63df] shadow-2xs'
                  : 'border-[#e4e2f0] bg-white text-stone-700 hover:border-[#5a63df]/40 hover:text-[#5a63df] hover:bg-[#f7f6fd] dark:border-white/10 dark:bg-[#141319] dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white'
              )}
              onClick={() => setPurchase({ ...purchase, quantity: qty })}
            >
              +{qty} seats
            </button>
          ))}
        </div>
      </div>

      {/* Pricing & Checkout Section */}
      {!quote ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e4e2f0] dark:border-white/10 bg-gradient-to-r from-stone-50/80 to-[#f9f8fe] dark:from-[#141319] dark:to-[#171622] p-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#bfc3ff]">
              <Calculator className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Calculate Tiered Pricing</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Get an instant quote with negotiated rates and volume bulk pricing applied.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !statusActive}
            onClick={() => buy(false)}
            className="h-9 px-5 bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.98] font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Calculator className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
            <span>{busy ? 'Calculating…' : 'Calculate price'}</span>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#5a63df]/35 bg-[#5a63df]/[0.03] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.05] p-5 space-y-4 shadow-xs">
          {/* Quote Header Strip */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#5a63df]/15 dark:border-white/10">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#5a63df]" />
                <span className={cn(MICRO, 'text-[#5a63df] font-bold tracking-widest')}>
                  Calculated Price
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className={cn(NUM, 'text-3xl font-extrabold tracking-tight text-foreground')}>
                  {money(quote.amount_minor, quote.currency)}
                </span>
                <span className={cn(NUM, 'text-xs font-semibold text-muted-foreground')}>
                  ({money(Math.round(quote.amount_minor / (quote.quantity || 1)), quote.currency)} /
                  seat)
                </span>
              </div>
            </div>
            <Pill tone="accent" className="font-bold text-xs py-1 px-3">
              {PRICING_LABELS[quote.pricing_kind] || 'Standard price'}
            </Pill>
          </div>

          {/* Breakdown Inset */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border border-[#e4e2f0]/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] p-3 text-xs">
            <div>
              <span className={cn(MICRO, MUTED)}>Seats</span>
              <p className={cn(NUM, 'font-bold text-foreground mt-0.5')}>
                {quote.quantity} student seats
              </p>
            </div>
            <div>
              <span className={cn(MICRO, MUTED)}>Plan & Duration</span>
              <p className="font-bold text-foreground mt-0.5">
                {purchase.tier.toUpperCase()} · {purchase.months}{' '}
                {purchase.months === 1 ? 'month' : 'months'}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className={cn(MICRO, MUTED)}>Activation Period</span>
              <p className="font-bold text-foreground mt-0.5">90 days to activate</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !statusActive}
              onClick={() => buy(false)}
              className="h-9 px-3.5 text-xs font-semibold rounded-lg border border-[#e4e2f0] bg-white text-stone-700 hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-[#141319] dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
              <span>Recalculate</span>
            </Button>
            <Button
              size="default"
              disabled={busy || !statusActive}
              onClick={() => buy(true)}
              className="h-9 px-5 bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.98] font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay with Stripe</span>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default SubscriptionTab;
