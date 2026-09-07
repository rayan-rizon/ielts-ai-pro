import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReiconCheck, ReiconClock, ReiconCopy, ReiconShare } from '@/components/ui/reicon';
import { invitationPath } from '../pairedApi';

export default function PairedRoomInviteHero({ room, copyInvitation, onCopyInvitation, copied }) {
  const handleCopy = copyInvitation || onCopyInvitation;
  const fullInviteUrl = `${window.location.origin}${invitationPath(room)}`;

  return (
    <section className="rounded-2xl border border-[#e4e2f0] bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#121118] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#5a63df] text-white shadow-xs">
            <ReiconShare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Awaiting one friend
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              Invite a friend
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Send this private link. Your friend signs in and joins this test.
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-[#f8f7fd] px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-[#181722] dark:text-slate-300">
          <ReiconClock className="h-3.5 w-3.5 text-[#5a63df]" /> Valid 24 hours
        </div>
      </div>

      {/* URL Copy Bar with Smooth Layout Transition */}
      <motion.div layoutRoot className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="paired-invitation-link">
          Private invitation link
        </label>
        <motion.div
          layout
          transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
          className="relative flex-1 min-w-0"
        >
          <input
            id="paired-invitation-link"
            aria-label="Private invitation link"
            readOnly
            className="w-full rounded-xl border border-[#d8d5ee] bg-white px-3.5 py-2.5 font-mono text-xs text-slate-800 shadow-inner outline-none transition-all focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/15 dark:bg-[#181724] dark:text-slate-200"
            value={fullInviteUrl}
            onFocus={(event) => event.target.select()}
          />
        </motion.div>
        <motion.button
          layout
          transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
          type="button"
          onClick={handleCopy}
          className="relative h-10 shrink-0 inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 text-xs font-bold shadow-xs bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                layout="position"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="inline-flex items-center gap-2 whitespace-nowrap"
              >
                <ReiconCheck className="h-4 w-4 shrink-0" />
                Copied to clipboard!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                layout="position"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="inline-flex items-center gap-2 whitespace-nowrap"
              >
                <ReiconCopy className="h-4 w-4 shrink-0" />
                Copy invite link
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </section>
  );
}
