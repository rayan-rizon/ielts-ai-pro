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
  Empty,
  FootNum,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
} from './primitives';

const AXIS_TICK = { fontSize: 10, fontWeight: 700, fill: '#94a3b8' };

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 shadow-lg dark:border-white/10 dark:bg-[#1b1a22]">
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
const BandTrajectoryChart = React.memo(({ recentTests, stats }) => {
  const target = Number(stats?.targetScore) || 7;

  const { data, change } = useMemo(() => {
    const scored = (Array.isArray(recentTests) ? recentTests : [])
      .filter((test) => Number.isFinite(Number(test?.score)) && test?.completed_at)
      // get_recent_sessions returns newest first; a trajectory reads left to right.
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
  }, [recentTests]);

  const latest = data.length ? data[data.length - 1].score : null;
  const domainFloor = Math.max(
    0,
    Math.floor(Math.min(target, ...data.map((point) => point.score)) - 0.5)
  );
  const domainCeil = Math.min(
    9,
    Math.ceil(Math.max(target, ...data.map((point) => point.score)) + 0.5)
  );

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
        <Empty className="flex-1 content-center">
          {data.length === 1
            ? 'One test scored. A second one draws the line.'
            : 'No scored tests yet — your band history charts here.'}
        </Empty>
      ) : (
        <div className="min-h-[160px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -26, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-[#eceafa] dark:text-white/[0.07]"
              />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                dy={6}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={44}
                domain={[domainFloor, domainCeil]}
                ticks={Array.from(
                  { length: Math.round(domainCeil - domainFloor) + 1 },
                  (_, i) => domainFloor + i
                )}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.6 }}
              />
              <ReferenceLine
                y={target}
                stroke="currentColor"
                className="text-[rgb(var(--signal-ok))]"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `target ${target.toFixed(1)}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fontWeight: 800,
                  fill: '#94a3b8',
                }}
              />
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
      )}

      <PanelFootnote>
        {change != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Delta value={change} /> across {data.length} scored tests
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
