import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const TOOLTIP_STYLE = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: 20,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  padding: '12px 16px',
};

const TOOLTIP_DARK_STYLE = {
  background: 'rgba(15, 23, 42, 0.9)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: 20,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  padding: '12px 16px',
};

const TOOLTIP_LABEL_STYLE = {
  color: 'hsl(var(--slate-900))',
  fontWeight: 900,
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
};

const TOOLTIP_ITEM_STYLE = {
  color: 'hsl(var(--primary))',
  fontWeight: 800,
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const AXIS_TICK_STYLE = {
  fontSize: 10,
  fill: 'hsl(var(--muted-foreground))',
  fontWeight: 700,
  letterSpacing: '0.05em',
};
const CHART_DOT_STYLE = {
  r: 5,
  fill: 'white',
  stroke: 'hsl(var(--primary))',
  strokeWidth: 3,
  shadowBlur: 10,
  shadowColor: 'rgba(99, 102, 241, 0.3)',
};
const CHART_ACTIVE_DOT_STYLE = {
  r: 9,
  fill: 'hsl(var(--primary))',
  stroke: 'white',
  strokeWidth: 4,
  style: {
    filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.8))',
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isDark = document.documentElement.classList.contains('dark');
    const style = isDark ? TOOLTIP_DARK_STYLE : TOOLTIP_STYLE;
    const labelStyle = {
      ...TOOLTIP_LABEL_STYLE,
      color: isDark ? 'white' : 'hsl(var(--slate-900))',
    };

    return (
      <div style={style} data-oid="qx-0bfk">
        <p style={labelStyle} data-oid="yze0stg">
          {label}
        </p>
        <div style={TOOLTIP_ITEM_STYLE} data-oid="mj8qo.v">
          <TrendingUp className="w-3.5 h-3.5" data-oid=".gxqgxe" />
          <span data-oid="z_hl7f.">{payload[0].value} Tests</span>
        </div>
      </div>
    );
  }
  return null;
};

CustomTooltip.displayName = 'CustomTooltip';

const WeeklyMomentumChart = React.memo(({ weeklyProgress }) => {
  return (
    <Card
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden group flex flex-col h-full',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'shadow-sm',
        'hover:shadow-md transition-shadow duration-300',
        'hover:border-indigo-500/40 dark:hover:border-indigo-500/40'
      )}
      data-oid="0w400zj"
    >
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
        data-oid="j0-pr4e"
      />

      <CardHeader className="p-4 pb-0" data-oid="..ftsv8">
        <div className="flex items-center justify-between gap-3" data-oid="a346f.5">
          <CardTitle
            className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="f4i.n7j"
          >
            <div
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-transform group-hover:rotate-12"
              data-oid="g3_er9i"
            >
              <TrendingUp
                className="w-4 h-4 transition-transform duration-500 group-hover:scale-110"
                data-oid="08gxw0d"
              />
            </div>
            <div data-oid="ehdz_zr">
              <span className="tracking-tight" data-oid="v:bcrfk">
                Weekly Activity
              </span>
              <p
                className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5"
                data-oid="02fbtn1"
              >
                Practice Trends
              </p>
            </div>
          </CardTitle>
          <Badge
            variant="outline"
            className="rounded-full bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-[9px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-0.5 shadow-sm uppercase tracking-wider backdrop-blur-md"
            data-oid="qyb15hl"
          >
            Last 7 Days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3 flex-1 flex flex-col" data-oid="r1rgj1o">
        <div
          className="relative h-[320px] w-full bg-slate-50/80 dark:bg-black/40 rounded-xl p-2 border border-slate-100 dark:border-white/5 overflow-hidden shadow-inner"
          data-oid="5m67r-l"
        >
          <div
            className="absolute inset-0 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none"
            data-oid="sk6d247"
          />

          {/* Empty State Overlay */}
          {!weeklyProgress?.some((d) => d.tests > 0) && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm"
              data-oid="p9toth6"
            >
              <div
                className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center mb-3 animate-pulse"
                data-oid="w4upflz"
              >
                <TrendingUp className="w-6 h-6 text-orange-500" data-oid="q5oh1jd" />
              </div>
              <h4
                className="text-sm font-black text-slate-900 dark:text-white mb-1"
                data-oid="zgitt4g"
              >
                No Activity Yet
              </h4>
              <p
                className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-4 text-center max-w-[150px]"
                data-oid="9.6flvo"
              >
                Complete a test to start your weekly streak!
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%" data-oid="fwiof9-">
            <AreaChart
              data={weeklyProgress}
              margin={{ top: 10, left: -20, right: 10, bottom: 0 }}
              data-oid="rl-tgm6"
            >
              <defs data-oid="rmxpk8b">
                <linearGradient id="dashv3" x1="0" y1="0" x2="0" y2="1" data-oid="rjwk9wx">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.25}
                    data-oid="-xuyny3"
                  />

                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                    data-oid="a_q6j4:"
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK_STYLE}
                dy={10}
                data-oid="z:hsj-h"
              />

              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK_STYLE}
                width={40}
                domain={[0, 'auto']}
                data-oid="zp32a3c"
              />

              <Tooltip
                content={<CustomTooltip data-oid="048ot6t" />}
                cursor={{
                  stroke: 'hsl(var(--primary))',
                  strokeWidth: 2,
                  strokeDasharray: '4 4',
                  opacity: 0.8,
                }}
                data-oid=":1dwmhu"
              />

              <Area
                type="monotone"
                dataKey="tests"
                stroke="hsl(var(--primary))"
                strokeWidth={4}
                fill="url(#dashv3)"
                dot={CHART_DOT_STYLE}
                activeDot={CHART_ACTIVE_DOT_STYLE}
                data-oid=".cl-1ue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

WeeklyMomentumChart.displayName = 'WeeklyMomentumChart';

export default WeeklyMomentumChart;
