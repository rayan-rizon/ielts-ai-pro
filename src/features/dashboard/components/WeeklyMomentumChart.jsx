import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/cn';
import { Empty, MICRO, MUTED, NUM, PANEL, PanelTitle } from './primitives';

const ACCENT = '#5a63df';

const AXIS_TICK = { fontSize: 10, fontWeight: 700, fill: 'rgb(var(--chart-axis))' };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 shadow-lg dark:border-white/[0.14] dark:bg-[#242427]">
      <p className={cn(MICRO, MUTED)}>{label}</p>
      <p className={cn(NUM, 'mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-50')}>
        {count} <span className={cn(MICRO, MUTED)}>{count === 1 ? 'test' : 'tests'}</span>
      </p>
    </div>
  );
}

const WeeklyMomentumChart = React.memo(({ weeklyProgress }) => {
  const data = useMemo(
    () => (Array.isArray(weeklyProgress) ? weeklyProgress : []),
    [weeklyProgress]
  );
  const total = useMemo(
    () => data.reduce((sum, day) => sum + (Number(day?.tests) || 0), 0),
    [data]
  );
  const activeDays = useMemo(() => data.filter((day) => Number(day?.tests) > 0).length, [data]);

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Practice volume · 7d"
        tip="Tests completed each day, last 7 days."
        action={
          <span className={cn(MICRO, MUTED)}>
            <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>{total}</span>{' '}
            total · {activeDays}/7 days
          </span>
        }
      />

      {total === 0 ? (
        <Empty className="flex-1 content-center">
          No tests in the last seven days. Your daily volume charts here.
        </Empty>
      ) : (
        <div className="min-h-[160px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 4, left: -26, bottom: 0 }}>
              <defs>
                <linearGradient id="dashVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.26} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="currentColor"
                className="text-[#eceafa] dark:text-white/11"
              />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={6} />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={44}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: ACCENT, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.6 }}
              />
              <Area
                type="monotone"
                dataKey="tests"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#dashVolume)"
                dot={false}
                activeDot={{ r: 4, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

WeeklyMomentumChart.displayName = 'WeeklyMomentumChart';

export default WeeklyMomentumChart;
