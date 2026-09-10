import React, { useMemo } from 'react';
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
import {
  ACCENT,
  Delta,
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  TILE,
} from './primitives';

// A literal SVG fill, not a Tailwind class — recharts writes this straight onto
// the tick <text> element, so a CSS var is the only way to have it track theme.
// The old hardcoded #94a3b8 read at ~2.8:1 on the dark panel, under the 3:1 floor
// for non-text UI.
const AXIS_TICK = { fontSize: 10, fontWeight: 700, fill: 'rgb(var(--chart-axis))' };

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 shadow-xs dark:border-white/[0.14] dark:bg-[#242427]">
      <p className={cn(MICRO, MUTED, 'capitalize')}>
        {point.module || 'Test'} · {point.dateLabel}
      </p>
      <p className={cn(NUM, 'mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50')}>
        {point.score.toFixed(1)} <span className={cn(MICRO, MUTED)}>band</span>
      </p>
    </div>
  );
}

/**
 * Every other time-series on this page measures effort — tests per day, days
 * practised. This one measures the only outcome a candidate is actually graded
 * on: the band, test by test, against the target they set.
 *
 * The trend footnote compares the first and last scored test in the window. It
 * is a measured difference, never an extrapolation — the dashboard does not
 * predict an exam-day band it cannot know.
 */
function calculateDomain(data, target) {
  const scaleValues = data.map((point) => point.score);
  if (target != null) scaleValues.push(target);
  if (!scaleValues.length) return { domainFloor: 0, domainCeil: 9 };

  const minVal = Math.min(...scaleValues);
  const maxVal = Math.max(...scaleValues);
  return {
    domainFloor: Math.max(0, Math.floor(minVal - 0.5)),
    domainCeil: Math.min(9, Math.ceil(maxVal + 0.5)),
  };
}

function parseTargetScore(stats) {
  const parsedTarget = Number(stats?.targetScore);
  return Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;
}

function formatScoredTests(recentTests) {
  const scored = (Array.isArray(recentTests) ? recentTests : [])
    .filter((test) => Number.isFinite(Number(test?.score)) && test?.completed_at)
    .slice()
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    .map((test) => ({
      score: Number(test.score),
      module: String(test.test_type || '').toLowerCase(),
      dateLabel: new Date(test.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    }));

  return {
    data: scored,
    change: scored.length >= 2 ? scored[scored.length - 1].score - scored[0].score : null,
  };
}

function StepOneTile({ hasOneTest, firstScore, firstModule }) {
  const containerClass = hasOneTest
    ? 'border-[rgb(var(--signal-ok)/0.35)] bg-[rgb(var(--signal-ok)/0.04)] dark:bg-[rgb(var(--signal-ok)/0.08)]'
    : 'border-[#e4e2f0] dark:border-white/10';

  const badgeClass = hasOneTest
    ? 'bg-[rgb(var(--signal-ok))] text-white'
    : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/20 dark:text-[#afb5ff]';

  const title = hasOneTest
    ? `Baseline anchored: Band ${firstScore}`
    : 'Take first test to set baseline';

  const subtitle = hasOneTest
    ? `${firstModule} paper recorded`
    : 'One scored test anchors your starting band';

  return (
    <div className={cn(TILE, 'flex items-center gap-3 p-2.5', containerClass)}>
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
          NUM,
          badgeClass
        )}
      >
        {hasOneTest ? '✓' : '1'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
          {title}
        </p>
        <p className={cn(MICRO, MUTED, 'mt-0.5')}>{subtitle}</p>
      </div>
    </div>
  );
}

function StepTwoTile({ hasOneTest, target }) {
  const containerClass = hasOneTest
    ? 'border-[#5a63df]/30 bg-[#5a63df]/[0.03] dark:bg-[#8f97ff]/[0.06]'
    : 'border-[#ebeaf7] opacity-75 dark:border-white/8';

  const badgeClass = hasOneTest
    ? 'bg-[#5a63df] text-white'
    : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400';

  const title = hasOneTest ? 'Score a second test to draw trend' : 'Plot score trajectory & deltas';

  const subtitle =
    target != null ? `Target goal: Band ${target.toFixed(1)}` : 'Reveals progress slope';

  return (
    <div className={cn(TILE, 'flex items-center gap-3 p-2.5', containerClass)}>
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
          NUM,
          badgeClass
        )}
      >
        2
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
          {title}
        </p>
        <p className={cn(MICRO, MUTED, 'mt-0.5')}>{subtitle}</p>
      </div>
    </div>
  );
}

function BandTrajectoryEmptySteps({ data, target }) {
  const hasOneTest = data.length === 1;
  const firstScore = hasOneTest ? data[0].score.toFixed(1) : null;
  const firstModule = hasOneTest ? data[0].module || 'First' : null;

  return (
    <div className="flex flex-1 flex-col justify-center gap-2.5 py-1">
      <StepOneTile hasOneTest={hasOneTest} firstScore={firstScore} firstModule={firstModule} />
      <StepTwoTile hasOneTest={hasOneTest} target={target} />
    </div>
  );
}

function TrajectoryLineChart({ data, target, domainFloor, domainCeil }) {
  const tickCount = Math.round(domainCeil - domainFloor) + 1;
  const yAxisTicks = Array.from({ length: tickCount }, (_, i) => domainFloor + i);

  return (
    <div
      role="region"
      aria-label="Band trajectory score progression chart"
      className="min-h-[160px] w-full flex-1"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="currentColor"
            className="text-[#eceafa] dark:text-white/11"
          />
          <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={6} />
          <YAxis
            domain={[domainFloor, domainCeil]}
            ticks={yAxisTicks}
            axisLine={false}
            tickLine={false}
            tick={AXIS_TICK}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.6 }}
          />
          {target != null && (
            <ReferenceLine y={target} stroke="#afb5ff" strokeDasharray="2 2" strokeWidth={1.5} />
          )}
          <Line
            type="monotone"
            dataKey="score"
            stroke={ACCENT}
            strokeWidth={2}
            dot={{ r: 3, fill: '#fff', stroke: ACCENT, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const BandTrajectoryChart = React.memo(({ recentTests, stats }) => {
  const target = useMemo(() => parseTargetScore(stats), [stats]);
  const { data, change } = useMemo(() => formatScoredTests(recentTests), [recentTests]);
  const { domainFloor, domainCeil } = useMemo(() => calculateDomain(data, target), [data, target]);

  const latest = data.length ? data[data.length - 1].score : null;

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Band trajectory"
        accent
        tip="Your band on each scored test, oldest to newest, against your target."
        action={
          latest != null ? (
            <span className={cn(MICRO, MUTED)}>
              latest <FootNum>{latest.toFixed(1)}</FootNum>
            </span>
          ) : null
        }
      />

      {data.length < 2 ? (
        <BandTrajectoryEmptySteps data={data} target={target} />
      ) : (
        <TrajectoryLineChart
          data={data}
          target={target}
          domainFloor={domainFloor}
          domainCeil={domainCeil}
        />
      )}

      <PanelFootnote>
        {change != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Delta value={change} /> across <span className={NUM}>{data.length}</span> scored tests
          </span>
        ) : (
          <>score two tests to see movement</>
        )}
      </PanelFootnote>
    </div>
  );
});

BandTrajectoryChart.displayName = 'BandTrajectoryChart';

export default BandTrajectoryChart;
