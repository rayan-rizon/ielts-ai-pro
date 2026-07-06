import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { SpeakingInsightsCard } from './SpeakingInsightsCard';

// ---------------------------------------------------------------------------
// Local sub-components
// ---------------------------------------------------------------------------

function StatChip({ icon: Icon, iconBg, iconShadow, value, label }) {
  return (
    <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 px-3 py-2 rounded-2xl shadow-sm backdrop-blur-xl">
      <div
        className={`w-7 h-7 rounded-lg ${iconBg} text-white flex items-center justify-center shadow-lg ${iconShadow}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <h4 className="text-base font-black text-slate-900 dark:text-white leading-none">
          {value}
        </h4>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

function SpeakingHeaderLeft() {
  return (
    <div className="space-y-4 max-w-2xl" data-oid="f0-1nmy">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/5 dark:bg-rose-400/10 border border-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
        data-oid="ba7l05n"
      >
        <Sparkles className="w-3 h-3" data-oid="wvccnu5" />
        <span data-oid="v67w132">Premium Interaction Hub</span>
      </motion.div>

      <div className="space-y-2" data-oid="-hc.:j7">
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
          data-oid="i49_317"
        >
          Speaking{' '}
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 dark:from-rose-400 dark:via-pink-400 dark:to-fuchsia-400"
            data-oid="1l-e4hf"
          >
            Library
          </span>
        </h1>
        <p
          className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
          data-oid="ghxze1t"
        >
          Enhance your speaking confidence with real-world scenarios and instant AI-driven
          performance insights.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center" data-oid="8cx_a2m">
        <StatChip
          icon={TrendingUp}
          iconBg="bg-rose-500"
          iconShadow="shadow-rose-500/20"
          value="78%"
          label="Fluency"
        />
        <StatChip
          icon={Award}
          iconBg="bg-amber-500"
          iconShadow="shadow-amber-500/20"
          value="Official"
          label="Content"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function SpeakingHeader({ totalPassages }) {
  return (
    <div
      className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-rose-200/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80 dark:from-rose-500/5 dark:via-transparent dark:to-pink-500/5 backdrop-blur-3xl shadow-xl shadow-rose-500/10 dark:shadow-rose-500/20"
      data-oid="55oqyi7"
    >
      <div
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rose-500/5 to-transparent -z-10"
        data-oid="qvxb36l"
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-rose-400/10 dark:bg-rose-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
        data-oid="5-2ceye"
      />
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
        data-oid="u4on23a"
      >
        <SpeakingHeaderLeft />
        <SpeakingInsightsCard totalPassages={totalPassages} />
      </div>
    </div>
  );
}
