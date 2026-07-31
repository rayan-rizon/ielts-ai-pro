import React, { useMemo } from 'react';
import { m } from 'framer-motion';
import { Activity } from 'lucide-react';
import {
  Area,
  AreaChart,
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
import {
  Delta,
  Empty,
  FootNum,
  MICRO,
  MUTED,
  PANEL,
  PanelFootnote,
  PanelTitle,
} from '@/features/dashboard/components/primitives';
import { ACCENT, AXIS_TICK, BandTip, CURSOR, GRID_PROPS } from '../chartKit';
import LockedFeature from './LockedFeature';

/**
 * Sliding segmented control.
 *
 * The old version repainted a solid indigo chip on the selected tab, which made
 * every switch a hard cut. A shared `layoutId` pill slides between tabs
 * instead, so the control reads as one object moving rather than five buttons
 * flashing — the only motion on this card that carries meaning.
 */
function ModuleTabs({ tabs, activeTab, setActiveTab, onKeyDown, tabsRef }) {
  return (
    <div
      ref={tabsRef}
      role="tablist"
      aria-label="Trend module"
      onKeyDown={onKeyDown}
      className="inline-flex shrink-0 gap-0.5 rounded-lg border border-[#ebeaf7] bg-[#f4f3fb] p-0.5 dark:border-white/10 dark:bg-white/[0.04]"
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab;
        const label = tab === 'overview' ? 'All' : tab.slice(0, 4);
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            data-tab={tab}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            title={tab === 'overview' ? 'All modules' : tab}
            className={cn(
              MICRO,
              'relative rounded-md px-2 py-1 capitalize transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50',
              isSelected
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            )}
          >
            {isSelected && (
              <m.span
                layoutId="trend-tab-pill"
                className="absolute inset-0 rounded-md bg-[#5a63df]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChartFrame({ children }) {
  return (
    <div className="h-[210px] w-full sm:h-[225px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const AXES = (
  <>
    <CartesianGrid {...GRID_PROPS} />
    <XAxis
      dataKey="date"
      axisLine={false}
      tickLine={false}
      tick={AXIS_TICK}
      dy={6}
      minTickGap={30}
      interval="preserveStartEnd"
    />
    <YAxis
      domain={[0, 9]}
      ticks={[0, 3, 6, 9]}
      axisLine={false}
      tickLine={false}
      tick={AXIS_TICK}
      width={26}
    />
  </>
);

export default function ProgressTrendCard({
  chartData,
  isPremium,
  activeTab,
  setActiveTab,
  tabs,
  onTabKeyDown,
  tabsRef,
  targetScore,
}) {
  const series = useMemo(
    () =>
      activeTab === 'overview'
        ? chartData?.history || []
        : chartData?.moduleHistory?.[activeTab] || [],
    [activeTab, chartData]
  );

  const change = useMemo(() => {
    if (series.length < 2) return null;
    return Number(series[series.length - 1].score) - Number(series[0].score);
  }, [series]);

  const target = Number(targetScore) || null;
  const locked = activeTab !== 'overview' && !isPremium;

  return (
    <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
      {/* Stacked below sm — five tabs plus a long title do not fit one line on
          a small phone, and a flex-1/min-w-0 title shrinks to fit rather than
          wrapping, which is what truncated it before this was split out. */}
      <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PanelTitle
          label="Progress trend"
          accent
          tip="Every scored result in this period, oldest to newest. Switch modules to isolate one skill."
          className="mb-0"
        />
        <ModuleTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onKeyDown={onTabKeyDown}
          tabsRef={tabsRef}
        />
      </div>

      <LockedFeature isLocked={locked} className="flex-1">
        {series.length < 2 ? (
          <Empty icon={Activity} className="flex-1 content-center">
            {series.length === 1
              ? 'One scored result so far. A second one draws the line.'
              : `No scored ${activeTab === 'overview' ? '' : `${activeTab} `}results in this period yet.`}
          </Empty>
        ) : (
          <ChartFrame>
            {activeTab === 'overview' ? (
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="analytics-trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                {AXES}
                <Tooltip content={<BandTip />} cursor={CURSOR} />
                {target ? (
                  <ReferenceLine
                    y={target}
                    stroke="currentColor"
                    className="text-[rgb(var(--signal-ok))]"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                ) : null}
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#analytics-trend-fill)"
                  dot={{ r: 2.5, fill: '#fff', stroke: ACCENT, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={650}
                />
              </AreaChart>
            ) : (
              <LineChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                {AXES}
                <Tooltip content={<BandTip />} cursor={CURSOR} />
                {target ? (
                  <ReferenceLine
                    y={target}
                    stroke="currentColor"
                    className="text-[rgb(var(--signal-ok))]"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#fff', stroke: ACCENT, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={650}
                />
              </LineChart>
            )}
          </ChartFrame>
        )}
      </LockedFeature>

      <PanelFootnote>
        {change != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Delta value={change} /> across <FootNum>{series.length}</FootNum> scored results
            {target ? <span className={cn(MICRO, MUTED)}>· dashed line is your target</span> : null}
          </span>
        ) : (
          'Score two results in this module to see movement.'
        )}
      </PanelFootnote>
    </section>
  );
}
