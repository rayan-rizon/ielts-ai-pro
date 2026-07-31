import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { BarChart3, BookOpen, Clock3, Headphones, Mic2, PenLine, Trophy } from 'lucide-react';
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { buildPacingSummary } from '../hooks/analyticsCalculations';
import { formatBand } from '../utils';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import SectionBreakdownCard from './SectionBreakdownCard';
import PracticeHabitsCard from './PracticeHabitsCard';

/**
 * Module icons are deliberately one calm tone rather than four.
 *
 * Colour on this page is reserved for meaning — amber marks the module to focus
 * on, green marks the strongest. Tinting each module its own hue as well turned
 * the panel into a rainbow and left the one signal that matters competing with
 * three that did not. The icon glyphs already distinguish the modules.
 */
const MODULE_UI = {
  reading: { label: 'Reading', icon: BookOpen, tone: 'neutral' },
  writing: { label: 'Writing', icon: PenLine, tone: 'neutral' },
  listening: { label: 'Listening', icon: Headphones, tone: 'neutral' },
  speaking: { label: 'Speaking', icon: Mic2, tone: 'neutral' },
};

/**
 * Ranked module comparison — weakest first.
 *
 * This replaces the old four-donut grid plus the radar chart, which drew the
 * exact same four numbers twice in the same row. Ordering weakest-to-strongest
 * turns the panel into an answer ("work on Listening") instead of a lookup
 * table the learner has to compare by eye.
 */
function ModuleRow({ module, isWeakest, isBest }) {
  const config = MODULE_UI[module.type] || MODULE_UI.reading;
  const score = module.count > 0 ? Number(module.avg) : null;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, (score / 9) * 100));

  return (
    <div className="flex items-center gap-2.5">
      <IconChip icon={config.icon} tone={config.tone} size="sm" />
      <div className={cn('relative h-8 flex-1 overflow-hidden rounded-md', WELL)}>
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-md transition-[width] duration-700',
            isWeakest ? 'bg-[rgb(var(--signal-warn)/0.18)]' : 'bg-[#5a63df]/[0.16]'
          )}
          style={{ width: `${pct}%` }}
        />
        <div className="relative flex h-full items-center justify-between gap-2 px-3">
          <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
            {config.label}
          </span>
          <span className={cn(MICRO, MUTED, 'shrink-0')}>
            {module.count ? (
              <>
                <span className={NUM}>{module.count}</span> scored
              </>
            ) : (
              'No score'
            )}
          </span>
        </div>
      </div>
      <span
        className={cn(
          NUM,
          'w-9 shrink-0 text-right text-sm font-bold',
          score == null ? 'text-slate-300 dark:text-slate-700' : 'text-slate-900 dark:text-slate-50'
        )}
      >
        {score == null ? '—' : formatBand(score)}
      </span>
      <span className="w-[68px] shrink-0 text-right">
        {isWeakest ? <Pill tone="warn">Focus</Pill> : isBest ? <Pill tone="ok">Best</Pill> : null}
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

  // Weakest first: the thing to act on should be the thing read first.
  const ordered = useMemo(() => {
    const withScore = [...scoredModules].sort((a, b) => a.score - b.score);
    const withoutScore = moduleStats.filter((m) => !(m.count > 0 && m.avg != null));
    return [...withScore, ...withoutScore];
  }, [moduleStats, scoredModules]);

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Which skill needs work"
          accent
          tip="Your average band per module in this period, weakest listed first."
        />

        {ordered.length === 0 ? (
          <Empty icon={BarChart3}>No module scores in this period yet.</Empty>
        ) : (
          <div className="space-y-2">
            {ordered.map((module) => (
              <ModuleRow
                key={module.type}
                module={module}
                isWeakest={weakestModule?.type === module.type}
                isBest={scoredModules.length > 1 && bestModule?.type === module.type}
              />
            ))}
          </div>
        )}

        <div className={cn(TILE, 'mt-3 flex items-center gap-2 p-2.5')}>
          <IconChip icon={Trophy} tone="accent" size="sm" />
          <p className={cn('min-w-0 text-[11px] font-medium', MUTED)}>
            {weakestModule ? (
              <>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {weakestModule.label}
                </span>{' '}
                is your lowest at band{' '}
                <span className={cn(NUM, 'font-bold')}>{formatBand(weakestModule.score)}</span> —
                practising it lifts your overall score fastest.
              </>
            ) : bestModule ? (
              <>
                Strongest so far is{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                  {bestModule.label}
                </span>{' '}
                at band <span className={cn(NUM, 'font-bold')}>{formatBand(bestModule.score)}</span>
                . Score another module to compare.
              </>
            ) : (
              'Complete a scored test in each module to see which one to prioritise.'
            )}
          </p>
        </div>
      </section>
    </m.div>
  );
}

function PacingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload;
  const delta = dataPoint?.deltaMinutes;

  return (
    <div className="min-w-[170px] rounded-lg border border-[#e4e2f0] bg-white p-2.5 shadow-lg dark:border-white/10 dark:bg-[#1b1a22]">
      <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            <span>{entry.dataKey === 'averageMinutes' ? 'You' : 'Test limit'}</span>
            <span className={cn(NUM, 'font-bold text-slate-900 dark:text-white')}>
              {entry.value != null ? `${entry.value} min` : '—'}
            </span>
          </div>
        ))}
      </div>
      {delta != null && (
        <p className={cn(MICRO, 'mt-1.5 text-[#5a63df] dark:text-[#a9afff]')}>
          {Math.abs(delta) <= 3
            ? 'On pace with the limit'
            : delta > 0
              ? `${delta}m over the limit`
              : `${Math.abs(delta)}m under the limit`}
        </p>
      )}
    </div>
  );
}

function PacingChart({ efficiency }) {
  const data = useMemo(() => buildPacingSummary(efficiency), [efficiency]);
  const hasTiming = data.some((item) => item.averageMinutes != null);
  const readingData = data.find((item) => item.type === 'reading') || data[0];
  const delta = readingData?.deltaMinutes;
  const statusText =
    delta == null
      ? 'No timing'
      : Math.abs(delta) <= 3
        ? 'On pace'
        : delta > 0
          ? `${delta}m over`
          : `${Math.abs(delta)}m under`;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Are you finishing in time"
          tip="Your recorded Reading duration against the 60-minute exam limit."
          action={
            hasTiming && delta != null ? (
              // Running over the limit is a caution, not a failure — amber, not red.
              <Pill tone={Math.abs(delta) <= 3 ? 'ok' : 'warn'}>{statusText}</Pill>
            ) : null
          }
        />

        {hasTiming ? (
          <>
            <div className="h-[190px] w-full" data-testid="analytics-pacing-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                  barGap={6}
                  barCategoryGap="22%"
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    unit="m"
                    domain={[0, 65]}
                  />
                  <Tooltip content={<PacingTooltip />} cursor={false} />
                  <RBar
                    dataKey="averageMinutes"
                    name="You"
                    fill="#5a63df"
                    radius={[4, 4, 2, 2]}
                    barSize={26}
                  />
                  <RBar
                    dataKey="benchmarkMinutes"
                    name="Test limit"
                    fill="#c9cdf3"
                    radius={[4, 4, 2, 2]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
                <span className="h-2 w-2 rounded-full bg-[#5a63df]" /> You
              </span>
              <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
                <span className="h-2 w-2 rounded-full bg-[#c9cdf3]" /> Test limit
              </span>
            </div>

            <PanelFootnote>
              Finishing faster is not automatically better. Missing durations stay blank.
            </PanelFootnote>
          </>
        ) : (
          <Empty icon={Clock3}>
            Complete a timed Reading practice to compare your duration with the exam limit.
          </Empty>
        )}
      </section>
    </m.div>
  );
}

export default function AnalyticsOverview({ stats, chartData }) {
  if (!stats || !chartData) return null;
  return (
    <section className="grid grid-cols-12 gap-3" aria-label="Analytics overview">
      <div className="col-span-12 lg:col-span-7">
        <SectionPerformance moduleStats={stats.moduleStats || []} />
      </div>
      <div className="col-span-12 lg:col-span-5">
        <PacingChart efficiency={stats.efficiency || {}} />
      </div>

      <div className="col-span-12 lg:col-span-6">
        <SectionBreakdownCard sectionPerformance={stats.sectionPerformance || []} />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <PracticeHabitsCard
          practiceRhythm={stats.practiceRhythm}
          behaviour={stats.enhancedMetrics?.behaviour}
        />
      </div>
    </section>
  );
}
