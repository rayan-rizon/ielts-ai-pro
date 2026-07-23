import React from 'react';
import { m } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { ReadingInsightsCard } from './ReadingInsightsCard';
import ReadingFilters from './ReadingFilters';

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

function ReadingHeaderLeft() {
  return (
    <div className="space-y-2 max-w-2xl" data-oid="ihd0sbo">
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600/10 dark:bg-blue-400/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md"
        data-oid="q:ms_70"
      >
        <Sparkles className="w-3 h-3" data-oid="agv7rce" />
        <span data-oid="eoq63i.">Premium Practice Hub</span>
      </m.div>

      <div className="space-y-1" data-oid="50ypi0v">
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight"
          data-oid="fohbhse"
        >
          Reading{' '}
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400"
            data-oid="fz_0bs2"
          >
            Library
          </span>
        </h1>
        <p
          className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-xl"
          data-oid="5-rlh65"
        >
          Master the IELTS Reading section with authentic, Cambridge-style practice materials.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center pt-0.5" data-oid="xlv0qgd">
        <StatChip
          icon={TrendingUp}
          iconBg="bg-blue-500"
          iconShadow="shadow-blue-500/20"
          value="87%"
          label="Success Rate"
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

export default function ReadingHeader({
  totalPassages,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div
      className="relative group overflow-hidden rounded-2xl md:rounded-3xl px-4 sm:px-6 pt-3 sm:pt-3.5 pb-1.5 sm:pb-2 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-blue-500/5 dark:via-transparent dark:to-indigo-500/5 backdrop-blur-3xl shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10 space-y-2"
      data-oid="q3yh4__"
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent -z-10"
        data-oid="1cwgv0f"
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-[80px] -z-10 group-hover:scale-110 transition-transform duration-1000"
        data-oid="1_5wycc"
      />

      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10"
        data-oid="p.3vb3x"
      >
        <ReadingHeaderLeft />
        <ReadingInsightsCard totalPassages={totalPassages} />
      </div>

      {/* Unified Filter Row */}
      <div className="pt-1.5 sm:pt-2 border-t border-indigo-100/80 dark:border-white/10 relative z-10">
        <ReadingFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeTab={activeTab}
          onTabChange={onTabChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
}
