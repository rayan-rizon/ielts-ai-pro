import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Sparkles from 'lucide-react/icons/sparkles';
import ArrowRight from 'lucide-react/icons/arrow-right';
import X from 'lucide-react/icons/x';
import { Button } from '@/components/ui/button';

export default function MobileNavMenu({ isOpen, onClose, links, isSignedIn, handlePrimaryCta }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Darkened backdrop overlay starting below top navbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 top-14 sm:top-16 z-[90] bg-slate-950/60 backdrop-blur-md lg:hidden"
            onClick={onClose}
          />

          {/* Compact mobile navigation card */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-3 right-3 mt-2 z-[99] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.35)] dark:border-slate-800/90 dark:bg-slate-950 lg:hidden"
          >
            {/* Top header bar */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 dark:border-slate-800/80">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                Menu
              </span>
            </div>

            {/* Links list */}
            <div className="mt-1.5 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={onClose}
                    className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-150 hover:bg-slate-50 active:scale-[0.98] dark:hover:bg-slate-900/80"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50/80 text-indigo-600 border border-indigo-100/50 shadow-xs transition-all duration-150 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 dark:group-hover:bg-indigo-500 dark:group-hover:text-white">
                      {Icon ? <Icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded-full bg-indigo-50 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 border border-indigo-200/60 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                            {link.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 dark:text-slate-600 dark:group-hover:text-indigo-400 transition-all duration-150" />
                  </a>
                );
              })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800/80">
              <Button
                className="w-full h-10 rounded-xl font-black text-xs shadow-md shadow-[#6256ef]/20 hover:shadow-lg hover:shadow-[#6256ef]/30 bg-[#6256ef] hover:bg-[#5246e0] text-white border-none transition-all duration-150 active:scale-[0.98] cursor-pointer"
                onClick={() => {
                  onClose();
                  handlePrimaryCta();
                }}
              >
                <span>{isSignedIn ? 'Go to Dashboard' : 'Start Free Practice'}</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
