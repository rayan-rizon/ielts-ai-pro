import React, { useMemo, useRef, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
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
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import { BAND_PROGRESS_TABS, buildBandProgressView } from './bandJourneyUtils';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { ACCENT, AXIS_TICK, BandTip, CURSOR, GRID_PROPS } from './chartKit';

const LABELS = {
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
  overall: 'Overall',
};

function ChangeBadge({ change, hasTrend }) {
  if (!hasTrend || change == null) {
    return <Pill tone="neutral">More results needed for a trend</Pill>;
  }
  const UpIcon = change >= 0 ? TrendingUp : TrendingDown;
  return (
    <Pill tone={change > 0 ? 'ok' : change < 0 ? 'fault' : 'neutral'}>
      <UpIcon className="h-3 w-3" />
      <span>
        Change {change > 0 ? '+' : ''}
        {formatBand(change)}
      </span>
    </Pill>
  );
}

function EmptyTrack({ overall, qualified }) {
  const locked = overall && !qualified;
  return (
    <div
      className={cn(
        WELL,
        'flex h-[210px] flex-col items-center justify-center rounded-lg px-5 text-center'
      )}
    >
      {locked ? (
        <LockKeyhole className="mb-2 h-5 w-5 text-slate-400 dark:text-slate-500" />
      ) : (
        <LineChartIcon className="mb-2 h-5 w-5 text-slate-400 dark:text-slate-500" />
      )}
      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
        {locked ? 'Overall needs all four modules' : 'No scored result in this period'}
      </p>
      <p className={cn('mt-1 max-w-md text-[11px] font-medium', MUTED)}>
        {locked
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
  const parsedTarget = Number(targetScore);
  const hasTarget = Number.isFinite(parsedTarget) && parsedTarget > 0;
  const targetAchieved = view.current != null && hasTarget && view.current >= parsedTarget;

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
    <m.div variants={ITEM_VARIANTS} className="h-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {/* No InfoTip here: this panel is rendered standalone in tests and by
                callers that do not mount a TooltipProvider. The line below carries
                the same explanation as plain text. */}
            <PanelTitle label="Band Progress" accent className="mb-1" />
            <p className={cn('text-[11px] font-medium', MUTED)}>
              Every point is one scored test. Each module tracks its own results, and Overall
              appears once all four are scored.
            </p>
          </div>
          {view.current != null ? (
            <div className={cn(TILE, 'shrink-0 px-3 py-1.5 text-right')}>
              <p className={cn(MICRO, MUTED)}>Latest</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-2xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
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
          className="no-scrollbar mt-3 flex items-center gap-1 overflow-x-auto rounded-lg border border-[#e2e5f2] bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04]"
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
                  'relative z-10 min-w-[70px] flex-1 shrink-0 rounded-md px-2.5 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-200',
                  isActive
                    ? 'bg-[#5a63df] text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                {LABELS[tab]}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex-1">
          {!view.qualified || view.series.length === 0 ? (
            <EmptyTrack overall={activeTab === 'overall'} qualified={view.qualified} />
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <ChangeBadge change={view.change} hasTrend={view.hasTrend} />
                {hasTarget ? (
                  <Pill tone={targetAchieved ? 'ok' : 'amber'}>
                    <Flag className="h-3 w-3" />
                    <span>
                      Target {formatBand(targetScore)}
                      {targetAchieved ? ' · Achieved!' : ''}
                    </span>
                  </Pill>
                ) : null}
              </div>
              <div className="h-[190px]" aria-label={`${LABELS[activeTab]} score history`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={view.series}
                    margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis
                      domain={[0, 9]}
                      ticks={[0, 3, 5, 7, 9]}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<BandTip />} cursor={CURSOR} />
                    {hasTarget ? (
                      <ReferenceLine
                        y={parsedTarget}
                        stroke="currentColor"
                        className="text-[rgb(var(--signal-warn))]"
                        strokeDasharray="4 4"
                      />
                    ) : null}
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={ACCENT}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#fff', stroke: ACCENT, strokeWidth: 2 }}
                      activeDot={{ r: 5.5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                      isAnimationActive={!reduceMotion}
                      animationDuration={650}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p
                className={cn(
                  MICRO,
                  MUTED,
                  'mt-2 border-t border-[#eceafa] pt-2 dark:border-white/[0.07]'
                )}
              >
                Dashed amber line is your target band.
              </p>
            </>
          )}
        </div>
      </section>
    </m.div>
  );
}
