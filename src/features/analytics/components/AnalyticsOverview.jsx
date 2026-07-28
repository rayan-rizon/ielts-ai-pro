import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Clock3,
  Headphones,
  Info,
  Mic2,
  PenLine,
  TimerReset,
  Trophy,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { buildPacingSummary } from '../hooks/analyticsCalculations';
import { formatBand } from '../utils';
import ScoreForecast from './ScoreForecast';

const MODULE_UI = {
  reading: {
    label: 'Reading',
    icon: BookOpen,
    color: '#22a866',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  writing: {
    label: 'Writing',
    icon: PenLine,
    color: '#4f7df3',
    soft: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  },
  listening: {
    label: 'Listening',
    icon: Headphones,
    color: '#f5a742',
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  speaking: {
    label: 'Speaking',
    icon: Mic2,
    color: '#b85ed1',
    soft: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
  },
};

function OverviewCard({ children, className }) {
  return (
    <Card
      className={cn(
        'overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-950',
        className
      )}
    >
      {children}
    </Card>
  );
}

function PanelHeading({ icon: Icon, title, description, action }) {
  return (
    <CardHeader className="px-4 pb-1.5 pt-3.5 sm:px-4.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
    </CardHeader>
  );
}

function BandRing({ module }) {
  const config = MODULE_UI[module.type] || MODULE_UI.reading;
  const score = module.count > 0 ? Number(module.avg) : null;
  const progress = score == null ? 0 : Math.max(0, Math.min(100, (score / 9) * 100));
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const Icon = config.icon;

  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-gradient-to-b from-indigo-50/40 via-slate-50/60 to-slate-50/30 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-xs dark:border-white/10 dark:from-indigo-950/20 dark:via-slate-900/50 dark:to-slate-900/80">
      <div className="relative h-[62px] w-[62px] shrink-0">
        <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-200/70 dark:text-slate-800"
          />
          <motion.circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold tracking-tight text-slate-950 dark:text-white">
          {score == null ? '—' : formatBand(score)}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: config.color }} />
        <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
          {config.label}
        </span>
      </div>
      <span className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {module.count ? `${module.count} scored` : 'No score'}
      </span>
    </div>
  );
}

