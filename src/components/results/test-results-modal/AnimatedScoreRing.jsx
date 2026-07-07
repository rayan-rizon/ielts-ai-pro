import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const getScoreColor = (score) => {
  if (score >= 7) {
    return {
      ring: 'text-emerald-500',
      glow: 'shadow-emerald-500/40',
      bg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500 to-teal-400',
    };
  }
  if (score >= 5.5) {
    return {
      ring: 'text-amber-500',
      glow: 'shadow-amber-500/40',
      bg: 'from-amber-500/20 via-orange-500/10 to-transparent',
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500 to-orange-400',
    };
  }
  return {
    ring: 'text-rose-500',
    glow: 'shadow-rose-500/40',
    bg: 'from-rose-500/20 via-pink-500/10 to-transparent',
    text: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-pink-400',
  };
};

export const AnimatedScoreRing = ({ percentage, score, size = 160 }) => {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div
      className="relative mx-auto flex items-center justify-center group"
      style={{ width: size, height: size }}
      data-oid="kjd989s"
    >
      {/* Outer glow aura */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-15 group-hover:opacity-30 transition-opacity duration-1000 bg-gradient-to-br',
          colors.bg
        )}
        data-oid="za3zjg3"
      />

      {/* Glassy background */}
      <div
        className="absolute inset-6 rounded-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 shadow-inner overflow-hidden"
        data-oid="v2y.czb"
      >
        <div
          className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', colors.gradient)}
          data-oid="hocau7x"
        />
      </div>

      <svg
        className="w-full h-full transform -rotate-90 relative z-10"
        viewBox={`0 0 ${size} ${size}`}
        data-oid="pt31-kv"
      >
        {/* Background track */}
        <circle
          className="text-slate-100 dark:text-slate-900"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="6eoax38"
        />

        {/* Progress tracks with multiple layers for depth */}
        <motion.circle
          className={cn('opacity-15', colors.ring)}
          strokeWidth="15"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.8, ease: 'circOut', delay: 0.2 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="3tx424b"
        />

        <motion.circle
          className={colors.ring}
          strokeWidth="10"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'circOut', delay: 0.3 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          data-oid="owoyocj"
        />
      </svg>

      {/* Score display */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        data-oid="5-9ck3e"
      >
        <span
          className={cn('text-4xl font-black tracking-tighter text-slate-900 dark:text-white')}
          data-oid="z0b3lmq"
        >
          {percentage}%
        </span>
        <span
          className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] mt-0.5"
          data-oid="om9jzeb"
        >
          ACCURACY
        </span>
      </motion.div>
    </div>
  );
};
