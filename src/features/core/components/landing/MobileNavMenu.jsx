import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import ChevronRight from 'lucide-react/icons/chevron-right';
import { Button } from '@/components/ui/button';

const MENU_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      duration: 0.3,
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

/** Mobile slide-down navigation menu with staggered item animation. */
export default function MobileNavMenu({ isOpen, onClose, links, isSignedIn, handlePrimaryCta }) {
  return (
    <AnimatePresence data-oid="cfglkhg">
      {isOpen && (
        <m.div
          variants={MENU_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="lg:hidden absolute top-full left-4 right-4 mt-3 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-5 z-[99] overflow-hidden"
          data-oid="iz_alpq"
        >
          <m.div className="flex flex-col gap-1.5" data-oid="r6wu019">
            {links.map((link) => (
              <m.a
                variants={ITEM_VARIANTS}
                key={link.label}
                href={link.href}
                onClick={onClose}
                className="group text-sm font-bold tracking-wide text-muted-foreground/80 hover:text-primary dark:hover:text-white py-2.5 px-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 last:border-0 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                data-oid="ywl:3a5"
              >
                <span>{link.label}</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </m.a>
            ))}
            <m.div variants={ITEM_VARIANTS} className="pt-2">
              <Button
                className="w-full rounded-full h-10 text-sm font-bold shadow-md bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white mt-1 border-none"
                onClick={() => {
                  onClose();
                  handlePrimaryCta();
                }}
                data-oid="rwj8lbe"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Start Free Practice'}
              </Button>
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
