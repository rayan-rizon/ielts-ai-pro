import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PremiumLoading component for a polished, immersive loading experience.
 * Uses pure CSS animations to avoid importing framer-motion on the critical path.
 * This component is used as a Suspense fallback, so it MUST be lightweight.
 *
 * @param {string} message - Optional message to display below the loader.
 * @param {boolean} fullScreen - Whether to take up the full viewport.
 * @param {string} className - Additional CSS classes for the container.
 */
const PremiumLoading = ({ message = 'Verifying access...', fullScreen = true, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#050505]/50 backdrop-blur-xl z-[100]',
        fullScreen ? 'fixed inset-0 h-screen w-screen' : 'h-full w-full py-20',
        className
      )}
      data-oid="premium-loader"
    >
      <div className="relative flex flex-col items-center" data-oid="loader-container">
        {/* Animated Rings — CSS only */}
        <div className="relative h-20 w-20 mb-8" data-oid="loader-rings">
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"
            data-oid="ring-outer"
          />
          <div
            className="absolute inset-2 rounded-full border-t-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] animate-spin"
            style={{ animationDuration: '1.2s' }}
            data-oid="ring-inner"
          />
          <div className="absolute inset-0 flex items-center justify-center" data-oid="loader-icon">
            {/* Simple CSS spinner instead of Lucide Loader2 */}
            <div
              className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-pulse"
              data-oid="loader-dot"
            />
          </div>
        </div>

        {/* Text Content — CSS animation only */}
        <div className="text-center space-y-2 animate-fade-in" data-oid="loader-text">
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
            {message}
          </h3>
          <p className="text-sm text-muted-foreground/80 font-medium animate-pulse">
            Please wait a moment
          </p>
        </div>

        {/* Bottom Accent */}
        <div
          className="absolute -bottom-24 w-48 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm"
          data-oid="loader-accent"
        />
      </div>

      {/* Background Decorative Elements */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none -z-10"
        data-oid="decor-container"
      >
        <div
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"
          data-oid="decor-1"
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"
          style={{ animationDuration: '2s' }}
          data-oid="decor-2"
        />
      </div>
    </div>
  );
};

export default PremiumLoading;
