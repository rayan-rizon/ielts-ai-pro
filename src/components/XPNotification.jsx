import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Trophy, Flame } from 'lucide-react';

export default function XPNotification({ show, xp, bonus, streak, onComplete }) {
  return (
    <AnimatePresence data-oid="r3sl_-2">
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 2000);
          }}
          data-oid="2fc2om."
        >
          <motion.div
            className="relative group"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            data-oid=":ser:tj"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-linear-to-br/srgb from-amber-400/20 via-orange-500/20 to-red-500/20 blur-3xl -z-10 group-hover:scale-110 transition-transform duration-500" />

            <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 px-10 py-8 rounded-4xl shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)] flex flex-col items-center gap-5 relative overflow-hidden">
              {/* Animated Inner Shine */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 blur-3xl rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <motion.div
                className="p-3 bg-linear-to-br/srgb from-amber-400 to-orange-500 rounded-2xl shadow-lg ring-4 ring-white/20"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                data-oid="hy1fdt1"
              >
                <Sparkles className="w-8 h-8 text-white" data-oid="c0jbtwr" />
              </motion.div>

              <div className="flex flex-col items-center">
                <motion.div
                  className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-br/srgb from-amber-400 via-orange-500 to-red-500 py-1"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  data-oid="r6s6hiq"
                >
                  +{xp} XP
                </motion.div>
                <motion.div
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Achievement Unlocked
                </motion.div>
              </div>

              {(bonus > 0 || streak > 1) && (
                <div className="flex flex-col gap-2 w-full min-w-[200px]">
                  {bonus > 0 && (
                    <motion.div
                      className="flex items-center justify-between gap-3 text-xs font-bold bg-amber-400/10 dark:bg-amber-400/5 border border-amber-400/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-xl"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      data-oid="q8r4cmy"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" data-oid="jz8guhu" />
                        <span>Perfect Bonus</span>
                      </div>
                      <span className="text-sm">+{bonus}</span>
                    </motion.div>
                  )}

                  {streak > 1 && (
                    <motion.div
                      className="flex items-center justify-between gap-3 text-xs font-bold bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-xl"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      data-oid="z1bhj07"
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" data-oid="khx:kv:" />
                        <span>{streak} Day Streak</span>
                      </div>
                      <Zap className="w-4 h-4 fill-orange-500 text-orange-500" />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
