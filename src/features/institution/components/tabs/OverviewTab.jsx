import React from 'react';
import { Card } from '@/components/ui/card';
import { UserCheck, Clock, Hourglass, Users, CreditCard, Gift } from 'lucide-react';
import { SEAT_LABELS, date } from '../institutionUtils';

export function OverviewTab({ counts, seats }) {
  const expiringSeats = seats.filter(
    (s) => s.status === 'active' && new Date(s.access_until) <= new Date(Date.now() + 14 * 86400000)
  );

  const purchasedCount = seats.filter(
    (s) => s.source === 'paid' && !['revoked', 'expired'].includes(s.status)
  ).length;

  const complimentaryCount = seats.filter(
    (s) => s.source === 'complimentary' && !['revoked', 'expired'].includes(s.status)
  ).length;

  return (
    <div className="space-y-5">
      {/* Top 4-Stat Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {SEAT_LABELS.available}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {counts.available}
          </p>
          <p className="text-[11px] text-muted-foreground">Ready to invite a student</p>
        </Card>

        <Card className="p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {SEAT_LABELS.invited}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/18 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {counts.invited}
          </p>
          <p className="text-[11px] text-muted-foreground">Student has not accepted yet</p>
        </Card>

        <Card className="p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {SEAT_LABELS.waiting}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/18 dark:text-amber-300">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {counts.waiting}
          </p>
          <p className="text-[11px] text-muted-foreground">Starts after current access ends</p>
        </Card>

        <Card className="p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {SEAT_LABELS.active}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/18 dark:text-emerald-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {counts.active}
          </p>
          <p className="text-[11px] text-muted-foreground">Using institution access</p>
        </Card>
      </div>

      {/* Seat breakdown card */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
          <h2 className="text-base font-bold text-foreground">Seat balance</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Total seats available to allocate. Assign them to learners from the Students tab.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Purchased seats
              </span>
              <CreditCard className="h-4 w-4 text-primary dark:text-[#afb5ff]" />
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {purchasedCount}
              <span className="text-muted-foreground text-xs font-normal ml-1.5">seats</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Free seats (Complimentary)
              </span>
              <Gift className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {complimentaryCount}
              <span className="text-muted-foreground text-xs font-normal ml-1.5">seats</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Expiring Soon */}
      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-foreground">Expiring in the next 14 days</h2>
        {expiringSeats.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{s.recipient_email}</p>
              <p className="text-muted-foreground text-[11px] capitalize">{s.tier} plan</p>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                Expires {date(s.access_until)}
              </span>
            </div>
          </div>
        ))}
        {expiringSeats.length === 0 && (
          <p className="text-muted-foreground text-xs py-1">
            No upcoming expiries in the next 14 days.
          </p>
        )}
      </Card>
    </div>
  );
}

export default OverviewTab;
