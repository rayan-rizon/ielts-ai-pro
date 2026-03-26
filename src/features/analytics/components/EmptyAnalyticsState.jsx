import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export default function EmptyAnalyticsState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-4 space-y-4',
        className
      )}
      data-oid="37mle7o"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="relative"
        data-oid="8eg:z6c"
      >
        {/* Decorative Background Glow */}
        <div
          className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"
          data-oid="42ftk-m"
        />

        {/* Animated Orbiting Elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 border-2 border-dashed border-primary/30 rounded-full pointer-events-none"
          data-oid="2duryko"
        />

        <div
          className="relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center backdrop-blur-xl group-hover:scale-110 transition-transform duration-500 z-10"
          data-oid="31m505t"
        >
          <Icon
            className="w-7 h-7 text-primary opacity-80 group-hover:opacity-100 transition-opacity"
            data-oid="34tpx_v"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 max-w-[280px]"
        data-oid="bljuvzt"
      >
        <h3
          className="text-xl font-black text-foreground tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          data-oid="losjyi:"
        >
          {title}
        </h3>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed" data-oid="4vykjsa">
          {description}
        </p>
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-oid="ujqyhfv"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