function SectionPerformance({ moduleStats }) {
  const scoredModules = useMemo(
    () =>
      moduleStats
        .filter((m) => m.count > 0 && m.avg != null)
        .map((m) => ({ ...m, score: Number(m.avg), label: MODULE_UI[m.type]?.label || m.type })),
    [moduleStats]
  );

  const bestModule = useMemo(() => {
    if (!scoredModules.length) return null;
    return [...scoredModules].sort((a, b) => b.score - a.score)[0];
  }, [scoredModules]);

  const weakestModule = useMemo(() => {
    if (scoredModules.length < 2) return null;
    const sorted = [...scoredModules].sort((a, b) => a.score - b.score);
    return sorted[0].type !== bestModule?.type ? sorted[0] : null;
  }, [bestModule, scoredModules]);

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <OverviewCard className="flex h-full flex-col justify-between">
        <PanelHeading
          icon={BarChart3}
          title="Section Performance"
          description="Average band score in this period"
        />
        <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5">
          <div className="grid grid-cols-2 gap-2.5">
            {moduleStats.map((module) => (
              <BandRing key={module.type} module={module} />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-gradient-to-r from-indigo-50/30 to-slate-50/50 p-2.5 dark:border-white/10 dark:from-indigo-950/20 dark:to-slate-900/40">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 shadow-xs dark:bg-indigo-950 dark:text-indigo-300">
                <Trophy className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Strongest Section
                </p>
                <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                  {bestModule
                    ? `${bestModule.label} (Band ${formatBand(bestModule.score)})`
                    : 'None scored yet'}
                </p>
              </div>
            </div>
            {weakestModule && (
              <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/80">
                Focus: {weakestModule.label}
              </span>
            )}
          </div>
        </CardContent>
      </OverviewCard>
    </motion.div>
  );
}

function PacingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const dataPoint = payload[0]?.payload;
  const isSingleBar = payload.length === 1;
  const hoveredItem = payload[0];

  if (isSingleBar && hoveredItem) {
    const isYou = hoveredItem.dataKey === 'averageMinutes';
    const val = hoveredItem.value;
    const delta = dataPoint?.deltaMinutes;

    return (
      <div className="min-w-[185px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full shadow-xs',
                isYou ? 'bg-[#4f46e5]' : 'bg-[#818cf8]'
              )}
            />
            <span className="text-xs font-bold text-slate-950 dark:text-white">
              {label} · {isYou ? 'Your Pace' : 'Test Limit'}
            </span>
          </div>
        </div>

        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
            <span className="font-semibold">{isYou ? 'Recorded Duration' : 'Standard Limit'}</span>
            <span className="font-bold text-slate-950 dark:text-white text-sm">
              {val != null ? `${val} min` : '—'}
            </span>
          </div>
          {isYou && delta != null && (
            <p className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5">
              {Math.abs(delta) <= 3
                ? 'On pace with benchmark'
                : delta > 0
                  ? `${delta}m over test limit`
                  : `${Math.abs(delta)}m under test limit`}
            </p>
          )}
          {!isYou && (
            <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 pt-0.5">
              Fixed 60-minute IELTS Reading cap
            </p>
          )}
        </div>
      </div>
    );
  }

  const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
  const youVal = values.averageMinutes;
  const idealVal = values.benchmarkMinutes;

  return (
    <div className="min-w-[185px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-xs" />
          <span className="text-xs font-bold text-slate-950 dark:text-white">{label}</span>
        </div>
      </div>

      <div className="mt-2 space-y-1.5 text-xs font-medium">
        <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#4f46e5]" />
            <span>You</span>
          </div>
          <span className="font-bold text-slate-950 dark:text-white">
            {youVal != null ? `${youVal} min` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#818cf8]" />
            <span>Test limit</span>
          </div>
          <span className="font-bold text-slate-950 dark:text-white">
            {idealVal != null ? `${idealVal} min` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function PacingChart({ efficiency }) {
  const data = useMemo(() => buildPacingSummary(efficiency), [efficiency]);
  const hasTiming = data.some((item) => item.averageMinutes != null);
  const readingData = data.find((item) => item.type === 'reading') || data[0];

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <OverviewCard className="flex h-full flex-col justify-between">
        <PanelHeading
          icon={TimerReset}
          title="Reading Duration"
          description="Recorded elapsed time vs 60-min test limit"
        />
        <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-2 sm:px-4.5 space-y-3">
          {hasTiming ? (
            <>
              <div className="h-[210px] sm:h-[230px] w-full" data-testid="analytics-pacing-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
                    barGap={8}
                    barCategoryGap="15%"
                  >
                    <defs>
                      <linearGradient id="pacingYouGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4338ca" />
                      </linearGradient>
                      <linearGradient id="pacingLimitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0e7ff" />
                        <stop offset="100%" stopColor="#c7d2fe" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.4}
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      unit="m"
                      domain={[0, 65]}
                    />
                    <Tooltip content={<PacingTooltip />} shared={false} cursor={false} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 6 }}
                      formatter={(value) => (
                        <span className="text-slate-700 dark:text-slate-200 font-bold text-xs ml-1">
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="averageMinutes"
                      name="You"
                      fill="url(#pacingYouGrad)"
                      radius={[6, 6, 2, 2]}
                      barSize={40}
                      className="cursor-pointer [&_rect]:transition-colors [&_rect]:duration-200 [&_rect:hover]:fill-[#3730a3]"
                    />
                    <Bar
                      dataKey="benchmarkMinutes"
                      name="Test Limit"
                      fill="url(#pacingLimitGrad)"
                      radius={[6, 6, 2, 2]}
                      barSize={40}
                      className="cursor-pointer [&_rect]:transition-colors [&_rect]:duration-200 [&_rect:hover]:fill-[#818cf8]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {readingData && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 w-full">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-center dark:border-white/10 dark:bg-slate-900/50">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Module
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                      Reading
                    </p>
                  </div>

                  <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1.5 text-center dark:border-indigo-800/40 dark:bg-indigo-950/40">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Your Duration
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {readingData.averageMinutes != null
                        ? `${readingData.averageMinutes} mins`
                        : '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-center dark:border-white/10 dark:bg-slate-900/50">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Test Limit
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                      {readingData.benchmarkMinutes} mins
                    </p>
                  </div>

                  {(() => {
                    const delta = readingData.deltaMinutes;
                    const statusText =
                      delta == null
                        ? 'No timing'
                        : Math.abs(delta) <= 3
                          ? 'On pace'
                          : delta > 0
                            ? `${delta}m over`
                            : `${Math.abs(delta)}m under`;

                    return (
                      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1.5 text-center dark:border-indigo-800/40 dark:bg-indigo-950/40">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Status
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">
                          {statusText}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
                <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Missing durations stay blank. Finishing faster is not automatically better.
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-center">
              <Clock3 className="mb-2 h-7 w-7 text-indigo-400" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">No timing data</p>
              <p className="mt-0.5 max-w-xs text-xs text-slate-500">
                Complete a timed Reading practice to compare the recorded duration.
              </p>
            </div>
          )}
        </CardContent>
      </OverviewCard>
    </motion.div>
  );
}

export default function AnalyticsOverview({ stats, chartData }) {
  if (!stats || !chartData) return null;
  return (
    <section className="space-y-4" aria-label="Analytics overview">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-4">
          <SectionPerformance moduleStats={stats.moduleStats || []} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <PacingChart efficiency={stats.efficiency || {}} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ScoreForecast forecastData={chartData.forecast || []} targetScore={stats.targetScore} />
        </div>
      </div>
    </section>
  );
}
