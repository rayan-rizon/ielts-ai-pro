import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1 mb-4"
      data-oid="e3jx-n_"
    >
      <div
        className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-primary/10 dark:border-white/5 p-4 md:p-6 backdrop-blur-3xl shadow-xl transition-all hover:bg-white/80 dark:hover:bg-slate-900/50"
        data-oid="e8jjz6:"
      >
        {/* Subtle Decorative Glows */}
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-primary/10 dark:bg-primary/15 rounded-full blur-[80px] -mr-32 -mt-32"
          data-oid="-wui6t8"
        />

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 relative z-10" data-oid="fbx3.s6">
          {/* Primary Insight Section */}
          <div className="flex-[1.8] space-y-3" data-oid="yyy_1x7">
            <div className="flex flex-wrap items-center gap-2" data-oid="43pjler">
              <Badge
                className="bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary border-primary/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] rounded-full backdrop-blur-md"
                data-oid="_w_x39c"
              >
                <Sparkles className="w-3 h-3 mr-1.5 animate-pulse" data-oid=".07d8q2" />
                Daily Brief
              </Badge>
              {correlations.length > 0 && (
                <Badge
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] rounded-full backdrop-blur-md"
                  data-oid="x0uh1ed"
                >
                  <Zap className="w-3 h-3 mr-1.5" data-oid="wj1uomz" />
                  Pattern Detected
                </Badge>
              )}
            </div>

            <div className="space-y-2.5" data-oid="bad5ezr">
              <h2
                className="text-lg md:text-xl lg:text-2xl font-black text-foreground dark:text-white tracking-tight leading-[1.2]"
                data-oid="xwk:5ak"
              >
                {getCoachNote()}
              </h2>
              <div className="flex flex-wrap items-center gap-3" data-oid=":ry3dbs">
                <div
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground"
                  data-oid="u9etfhb"
                >
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    data-oid="ht5j-:g"
                  />
                  Status:{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1" data-oid=":8vu_bb">
                    Growth Phase
                  </span>
                </div>
                {parseFloat(stats.improvement) > 0 && (
                  <div
                    className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                    data-oid="liu1z3e"
                  >
                    <TrendingUp
                      className="w-3 h-3 text-emerald-600 dark:text-emerald-500"
                      data-oid="fpdxuu9"
                    />

                    <span
                      className="text-[11px] font-black text-emerald-600 dark:text-emerald-500"
                      data-oid="aa80x1e"
                    >
                      +{stats.improvement} Bands
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Cards Section - More compact grid */}
          <div
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 self-center"
            data-oid="oeew61c"
          >
            {correlations.slice(0, 2).map((corr, idx) => (
              <motion.div
                key={corr.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="group/card relative overflow-hidden bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 hover:border-primary/30 p-3.5 rounded-xl transition-all duration-300"
                data-oid="x207u:y"
              >
                <div className="flex items-center gap-2.5 mb-1.5" data-oid="7fnd2az">
                  <div
                    className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20"
                    data-oid="8sk3-md"
                  >
                    <Zap className="w-3 h-3" data-oid="1-yrd4q" />
                  </div>
                  <span
                    className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/80"
                    data-oid="p0s2a4a"
                  >
                    {corr.title || 'DETECTION'}
                  </span>
                </div>
                <p
                  className="text-[12px] font-bold text-slate-700 dark:text-slate-300 leading-snug line-clamp-1"
                  data-oid=":t2e9fc"
                >
                  {corr.text}
                </p>
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover/card:w-full transition-all duration-500"
                  data-oid="9g.f2.x"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
