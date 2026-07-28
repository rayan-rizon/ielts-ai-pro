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
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
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
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const Icon = config.icon;

  return (
    <div className="flex min-w-0 flex-col items-center rounded-xl border border-slate-100/80 bg-gradient-to-b from-slate-50/70 to-slate-50/20 p-2 text-center transition-all duration-200 hover:border-violet-200/80 hover:shadow-xs dark:border-white/5 dark:from-white/[0.03] dark:to-transparent dark:hover:border-white/10">
      <div className="relative h-[52px] w-[52px]">
        <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-950 dark:text-white">
          {score == null ? '—' : formatBand(score)}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0" style={{ color: config.color }} />
        <span className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">
          {config.label}
        </span>
      </div>
      <span className="mt-0.5 text-[9.5px] font-semibold text-slate-400">
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
          title="Section performance"
          description="Average band score in this period"
        />
        <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5">
          <div className="grid grid-cols-2 gap-2">
            {moduleStats.map((module) => (
              <BandRing key={module.type} module={module} />
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-violet-100/80 bg-violet-50/50 p-2.5 dark:border-violet-500/15 dark:bg-violet-500/5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-xs dark:bg-slate-900 dark:text-violet-300">
                <Trophy className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Strongest Section
                </p>
                <p className="text-xs font-black text-slate-950 dark:text-white truncate">
                  {bestModule
                    ? `${bestModule.label} (Band ${formatBand(bestModule.score)})`
                    : 'None scored yet'}
                </p>
              </div>
            </div>
            {weakestModule && (
              <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 border border-amber-500/20">
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
  const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
  const youVal = values.averageMinutes;
  const idealVal = values.benchmarkMinutes;
  const delta = dataPoint?.deltaMinutes;

  const getPacingBadge = () => {
    if (delta == null)
      return {
        label: 'No timing',
        cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };
    if (Math.abs(delta) <= 3)
      return {
        label: 'On pace',
        cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      };
    if (delta > 0)
      return {
        label: `${delta}m over`,
        cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
      };
    return {
      label: `${Math.abs(delta)}m under`,
      cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    };
  };

  const badge = getPacingBadge();

  return (
    <div className="min-w-[185px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-violet-600 shadow-xs" />
          <span className="text-xs font-black text-slate-950 dark:text-white">{label}</span>
        </div>
        <span
          className={cn('rounded-full border px-2 py-0.5 text-[10px] font-extrabold', badge.cls)}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-2 space-y-1.5 text-xs font-medium">
        <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7157f5]" />
            <span>You</span>
          </div>
          <span className="font-black text-slate-950 dark:text-white">
            {youVal != null ? `${youVal} min` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#c9bdfd]" />
            <span>Test limit</span>
          </div>
          <span className="font-black text-slate-950 dark:text-white">
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

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <OverviewCard className="flex h-full flex-col justify-between">
        <PanelHeading
          icon={TimerReset}
          title="Reading duration"
          description="Recorded elapsed time vs the 60-minute test limit"
        />
        <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5">
          {hasTiming ? (
            <>
              <div className="h-[155px] sm:h-[165px] w-full" data-testid="analytics-pacing-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 6, right: 6, left: -22, bottom: 0 }}
                    barGap={2}
                    barCategoryGap="25%"
                  >
                    <defs>
                      <linearGradient id="pacingYouGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7157f5" />
                        <stop offset="100%" stopColor="#5539e2" />
                      </linearGradient>
                      <linearGradient id="pacingIdealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dcd3fe" />
                        <stop offset="100%" stopColor="#b8a6fc" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      unit="m"
                    />
                    <Tooltip
                      content={<PacingTooltip />}
                      cursor={{ fill: 'rgba(113, 87, 245, 0.08)', rx: 10, ry: 10 }}
                    />
                    <Legend
                      iconType="square"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 10, fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="averageMinutes"
                      name="You"
                      fill="url(#pacingYouGrad)"
                      radius={[6, 6, 2, 2]}
                      maxBarSize={22}
                      className="cursor-pointer transition-opacity duration-200 hover:fill-opacity-90"
                    />
                    <Bar
                      dataKey="benchmarkMinutes"
                      name="Test limit"
                      fill="url(#pacingIdealGrad)"
                      fillOpacity={0.8}
                      radius={[6, 6, 2, 2]}
                      maxBarSize={22}
                      className="cursor-pointer transition-opacity duration-200 hover:fill-opacity-90"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1.5 px-0.5 sm:grid-cols-4">
                {data.map((item) => {
                  const delta = item.deltaMinutes;
                  const status =
                    delta == null
                      ? 'No timing'
                      : Math.abs(delta) <= 3
                        ? 'On pace'
                        : delta > 0
                          ? `${delta}m over`
                          : `${Math.abs(delta)}m under`;

                  const badgeCls =
                    delta == null
                      ? 'border-slate-100 bg-slate-50/70 text-slate-500 dark:border-white/5 dark:bg-white/[0.03]'
                      : Math.abs(delta) <= 3
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : delta > 0
                          ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300';
                  return (
                    <div
                      key={item.type}
                      className={cn('rounded-lg border px-1.5 py-1 text-center', badgeCls)}
                    >
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[10px] font-black truncate">{status}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-100/80 bg-violet-50/60 p-1.5 text-[9.5px] font-medium leading-tight text-slate-500 dark:border-violet-500/10 dark:bg-violet-500/5 dark:text-slate-400">
                <Info className="h-3 w-3 shrink-0 text-violet-500" />
                <span>
                  Missing durations stay blank. Finishing faster is not automatically better.
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-[180px] flex-col items-center justify-center text-center">
              <Clock3 className="mb-2 h-7 w-7 text-indigo-200" />
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
