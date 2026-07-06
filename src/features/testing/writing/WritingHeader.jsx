import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { WritingInsightsCard } from './WritingInsightsCard';

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

function WritingHeaderLeft() {
  return (
    <div className="space-y-4 max-w-2xl" data-oid="3cn5nhl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-600/5 dark:bg-orange-400/10 border border-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
        data-oid="1lrleuj"
      >
        <Sparkles className="w-3 h-3" data-oid="kyxhk4b" />
        <span data-oid="abvnsmn">Premium Writing Hub</span>
      </motion.div>

      <div className="space-y-2" data-oid="4za07ag">
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
          data-oid="ex2pcv4"
        >
          Writing{' '}
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 dark:from-orange-400 dark:via-amber-400 dark:to-red-400"
            data-oid="hu7lx0z"
          >
            Library
          </span>
        </h1>
        <p
          className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
          data-oid="x09z8xk"
        >
          Master IELTS writing with structured tasks, expert templates, and instant AI feedback.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center" data-oid="gkcxyyh">
        <StatChip
          icon={TrendingUp}
          iconBg="bg-orange-500"
          iconShadow="shadow-orange-500/20"
          value="84%"
          label="Success"
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

export default function WritingHeader({ totalPassages }) {
  return (
    <div
      className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 dark:from-orange-500/5 dark:via-transparent dark:to-amber-500/5 backdrop-blur-3xl shadow-xl shadow-orange-500/10 dark:shadow-orange-500/20"
      data-oid="gkyc.o."
    >
      <div
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/5 to-transparent -z-10"
        data-oid="6m1s7rb"
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
        data-oid="ogrgxnp"
      />

      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
        data-oid="jz4eiud"
      >
        <WritingHeaderLeft />
        <WritingInsightsCard totalPassages={totalPassages} />
      </div>
    </div>
  );
}
