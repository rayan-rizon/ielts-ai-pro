import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { moduleConfig } from '../utils/moduleConfig';

/**
 * GlassCard - Premium glassmorphic card with hover animation
 */
export const GlassCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={cn(
      'relative overflow-hidden bg-white/95 dark:bg-slate-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] rounded-3xl',
      'hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300',
      className
    )}
    {...props}
    data-oid="x874170"
  >
    {children}
  </motion.div>
);

/**
 * ModuleBadge - Displays a badge for a specific module (Reading, Writing, etc.)
 */
export const ModuleBadge = ({ module }) => {
  const config = moduleConfig[module] || moduleConfig.reading;
  const Icon = config.icon;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight',
        config.bg,
        config.color
      )}
      data-oid="mfm7.p5"
    >
      <Icon className="w-3 h-3" data-oid="5:ncdj-" />
      {module}
    </div>
  );
};

/**
 * AnimatedNumber - Displays number with tabular-nums font
 */
export const AnimatedNumber = ({ value }) => {
  return (
    <span className="tabular-nums font-black" data-oid="27suun1">
      {value}
    </span>
  );
};

/**
 * SuccessParticles - Celebration particles animation
 */
export const SuccessParticles = ({ active }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" data-oid="manaq.f">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 1, y: 0, x: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            y: [0, -40, -60],
            x: [0, (i - 2.5) * 15, (i - 2.5) * 25],
          }}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
          data-oid="fx9pcqs"
        />
      ))}
    </div>
  );
};
