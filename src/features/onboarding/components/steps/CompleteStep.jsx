import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Star } from 'lucide-react';

export default function CompleteStep({ targetBandScore }) {
  return (
    <div className="text-center space-y-10 py-10" data-oid="g36r_4y">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative w-32 h-32 mx-auto"
        data-oid="dzju5wb"
      >
        <div
          className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full animate-pulse"
          data-oid="377f25r"
        />
        <div
          className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white/20"
          data-oid="rppej60"
        >
          <Rocket
            className="w-14 h-14 text-white transform translate-x-[2px] -translate-y-[2px]"
            data-oid="fm:c_5v"
          />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 rounded-xl shadow-lg border-2 border-white flex items-center justify-center"
          data-oid="dik0yyx"
        >
          <Star className="w-5 h-5 text-white fill-white" data-oid="sde2p95" />
        </motion.div>
      </motion.div>

      <div className="space-y-3" data-oid="aekf2j7">
        <h3
          className="text-3xl font-black tracking-tighter text-foreground dark:text-white"
          data-oid="s8x9znw"
        >
          You're All Set!
        </h3>
        <p
          className="text-muted-foreground dark:text-slate-300 text-base px-8 leading-snug"
          data-oid="ly-4cjt"
        >
          Your personalized path to{' '}
          <span
            className="text-foreground dark:text-white font-black underline decoration-primary decoration-4"
            data-oid=":k9yeoo"
          >
            Band {targetBandScore.toFixed(1)}
          </span>{' '}
          is ready. Let's make it happen.
        </p>
      </div>
    </div>
  );
}
