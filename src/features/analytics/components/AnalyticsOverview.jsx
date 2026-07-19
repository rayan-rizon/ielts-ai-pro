import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Clock3, Headphones, Mic2, PenLine, TimerReset } from 'lucide-react';
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
import RecentPracticeHistory from './RecentPracticeHistory';
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
    <CardHeader className="px-5 pb-2 pt-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-lg">
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
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
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const Icon = config.icon;

  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="relative h-[78px] w-[78px]">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx="36"
            cy="36"
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
        <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-slate-950 dark:text-white">
          {score == null ? '—' : formatBand(score)}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
        <span className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">
          {config.label}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold text-slate-400">
        {module.count ? `${module.count} scored` : 'No score'}
      </span>
    </div>
  );
}

function SectionPerformance({ moduleStats }) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <OverviewCard className="h-full">
        <PanelHeading
          icon={BarChart3}
          title="Section performance"
          description="Average band score in this period"
        />
        <CardContent className="grid grid-cols-2 gap-x-3 gap-y-5 px-5 pb-5 pt-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          {moduleStats.map((module) => (
            <BandRing key={module.type} module={module} />
          ))}
        </CardContent>
      </OverviewCard>
    </motion.div>
  );
}

function PacingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-white/10 dark:bg-slate-900">
      <p className="font-extrabold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 text-slate-500">You: {values.averageMinutes || '—'} min</p>
      <p className="text-slate-500">Ideal: {values.benchmarkMinutes} min</p>
    </div>
  );
}

function PacingChart({ efficiency }) {
  const data = useMemo(() => buildPacingSummary(efficiency), [efficiency]);
  const hasTiming = data.some((item) => item.averageMinutes != null);

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <OverviewCard className="h-full">
        <PanelHeading
          icon={TimerReset}
          title="Pacing chart"
          description="Your recorded time vs ideal test time"
        />
        <CardContent className="px-3 pb-4 pt-2 sm:px-5">
          {hasTiming ? (
            <>
              <div className="h-[240px] w-full" data-testid="analytics-pacing-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 10, right: 8, left: -18, bottom: 2 }}
                    barGap={2}
                    barCategoryGap="25%"
                  >
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
                    <Tooltip content={<PacingTooltip />} />
                    <Legend
                      iconType="square"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                    />
                    <Bar
                      dataKey="averageMinutes"
                      name="You"
                      fill="#7157f5"
                      radius={[7, 7, 2, 2]}
                      maxBarSize={26}
                    />
                    <Bar
                      dataKey="benchmarkMinutes"
                      name="Ideal"
                      fill="#c9bdfd"
                      fillOpacity={0.7}
                      radius={[7, 7, 2, 2]}
                      maxBarSize={26}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 px-1 sm:grid-cols-4">
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
                  return (
                    <div
                      key={item.type}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-2 py-2 text-center dark:border-white/5 dark:bg-white/[0.03]"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-200">
                        {status}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 px-2 text-[10px] font-medium leading-relaxed text-slate-400">
                Missing durations stay blank. Finishing faster is not automatically better; use this
                with accuracy and rushing insights below.
              </p>
            </>
          ) : (
            <div className="flex h-[270px] flex-col items-center justify-center text-center">
              <Clock3 className="mb-3 h-8 w-8 text-indigo-200" />
              <p className="font-bold text-slate-900 dark:text-white">No reliable timing data</p>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Complete a timed practice to compare your recorded pace.
              </p>
            </div>
          )}
        </CardContent>
      </OverviewCard>
    </motion.div>
  );
}

export default function AnalyticsOverview({ stats, chartData, user }) {
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
      <RecentPracticeHistory sessions={chartData.recentPractice || []} user={user} />
    </section>
  );
}
