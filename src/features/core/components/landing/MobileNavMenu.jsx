import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Sparkles from 'lucide-react/icons/sparkles';
import ArrowRight from 'lucide-react/icons/arrow-right';
import { Button } from '@/components/ui/button';

/**
 * Solid, not frosted — same call every other panel in this app already makes
 * (`PANEL`: `bg-white dark:bg-[#131315]`, no blur, no translucency). A
 * translucent + blurred card chasing a glass look was two Chromium rendering
 * edge cases deep (nested `backdrop-filter`, and `backdrop-filter` under an
 * animated `transform`) for an effect nothing else on the site uses. Solid
 * removes the class of bug outright and reads as the same product as the
 * rest of the page instead of a different one glued on top of it.
 *
 * Still portalled to `document.body` — not for blur-sampling reasons anymore,
 * but because the navbar bar's own `backdrop-blur` redefines the containing
 * block for `position: fixed` descendants per spec, which otherwise makes
 * this popover position itself relative to the bar instead of the viewport.
 */
export default function MobileNavMenu({ isOpen, onClose, links, isSignedIn, handlePrimaryCta }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Darkened backdrop overlay starting below top navbar — a plain
              dim, not a page-wide blur; nothing needs to be legible through
              it, so there's nothing to blur. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 top-14 sm:top-16 z-90 bg-slate-950/60 lg:hidden"
            onClick={onClose}
          />

          {/* Compact mobile navigation card. `top-16`/`top-18` reproduce
              the old `top-full` + `mt-2` gap under the (unscrolled) navbar
              height now that this sits outside the bar to measure against. */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-3 right-3 top-16 z-99 overflow-hidden rounded-2xl border border-[#e4e2f0] bg-white p-3.5 shadow-xl shadow-black/8 dark:border-white/10 dark:bg-[#131315] dark:shadow-black/40 sm:top-18 lg:hidden"
          >
            {/* Top header bar */}
            <div className="flex items-center gap-1.5 border-b border-[#eceafa] pb-2.5 dark:border-white/8">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] transition-transform duration-300 hover:rotate-12 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14] dark:text-[#a9afff]">
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
                    className="group relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-200 ease-out hover:bg-[#5a63df]/6 active:scale-[0.98] dark:hover:bg-white/5"
                  >
                    {/* Compact Icon Chip with subtle soft glow shadow */}
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#5a63df]/20 bg-linear-to-br from-[#5a63df]/10 to-[#5a63df]/18 text-[#5a63df] transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-transparent group-hover:bg-[#5a63df] group-hover:text-white group-hover:shadow-[0_4px_10px_-2px_rgba(90,99,223,0.22)] dark:border-[#8f97ff]/25 dark:from-[#8f97ff]/12 dark:to-[#8f97ff]/22 dark:text-[#a9afff] dark:group-hover:border-transparent dark:group-hover:bg-[#8f97ff] dark:group-hover:text-[#0b0c10] dark:group-hover:shadow-[0_4px_10px_-2px_rgba(143,151,255,0.22)]">
                      {/* Compact Icon glyph with gentle tilt interaction */}
                      {Icon ? (
                        <Icon className="relative z-10 h-4 w-4 transition-transform duration-200 ease-out group-hover:scale-105 group-hover:rotate-6 group-active:scale-95" />
                      ) : (
                        <Sparkles className="relative z-10 h-4 w-4 transition-transform duration-200 ease-out group-hover:scale-105 group-hover:rotate-6 group-active:scale-95" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 transition-colors duration-200 group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#a9afff]">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-[10px] font-medium text-slate-400 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400 truncate">
                          {link.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-600 dark:group-hover:text-[#a9afff]" />
                  </a>
                );
              })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-2.5 border-t border-[#eceafa] pt-2.5 dark:border-white/8">
              <Button
                className="w-full h-10 rounded-xl font-extrabold text-xs shadow-sm hover:shadow-md bg-[#5a63df] hover:bg-[#4a52c9] text-white border-none transition-all duration-150 ease-sidebar active:scale-[0.98] cursor-pointer"
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
    </AnimatePresence>,
    document.body
  );
}
