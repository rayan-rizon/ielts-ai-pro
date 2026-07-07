import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PremiumUnlockOverlay = ({
  onUpgrade,
  title = 'Unlock Full Analysis',
  message = 'Get detailed insights and recommendations',
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4"
    data-oid="p3p:cgs"
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/40 text-center max-w-[280px]"
      data-oid="f9zsqf:"
    >
      {/* Gradient border effect */}
      <div
        className="absolute -inset-[1px] bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl -z-10 blur-sm opacity-40"
        data-oid="ihjxmbk"
      />

      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30 mb-4"
        data-oid="97dsxov"
      >
        <Crown className="w-7 h-7 text-white" data-oid="fd85n6r" />
      </motion.div>

      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2" data-oid="q_o0p4_">
        {title}
      </h4>
      <p
        className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed"
        data-oid="mf8zc55"
      >
        {message}
      </p>

      <Button
        onClick={onUpgrade}
        className="w-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white text-sm font-black h-11 rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95"
        data-oid="nq5k3wi"
      >
        <Sparkles className="w-4 h-4 mr-2" data-oid="bw07_n0" />
        Upgrade to Pro Plan
      </Button>
    </motion.div>
  </motion.div>
);
