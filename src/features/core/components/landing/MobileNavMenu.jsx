import React from 'react';
import { createPortal } from 'react-dom';
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
export default function MobileNavMenu({
  isOpen,
  onClose,
  links,
  isSignedIn,
  handlePrimaryCta,
  isScrolled,
}) {
  if (typeof document === 'undefined') return null;

  const menuTop = isScrolled ? 'top-16 sm:top-18' : 'top-14 sm:top-16';

  return createPortal(
    isOpen ? (
      <>
        {/* Darkened backdrop overlay starting below top navbar — a plain
              dim, not a page-wide blur; nothing needs to be legible through
              it, so there's nothing to blur. */}
        <div
          className={`fixed inset-0 ${menuTop} z-90 motion-safe:animate-in motion-safe:fade-in-0 bg-slate-950/60 duration-fast ease-out motion-reduce:animate-none lg:hidden`}
          onClick={onClose}
        />

        {/* Compact mobile navigation card. `top-16`/`top-18` reproduce
              the old `top-full` + `mt-2` gap under the (unscrolled) navbar
              height now that this sits outside the bar to measure against. */}
        <div
          id="public-navbar-menu"
          className={`fixed left-3 right-3 ${menuTop} z-99 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:will-change-[opacity,transform] overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-2 duration-medium ease-sidebar motion-reduce:animate-none dark:border-white/10 dark:bg-[#131315] sm:left-1/2 sm:right-auto sm:w-[min(28rem,calc(100vw-1.5rem))] sm:-translate-x-1/2 lg:hidden`}
        >
          {/* Links list */}
          <div className="space-y-0.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={onClose}
                  className="group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-[background-color,transform] duration-quick ease-sidebar motion-reduce:transition-none hover:bg-[#5a63df]/6 active:scale-[0.98] dark:hover:bg-white/5"
                >
                  {/* Compact Icon Chip with subtle soft glow shadow */}
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#5a63df]/20 bg-linear-to-br/srgb from-[#5a63df]/10 to-[#5a63df]/18 text-[#5a63df] transition-[transform,background-color,border-color,color,box-shadow] duration-quick ease-sidebar motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:border-transparent group-hover:bg-[#5a63df] group-hover:text-white group-hover:shadow-[0_4px_10px_-2px_rgba(90,99,223,0.22)] dark:border-[#8f97ff]/25 dark:from-[#8f97ff]/12 dark:to-[#8f97ff]/22 dark:text-[#a9afff] dark:group-hover:border-transparent dark:group-hover:bg-[#8f97ff] dark:group-hover:text-[#0b0c10] dark:group-hover:shadow-[0_4px_10px_-2px_rgba(143,151,255,0.22)]">
                    {/* Compact Icon glyph with gentle tilt interaction */}
                    {Icon ? (
                      <Icon className="relative z-10 h-3.5 w-3.5 transition-transform duration-quick ease-sidebar motion-reduce:transition-none group-hover:scale-105 group-hover:rotate-6 group-active:scale-95" />
                    ) : (
                      <Sparkles className="relative z-10 h-3.5 w-3.5 transition-transform duration-quick ease-sidebar motion-reduce:transition-none group-hover:scale-105 group-hover:rotate-6 group-active:scale-95" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-slate-900 transition-colors duration-quick ease-sidebar motion-reduce:transition-none group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#a9afff]">
                        {link.label}
                      </span>
                      {link.badge && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-300">
                          {link.badge}
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <p className="mt-0.5 truncate text-[10px] font-medium leading-tight text-slate-400 transition-colors duration-quick ease-sidebar motion-reduce:transition-none group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400">
                        {link.description}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 transition-[transform,color] duration-quick ease-sidebar motion-reduce:transition-none group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-600 dark:group-hover:text-[#a9afff]" />
                </a>
              );
            })}
          </div>

          {/* Bottom Call to Action */}
          <div className="mt-2 border-t border-[#eceafa] pt-2 dark:border-white/8">
            <Button
              className="w-full h-9 rounded-lg font-extrabold text-[11px] shadow-sm hover:shadow-md bg-[#5a63df] hover:bg-[#4a52c9] text-white border-none transition-[transform,background-color,box-shadow] duration-quick ease-sidebar motion-reduce:transition-none active:scale-[0.98] cursor-pointer"
              onClick={() => {
                onClose();
                handlePrimaryCta();
              }}
            >
              <span>{isSignedIn ? 'Go to Dashboard' : 'Start Free Practice'}</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </>
    ) : null,
    document.body
  );
}
