import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Flag,
  LineChart as LineChartIcon,
  LockKeyhole,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import { BAND_PROGRESS_TABS, buildBandProgressView } from './bandJourneyUtils';

const LABELS = {
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
  overall: 'Overall',
};

function ChangeBadge({ change, hasTrend }) {
  if (!hasTrend || change == null) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
        More results needed for a trend
      </span>
    );
  }
  const UpIcon = change >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
        change > 0
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
          : change < 0
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
      )}
    >
      <UpIcon className="h-3.5 w-3.5" />
      Change {change > 0 ? '+' : ''}
      {formatBand(change)}
    </span>
  );
}

function EmptyTrack({ overall, qualified }) {
  return (
    <div className="flex h-[210px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
      {overall && !qualified ? (
        <LockKeyhole className="mb-2 h-7 w-7 text-indigo-500" />
      ) : (
        <LineChartIcon className="mb-2 h-7 w-7 text-indigo-500" />
      )}
      <p className="text-sm font-bold text-slate-950 dark:text-white">
        {overall && !qualified
          ? 'Overall needs all four modules'
          : 'No scored result in this period'}
      </p>
      <p className="mt-1 max-w-md text-xs font-medium text-slate-500 dark:text-slate-400">
        {overall && !qualified
          ? 'Complete a scored Reading, Writing, Listening and Speaking test to see an Overall estimate.'
          : 'Complete a scored test in this module to start its progress line.'}
      </p>
    </div>
  );
}

export default function BandScoreJourney({
  moduleHistory = {},
  overallProgress = {},
  targetScore,
}) {
  const [activeTab, setActiveTab] = useState('reading');
  const tabsRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const view = useMemo(
    () => buildBandProgressView({ tab: activeTab, moduleHistory, overallProgress }),
    [activeTab, moduleHistory, overallProgress]
  );
  const targetAchieved =
    view.current != null &&
    Number.isFinite(Number(targetScore)) &&
    view.current >= Number(targetScore);

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = BAND_PROGRESS_TABS.indexOf(activeTab);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? BAND_PROGRESS_TABS.length - 1
          : event.key === 'ArrowLeft'
            ? (index - 1 + BAND_PROGRESS_TABS.length) % BAND_PROGRESS_TABS.length
            : (index + 1) % BAND_PROGRESS_TABS.length;
    const next = BAND_PROGRESS_TABS[nextIndex];
    setActiveTab(next);
    tabsRef.current?.querySelector(`[data-band-tab="${next}"]`)?.focus();
  };

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="h-full overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5862df] dark:text-indigo-400">
                  Real Scored Results
                </p>
                <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  Band Progress
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Each module uses its own results. Overall is calculated when all four are ready.
                </p>
              </div>
              {view.current != null ? (
                <div className="text-right bg-[#efedff]/60 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-[#5862df]/15">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-[#5862df] dark:text-indigo-300">
                    Latest
                  </p>
                  <p className="text-2xl font-black text-slate-950 dark:text-white leading-none mt-0.5">
                    {formatBand(view.current)}
                  </p>
                </div>
              ) : null}
            </div>

            <div
              ref={tabsRef}
              role="tablist"
              aria-label="Band progress module"
              onKeyDown={onKeyDown}
              className="mt-3.5 flex items-center gap-1 rounded-[16px] border border-[#d8dcfa] dark:border-white/10 bg-white/80 dark:bg-white/5 p-1 overflow-x-auto no-scrollbar"
            >
              {BAND_PROGRESS_TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    data-band-tab={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center',
                      isActive
                        ? 'bg-[#5661e9] text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                    )}
                  >
                    {LABELS[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5">
            {!view.qualified || view.series.length === 0 ? (
              <EmptyTrack overall={activeTab === 'overall'} qualified={view.qualified} />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <ChangeBadge change={view.change} hasTrend={view.hasTrend} />
                  {Number.isFinite(Number(targetScore)) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-500/20">
                      <Flag className="h-3.5 w-3.5" />
                      Target {formatBand(targetScore)}
                      {targetAchieved ? ' · Achieved!' : ''}
                    </span>
                  ) : null}
                </div>
                <div className="h-[190px]" aria-label={`${LABELS[activeTab]} score history`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={view.series}
                      margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 9]}
                        ticks={[0, 3, 5, 7, 9]}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`Band ${formatBand(value)}`, LABELS[activeTab]]}
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      />
                      {Number.isFinite(Number(targetScore)) ? (
                        <ReferenceLine
                          y={Number(targetScore)}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                        />
                      ) : null}
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#5661e9"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#5661e9' }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={!reduceMotion}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
