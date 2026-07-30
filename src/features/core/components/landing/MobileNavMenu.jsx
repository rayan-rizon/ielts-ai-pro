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
            className="fixed inset-0 top-14 sm:top-16 z-[90] bg-slate-950/70 backdrop-blur-xl lg:hidden"
            onClick={onClose}
          />

          {/* Compact mobile navigation card */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-3 right-3 mt-2 z-[99] overflow-hidden rounded-2xl border border-indigo-100/90 dark:border-indigo-900/40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl p-3.5 shadow-[0_25px_60px_-12px_rgba(99,102,241,0.18)] dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85)] lg:hidden"
          >
            {/* Top header bar */}
            <div className="flex items-center gap-1.5 border-b border-slate-100/80 pb-2.5 dark:border-slate-800/80">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-400/30">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                Menu
              </span>
            </div>

            {/* Links list */}
            <div className="mt-2 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 hover:bg-indigo-50/60 active:scale-[0.98] dark:hover:bg-slate-900/80"
                  >
                    <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-all duration-200">
                      {Icon ? <Icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-400/40 shadow-2xs">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                          {link.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 dark:text-slate-600 dark:group-hover:text-indigo-400 transition-all duration-150" />
                  </a>
                );
              })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-2.5 border-t border-slate-100/80 pt-2.5 dark:border-slate-800/80">
              <Button
                className="w-full h-10 rounded-xl font-extrabold text-xs shadow-md shadow-[#6256ef]/20 hover:shadow-lg hover:shadow-[#6256ef]/30 bg-[#6256ef] hover:bg-[#5246e0] text-white border-none transition-all duration-150 active:scale-[0.98] cursor-pointer"
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
