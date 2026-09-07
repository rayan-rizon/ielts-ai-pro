import React from 'react';
import { Pill } from '@/features/dashboard/components/primitives.jsx';
import { ReiconUsers } from '@/components/ui/reicon';
import { UserRound } from 'lucide-react';

export default function WaitingPartnerCard() {
  return (
    <section className="flex flex-col justify-between rounded-xl border border-dashed border-[#5a63df]/35 bg-[#fbfaff] p-3.5 sm:p-4 dark:border-white/15 dark:bg-white/[0.02]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-dashed border-[#5a63df]/40 bg-[#5a63df]/5 text-[#5a63df] dark:border-white/20 dark:text-[#afb5ff]"
              aria-hidden="true"
            >
              <ReiconUsers className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                Study Partner
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Spot available
              </p>
            </div>
          </div>
          <Pill tone="warn">Waiting</Pill>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg border border-[#eceafa] bg-white p-2 sm:p-2.5 dark:border-white/[0.06] dark:bg-[#16151f]">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <UserRound className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                Waiting for your friend
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                Send the private invitation shown above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
