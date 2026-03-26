import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PremiumLoading component for a polished, immersive loading experience.
 * Uses Framer Motion for smooth transitions and backdrop-blur for depth.
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
        {/* Animated Rings */}
        <div className="relative h-20 w-20 mb-8" data-oid="loader-rings">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            data-oid="ring-outer"
          />
          <motion.div
            className="absolute inset-2 rounded-full border-t-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            data-oid="ring-inner"
          />
          <div className="absolute inset-0 flex items-center justify-center" data-oid="loader-icon">
            <Loader2 className="h-6 w-6 text-primary animate-pulse" data-oid="loader-svg" />
          </div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center space-y-2"
          data-oid="loader-text"
        >
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
            {message}
          </h3>
          <p className="text-sm text-muted-foreground/80 font-medium animate-pulse">
            Please wait a moment
          </p>
        </motion.div>

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
          className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse duration-1000"
          data-oid="decor-2"
        />
      </div>
    </div>
  );
};

export default PremiumLoading;
