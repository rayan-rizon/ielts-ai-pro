import React, { memo } from 'react';
import { m } from 'framer-motion';
import { Target, Clock, Flame, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Constants for animation
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

const StatsOverview = ({
  user,
  daysLeft,
  formattedTestDate,
  completionPercent,
  isGenerating,
  onUpdateStrategy,
}) => {
  return (
    <m.header variants={itemVariants} className="space-y-6" data-oid="ukmgwl0">
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        data-oid="-lj-hgc"
      >
        <div className="flex-1" data-oid="79n3pkt">
          <div className="flex items-center gap-3" data-oid="k78a47o">
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-full bg-primary/5 border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider"
              data-oid="vqmgkoy"
            >
              Your study plan
            </Badge>
            <Badge
              className="bg-white/60 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-wider"
              data-oid="uyq30_q"
            >
              Updates from your results
            </Badge>
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight"
            data-oid="_l.rujp"
          >
            Plan to reach{' '}
            <span className="text-indigo-600 dark:text-indigo-300 italic" data-oid="7v1kjn2">
              Band {user?.target_band_score || '—'}
            </span>
          </h1>
          <p
            className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-semibold max-w-2xl leading-relaxed"
            data-oid="iz-4xbc"
          >
            Use today’s focus, then follow the schedule. Save results to help the AI pick better
            tasks for your IELTS test.
          </p>
        </div>

        <div
          className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 w-full lg:w-auto"
          data-oid="krkn0uv"
        >
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -4 }}
            className={cn(
              'grid grid-cols-2 md:flex md:flex-row items-stretch md:items-center bg-white/90 dark:bg-slate-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/[0.08] rounded-2xl p-1',
              'shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] w-full xl:w-auto overflow-hidden',
              'hover:border-primary/30 dark:hover:border-primary/20 transition-all duration-300'
            )}
            data-oid="b:q:b7c"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-r border-b md:border-b-0 border-slate-100 dark:border-white/5"
              data-oid="gk-8.m9"
            >
              <div
                className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20"
                data-oid="xc2.8v4"
              >
                <Target
                  className="w-5 h-5 text-indigo-700 dark:text-indigo-300"
                  data-oid=".6w8-1d"
                />
              </div>
              <div className="flex flex-col" data-oid="0fh33x7">
                <span
                  className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none"
                  data-oid="x91lltb"
                >
                  Target
                </span>
                <span
                  className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none italic"
                  data-oid="ejm:i.j"
                >
                  Band {user?.target_band_score || '—'}
                </span>
              </div>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
              data-oid=":e6i55s"
            >
              <div
                className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20"
                data-oid="v2fe8z1"
              >
                <Clock
                  className="w-5 h-5 text-violet-700 dark:text-violet-300"
                  data-oid="pc7nr0p"
                />
              </div>
              <div className="flex flex-col" data-oid="bu224_4">
                <span
                  className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none"
                  data-oid="n1hxsk4"
                >
                  Exam
                </span>
                <span
                  className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                  data-oid=":ahzldb"
                >
                  {daysLeft === null ? '—' : `${daysLeft}d`}
                  {formattedTestDate ? (
                    <span
                      className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-2"
                      data-oid="t2z-7f0"
                    >
                      {formattedTestDate}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-3 border-r md:border-b-0 md:border-r border-slate-100 dark:border-white/5"
              data-oid="9z-32.3"
            >
              <div
                className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20"
                data-oid="18l3yle"
              >
                <Flame
                  className="w-5 h-5 text-orange-700 dark:text-orange-300 fill-orange-500/30"
                  data-oid="cwe67p0"
                />
              </div>
              <div className="flex flex-col" data-oid="cewdlog">
                <span
                  className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none"
                  data-oid="k2x:ed3"
                >
                  Streak
                </span>
                <span
                  className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                  data-oid="301ie_6"
                >
                  {user?.current_streak || 0}
                  <span
                    className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1"
                    data-oid="yghvtmg"
                  >
                    days
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3" data-oid="_p9nikn">
              <div
                className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20"
                data-oid="u3wlq27"
              >
                <CheckCircle2
                  className="w-5 h-5 text-emerald-700 dark:text-emerald-300"
                  data-oid="io8.gyo"
                />
              </div>
              <div className="flex flex-col" data-oid="07.--k_">
                <span
                  className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none"
                  data-oid="h__osjm"
                >
                  Today
                </span>
                <span
                  className="text-base font-black text-slate-900 dark:text-white mt-1 leading-none"
                  data-oid=":uma9_m"
                >
                  {completionPercent}%
                  <span
                    className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-2"
                    data-oid="xx3.dpc"
                  >
                    done
                  </span>
                </span>
              </div>
            </div>
          </m.div>

          <div className="flex flex-col items-stretch gap-2 xl:min-w-[220px]" data-oid="w0gkr6d">
            <Button
              onClick={onUpdateStrategy}
              disabled={isGenerating}
              className="h-12 px-6 rounded-2xl bg-slate-900 dark:bg-indigo-500 text-white font-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg dark:shadow-indigo-500/25 group overflow-hidden relative border-0"
              data-oid="568gw.m"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"
                data-oid="hto.k8_"
              />

              <span
                className="relative z-10 flex items-center gap-3 tracking-tight"
                data-oid="o7rwaog"
              >
                <RefreshCw
                  className={cn('w-4 h-4', isGenerating && 'animate-spin')}
                  data-oid="-2s617d"
                />

                {isGenerating ? 'Updating…' : 'Update plan'}
              </span>
            </Button>
            <div
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-right"
              data-oid=":_vz32n"
            >
              Use after completing practice or tests
            </div>
          </div>
        </div>
      </div>
    </m.header>
  );
};

export default memo(StatsOverview);
