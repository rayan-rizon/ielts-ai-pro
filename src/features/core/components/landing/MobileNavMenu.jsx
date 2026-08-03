import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Sparkles from 'lucide-react/icons/sparkles';
import ArrowRight from 'lucide-react/icons/arrow-right';
import { Button } from '@/components/ui/button';

/**
 * Two compounding rendering bugs sat behind what should have been a one-line
 * "make the blur stronger" change, and both had to be fixed for the card's
 * glass background to actually render instead of showing the hero heading
 * through it at near-full strength:
 *
 * 1. This popover used to render inside the navbar's own "bar" element, which
 *    carries its own `backdrop-blur` for the frosted-navbar effect. A
 *    `backdrop-filter` element nested inside another `backdrop-filter`
 *    element is a genuine Chromium edge case — the inner one silently stops
 *    sampling the page behind it. Portalling to `document.body` removes it
 *    from that ancestor chain entirely.
 * 2. Framer Motion's slide-in (`y` + `scale`) is implemented as a CSS
 *    `transform`, and a `backdrop-filter` element under *any* transformed
 *    ancestor — including itself — hits the same sampling bug. The glass
 *    background and the animated content are two independent sibling layers
 *    below for exactly this reason: the background only ever animates
 *    `opacity` (never a transform), so it always has something stable to
 *    blur, while the content layer is free to slide and scale on top of it.
 */
export default function MobileNavMenu({ isOpen, onClose, links, isSignedIn, handlePrimaryCta }) {
  // The background layer has no content of its own, so nothing gives it a
  // height — it's measured off the content layer, since the links list
  // length (and so the card's height) isn't fixed.
  const contentRef = useRef(null);
  const [cardHeight, setCardHeight] = useState(null);

  useLayoutEffect(() => {
    if (!isOpen || !contentRef.current) return undefined;
    const el = contentRef.current;
    const measure = () => setCardHeight(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
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

          {/* Glass background — opacity-only, never transformed, so its blur
              stays reliable regardless of how the content on top of it moves.
              `cardHeight` (measured off the content layer) is what actually
              sizes it; `min-h` only covers the one frame before that
              measurement lands. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
            style={cardHeight ? { height: cardHeight } : undefined}
            className="fixed left-3 right-3 top-16 z-[98] min-h-[320px] overflow-hidden rounded-2xl border border-[#e4e2f0] bg-white/80 shadow-xl shadow-black/[0.08] backdrop-blur-3xl dark:border-white/[0.10] dark:bg-[#131315]/80 dark:shadow-black/40 sm:top-[4.5rem] lg:hidden"
          />

          {/* Content — the slide/scale entrance lives here, on top of (not
              inside) the glass layer above. `top-16`/`top-[4.5rem]`
              reproduce the old `top-full` + `mt-2` gap under the
              (unscrolled) navbar height now that this sits outside the bar
              to measure against. */}
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-3 right-3 top-16 z-[99] rounded-2xl p-3.5 sm:top-[4.5rem] lg:hidden"
          >
            {/* Top header bar */}
            <div className="flex items-center gap-1.5 border-b border-[#eceafa] pb-2.5 dark:border-white/[0.08]">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14] dark:text-[#a9afff]">
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
                    className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150 ease-sidebar hover:bg-[#5a63df]/[0.05] active:scale-[0.98] dark:hover:bg-white/[0.04]"
                  >
                    <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border border-[#5a63df]/15 bg-[#5a63df]/10 text-[#5a63df] transition-all duration-200 ease-sidebar group-hover:border-[#5a63df] group-hover:bg-[#5a63df] group-hover:text-white dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/[0.14] dark:text-[#a9afff] dark:group-hover:border-[#8f97ff] dark:group-hover:bg-[#8f97ff] dark:group-hover:text-[#131315]">
                      {Icon ? <Icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 transition-colors group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#a9afff]">
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300">
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

                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-150 ease-sidebar group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-600 dark:group-hover:text-[#a9afff]" />
                  </a>
                );
              })}
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-2.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.08]">
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
