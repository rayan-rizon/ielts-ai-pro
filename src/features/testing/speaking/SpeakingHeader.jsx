import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { SpeakingInsightsCard } from './SpeakingInsightsCard';
import SpeakingFilters from './SpeakingFilters';

function StatChip({ icon: Icon, iconBg, iconShadow, value, label }) {
  return (
    <div className="inline-flex items-center gap-2.5 bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 px-3.5 py-1.5 rounded-full shadow-2xs backdrop-blur-xl">
      <div
        className={`w-7 h-7 rounded-full ${iconBg} text-white flex items-center justify-center shrink-0 shadow-xs ${iconShadow}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">
          {value}
        </span>
        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}

function SpeakingHeaderLeft() {
  return (
    <div className="space-y-2 max-w-2xl" data-oid="f0-1nmy">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/10 dark:bg-rose-400/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md"
        data-oid="ba7l05n"
      >
        <Sparkles className="w-3 h-3" data-oid="wvccnu5" />
        <span data-oid="v67w132">Premium Interaction Hub</span>
      </motion.div>

      <div className="space-y-1" data-oid="-hc.:j7">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight"
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
          className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl"
          data-oid="ghxze1t"
        >
          Enhance your speaking confidence with real-world scenarios and instant AI-driven
          performance insights.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center pt-0.5" data-oid="8cx_a2m">
        <StatChip
          icon={TrendingUp}
          iconBg="bg-rose-500"
          iconShadow="shadow-rose-500/20"
          value="78%"
          label="Fluency Rate"
        />
        <StatChip
          icon={Award}
          iconBg="bg-amber-500"
          iconShadow="shadow-amber-500/20"
          value="Official"
          label="Cambridge Content"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export - Unified Header + Filter Bar
// ---------------------------------------------------------------------------

export default function SpeakingHeader({
  totalPassages,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  tabs,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className="relative group overflow-hidden rounded-2xl md:rounded-3xl px-4 sm:px-6 pt-3 sm:pt-3.5 pb-1.5 sm:pb-2 border border-rose-200/60 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/80 via-white to-pink-50/80 dark:from-rose-500/5 dark:via-transparent dark:to-pink-500/5 backdrop-blur-3xl shadow-xl shadow-rose-500/5 dark:shadow-rose-500/10 space-y-2"
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
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10"
        data-oid="u4on23a"
      >
        <SpeakingHeaderLeft />
        <SpeakingInsightsCard totalPassages={totalPassages} />
      </div>

      {/* Unified Filter Row */}
      {tabs && (
        <div className="pt-1.5 sm:pt-2 border-t border-rose-100/80 dark:border-white/10 relative z-10">
          <SpeakingFilters
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            activeTab={activeTab}
            onTabChange={onTabChange}
            tabs={tabs}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>
      )}
    </div>
  );
}
