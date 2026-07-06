import React from 'react';
import { m } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { ReadingInsightsCard } from './ReadingInsightsCard';

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

function ReadingHeaderLeft() {
  return (
    <div className="space-y-4 max-w-2xl" data-oid="ihd0sbo">
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/5 dark:bg-blue-400/10 border border-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
        data-oid="q:ms_70"
      >
        <Sparkles className="w-3 h-3" data-oid="agv7rce" />
        <span data-oid="eoq63i.">Premium Practice Hub</span>
      </m.div>

      <div className="space-y-2" data-oid="50ypi0v">
        <h1
          className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight"
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
          className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-lg"
          data-oid="5-rlh65"
        >
          Master the IELTS Reading section with our authentic, Cambridge-style practice materials.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center" data-oid="xlv0qgd">
        <StatChip
          icon={TrendingUp}
          iconBg="bg-blue-500"
          iconShadow="shadow-blue-500/20"
          value="87%"
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

export default function ReadingHeader({ totalPassages }) {
  return (
    <div
      className="relative group overflow-hidden rounded-[2.5rem] p-3 md:p-4 border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/80 dark:from-blue-500/5 dark:via-transparent dark:to-indigo-500/5 backdrop-blur-3xl shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20"
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
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
        data-oid="p.3vb3x"
      >
        <ReadingHeaderLeft />
        <ReadingInsightsCard totalPassages={totalPassages} />
      </div>
    </div>
  );
}
