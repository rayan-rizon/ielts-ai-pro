import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { LogoIcon } from '@/components/shared/Logo';

/**
 * Global route-transition / initial-load fallback — the first thing a user
 * sees on nearly every navigation, so it uses the same page shell as every
 * other screen (dot-grid + soft glow on `#f8f8fb` / `#08080a`) rather than a
 * one-off backdrop-blur overlay. Pure CSS animation only — this sits on the
 * Suspense critical path, before framer-motion or any primitive bundle has
 * necessarily loaded.
 *
 * The mark itself carries the motion (see LogoIcon's built-in float/breathe
 * keyframes); a thin accent ring supplies the actual "this is loading"
 * affordance the logo's subtle animation doesn't read as on its own.
 *
 * `fullScreen` is portaled straight to `document.body` — not just given
 * `position: fixed` in place. `fixed` is only viewport-anchored when *no*
 * ancestor has a `transform`/`filter`/`perspective`/`will-change: transform`;
 * several call sites render this fallback inside an animated framer-motion
 * `m.div` (e.g. AdminPanel's tab-switch Suspense boundary), and Motion sets
 * an inline `transform` on the elements it animates. That silently turns
 * `fixed` into `absolute`-relative-to-that-ancestor, so the mark centered
 * correctly everywhere else but jumped to the top of that one animated
 * wrapper's (much shorter) box. A portal renders outside the whole React
 * tree's DOM position, so no ancestor — animated or not — can ever hijack
 * its containing block again. This is the standard fix full-screen
 * overlays use (Radix/Headless UI dialogs do the same) precisely because
 * `position: fixed` alone can't be trusted to stay viewport-relative in an
 * app that animates its layout.
 */
const PremiumLoading = ({ message = 'Loading', fullScreen = true, className }) => {
  const content = (
    <div
      className={cn(
        'animate-panel-in relative flex flex-col items-center justify-center bg-[#f8f8fb] dark:bg-[#08080a]',
        fullScreen ? 'fixed inset-0 z-100 h-full w-full' : 'min-h-screen w-full flex-1 py-12',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-[#5a63df]/15" />
          <span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#5a63df] animate-spin"
            style={{ animationDuration: '900ms' }}
          />
          <LogoIcon className="h-9 w-9" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );

  if (!fullScreen || typeof document === 'undefined') return content;
  return createPortal(content, document.body);
};

export default PremiumLoading;
