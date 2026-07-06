import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { moduleConfig } from '../utils/moduleConfig';

/**
 * GlassCard - Premium glassmorphic card with hover animation
 */
export const GlassCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={cn(
      'relative overflow-hidden bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.45)] rounded-2xl',
      'hover:border-slate-300/90 dark:hover:border-slate-700/70 transition-all duration-300',
      'hover:shadow-[0_20px_48px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_24px_56px_rgba(168,85,247,0.15)]',
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
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] leading-none whitespace-nowrap',
        config.bg,
        config.color,
        config.border
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
