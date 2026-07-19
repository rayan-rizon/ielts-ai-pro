import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PerformanceNarrative({ insights, stats }) {
  if (!insights) return null;

  const { correlations, strengths, trends } = insights;
  const hasData = strengths.length > 0 || correlations.length > 0 || trends.length > 0;

  if (!hasData) return null;

  // Generate a primary "Coach's Note" based on the data
  const getCoachNote = () => {
    if (correlations.length > 0) return correlations[0].text;
    if (trends.some((t) => t.type === 'negative'))
      return trends.find((t) => t.type === 'negative').text;
    if (strengths.length > 0)
      return `Excellent work in ${strengths[0].type}! Let's maintain this momentum.`;
    return "You're making steady progress. Keep up the consistent practice!";
  };

  const primaryTrend = trends[0]?.text;
  const topStrength = strengths[0]?.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full flex"
      data-oid="e3jx-n_"
    >
      <div
        className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-3 sm:p-3.5 flex flex-col justify-between gap-2 flex-1 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-0.5"
        data-oid="e8jjz6:"
      >
        {/* Decorative Grid Pattern & Soft Glows */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"
          data-oid="grid-pattern"
        />
        <div
          className="absolute top-0 right-0 w-48 h-48 bg-primary/10 dark:bg-primary/20 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none"
          data-oid="-wui6t8"
        />

        <div
          className="relative z-10 flex-1 flex flex-col justify-between gap-2"
          data-oid="fbx3.s6"
        >
          {/* Header section with Badges */}
          <div className="space-y-1.5" data-oid="yyy_1x7">
            <div className="flex flex-wrap items-center justify-between gap-1.5" data-oid="43pjler">
              <Badge
                className="bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-0 px-2 py-0.5 text-[9px] font-black tracking-wider rounded-full uppercase backdrop-blur-md"
                data-oid="_w_x39c"
              >
                <Sparkles
                  className="w-3 h-3 mr-1 text-indigo-500 dark:text-indigo-400 animate-pulse"
                  data-oid=".07d8q2"
                />
                Coach Update
              </Badge>

              <div
                className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"
                data-oid="u9etfhb"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                  data-oid="ht5j-:g"
                />
                Progressing
              </div>
            </div>

            {/* Coach Note Text */}
            <div className="space-y-1" data-oid="bad5ezr">
              <h2
                className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-relaxed"
                data-oid="xwk:5ak"
              >
                {getCoachNote()}
              </h2>

              {/* Score Improvement Badge */}
              {parseFloat(stats.improvement) > 0 && (
                <div className="inline-flex mt-1" data-oid="imp-wrapper">
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
                    data-oid="liu1z3e"
                  >
                    <TrendingUp
                      className="w-3 h-3 text-emerald-600 dark:text-emerald-500"
                      data-oid="fpdxuu9"
                    />
                    <span
                      className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider"
                      data-oid="aa80x1e"
                    >
                      {stats.improvement} Bands
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Strength/Trend section */}
          {(topStrength || primaryTrend) && (
            <div
              className="flex flex-wrap items-center gap-1.5 border-t border-border/30 pt-1.5"
              data-oid="coach-summary-grid"
            >
              {topStrength && (
                <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/10 shadow-sm">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Strongest:
                  </span>
                  <span className="text-[10px] font-black uppercase text-foreground">
                    {topStrength}
                  </span>
                </div>
              )}

              {primaryTrend && (
                <div className="flex items-center gap-1 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/10 shadow-sm">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Trend:
                  </span>
                  <span className="text-[10px] font-black uppercase text-foreground">
                    {primaryTrend}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
