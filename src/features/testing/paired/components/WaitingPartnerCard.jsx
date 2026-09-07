import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill } from '@/features/dashboard/components/primitives.jsx';
import { ReiconCheck, ReiconCopy, ReiconUsers } from '@/components/ui/reicon';
import { UserRound } from 'lucide-react';

export default function WaitingPartnerCard({ copyInvitation, onCopyInvitation, copied }) {
  const handleCopy = copyInvitation || onCopyInvitation;

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
                Awaiting invite link
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
                Waiting for second student
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                Share invite link above to join together.
              </p>
            </div>
          </div>
          <motion.button
            layout
            transition={{ layout: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
            type="button"
            onClick={handleCopy}
            className="shrink-0 relative overflow-hidden inline-flex items-center justify-center rounded-md border border-[#5a63df]/25 bg-[#5a63df]/5 px-2.5 py-1 text-[11px] font-semibold text-[#5a63df] hover:bg-[#5a63df]/15 active:scale-[0.97] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-[#5a63df]/35 dark:text-[#afb5ff]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  layout="position"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <ReiconCheck className="h-3 w-3 shrink-0" />
                  Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  layout="position"
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <ReiconCopy className="h-3 w-3 shrink-0" />
                  Copy link
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
