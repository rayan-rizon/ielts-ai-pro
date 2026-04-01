import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Timer, Brain, Gauge } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ITEM_VARIANTS } from '../constants';
import EmptyAnalyticsState from './EmptyAnalyticsState';

// Quadrant configurations
const QUADRANTS = {
  Q1: { name: 'Perfect Pace', color: 'emerald', description: 'Balanced & Steady' },
  Q2: { name: 'Taking Extra Time', color: 'blue', description: 'Very Careful' },
  Q3: { name: 'Rushing Zone', color: 'rose', description: 'Slow Down Slightly' },
  Q4: { name: 'Struggling Zone', color: 'amber', description: 'More Work Needed' },
};

function QuadrantLabel({ quadrant, x, y }) {
  const config = QUADRANTS[quadrant];
  return (
    <g className="pointer-events-none select-none" data-oid="zu_hrd2">
      <rect
        x={x - 55}
        y={y - 22}
        width="110"
        height="38"
        rx="12"
        className={cn(
          'fill-background/50 backdrop-blur-md stroke-[1.5]',
          quadrant === 'Q1' && 'stroke-emerald-500/30',
          quadrant === 'Q2' && 'stroke-blue-500/30',
          quadrant === 'Q3' && 'stroke-rose-500/30',
          quadrant === 'Q4' && 'stroke-amber-500/30'
        )}
        data-oid="w.956y6"
      />

      <text
        x={x}
        y={y - 2}
        textAnchor="middle"
        className={cn('text-[11px] font-black tracking-wider fill-foreground')}
        data-oid="ep2_ea2"
      >
        {config.name}
      </text>
      <text
        x={x}
        y={y + 11}
        textAnchor="middle"
        className="text-[9px] font-bold fill-muted-foreground opacity-70"
        data-oid="hhstv91"
      >
        {config.description}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const avgTime = data.avgTime;
  const accuracy = data.accuracy;

  // Determine quadrant
  let quadrant = 'Q1';
  if (avgTime > 120 && accuracy >= 70) quadrant = 'Q2';
  else if (avgTime <= 120 && accuracy < 70) quadrant = 'Q3';
  else if (avgTime > 120 && accuracy < 70) quadrant = 'Q4';

  const quadrantConfig = QUADRANTS[quadrant];

  return (
    <div
      className="rounded-xl border-border/70 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl border-opacity-50 min-w-[200px]"
      data-oid="00mm.s:"
    >
      <div className="space-y-2" data-oid="l9z:slc">
        <div className="flex items-center gap-2" data-oid="cn73dsw">
          <div
            className={cn('w-3 h-3 rounded-full', `bg-${quadrantConfig.color}-500`)}
            data-oid="opboa7k"
          />

          <span className="text-xs font-black tracking-wider" data-oid="e8mvuox">
            {data.type}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs" data-oid="e4bw--z">
          <div data-oid="r8:vvn.">
            <span className="text-muted-foreground" data-oid="90idi1.">
              Time:
            </span>
            <span className="ml-1 font-black" data-oid="mrdy4-u">
              {avgTime}s
            </span>
          </div>
          <div data-oid="nt:h7nx">
            <span className="text-muted-foreground" data-oid="qw_w45_">
              Accuracy:
            </span>
            <span className="ml-1 font-black" data-oid="ujee1n_">
              {accuracy}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border/30" data-oid="xm08_hk">
          <Badge
            variant="secondary"
            className={cn(
              'text-[8px] px-2 py-0.5 border-0',
              quadrantConfig.color === 'emerald' &&
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              quadrantConfig.color === 'blue' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              quadrantConfig.color === 'rose' && 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
              quadrantConfig.color === 'amber' &&
                'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            )}
            data-oid="w:92mss"
          >
            {quadrantConfig.name}
          </Badge>
          <span className="text-[9px] text-muted-foreground" data-oid="ucfpyd:">
            {data.total} questions
          </span>
        </div>
      </div>
    </div>
  );
}

function QuestionTypeBubble({ data, index }) {
  const avgTime = data.avgTime;
  const accuracy = data.accuracy;

  // Determine quadrant for color
  let colorClass = 'bg-emerald-500';
  if (avgTime > 120 && accuracy >= 70) colorClass = 'bg-blue-500';
  else if (avgTime <= 120 && accuracy < 70) colorClass = 'bg-rose-500';
  else if (avgTime > 120 && accuracy < 70) colorClass = 'bg-amber-500';

  // Size based on frequency
  const size = Math.max(40, Math.min(120, data.total * 8));

  return (
    <g key={`bubble-${index}`} data-oid="t41zsmx">
      <circle
        cx={data.x}
        cy={data.y}
        r={size / 2}
        className={colorClass}
        fillOpacity="0.7"
        stroke="white"
        strokeWidth="2"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
        }}
        data-oid="ekwqb4n"
      />

      <text
        x={data.x}
        y={data.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-black fill-white pointer-events-none"
        style={{
          fontSize: Math.max(10, size / 6),
        }}
        data-oid="r_r:tev"
      >
        {data.total}
      </text>
    </g>
  );
}

function QuadrantStats({ data }) {
  const stats = useMemo(() => {
    const quadrantCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    let totalQuestions = 0;

    data.forEach((item) => {
      const avgTime = item.avgTime;
      const accuracy = item.accuracy;

      if (avgTime > 120 && accuracy >= 70) quadrantCounts.Q2++;
      else if (avgTime <= 120 && accuracy < 70) quadrantCounts.Q3++;
      else if (avgTime > 120 && accuracy < 70) quadrantCounts.Q4++;
      else quadrantCounts.Q1++;

      totalQuestions += item.total;
    });

    return Object.entries(quadrantCounts).map(([quadrant, count]) => ({
      quadrant,
      count,
      percentage: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
      ...QUADRANTS[quadrant],
    }));
  }, [data]);

  const colorMap = {
    emerald:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20',
    amber:
      'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3" data-oid="tx43lb2">
      {stats.map((stat) => (
        <div
          key={stat.quadrant}
          className={cn(
            'p-2 md:p-3 rounded-2xl border text-center transition-all hover:scale-[1.02] backdrop-blur-sm flex flex-col justify-center min-h-[70px] relative overflow-hidden',
            colorMap[stat.color]
          )}
          data-oid="za7z2z9"
        >
          <div className="text-base md:text-xl font-black mb-0.5 leading-none" data-oid="39c:g3v">
            {stat.percentage}%
          </div>
          <div
            className="text-[8px] md:text-[9px] font-black tracking-wide opacity-80 leading-tight px-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
            data-oid="ot14bwb"
          >
            {stat.name}
          </div>
          <div className="text-[8px] md:text-[9px] font-bold opacity-60 mt-0.5" data-oid="c0_3rf6">
            {stat.count} types
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TimeManagementQuadrant({ questionTypeData = [] }) {
  const chartData = useMemo(() => {
    if (!questionTypeData.length) return [];

    return questionTypeData.map((item) => ({
      ...item,
      x: item.avgTime, // Time on x-axis
      y: item.accuracy, // Accuracy on y-axis
    }));
  }, [questionTypeData]);

  const hasData = chartData.length > 0;

  return (
    <motion.div variants={ITEM_VARIANTS} data-oid="6dpv:8_">
      <Card
        className="rounded-2xl border-border/50 bg-card/75 backdrop-blur shadow-sm overflow-hidden hover:shadow-xl transition-all h-full flex flex-col"
        data-oid="dipgt3:"
      >
        <CardHeader className="pb-4" data-oid="pn.py-t">
          <div className="flex items-center justify-between gap-4" data-oid="76h3w0y">
            <div className="space-y-1" data-oid="mzmgz9p">
              <CardTitle
                className="text-lg md:text-xl font-black text-foreground flex items-center gap-2"
                data-oid="x42ztix"
              >
                <Timer className="w-5 h-5 text-primary" data-oid="-q4uavi" />
                Speed & Accuracy Balance
              </CardTitle>
              <CardDescription
                className="text-xs line-clamp-1 xs:line-clamp-none font-semibold text-muted-foreground/80"
                data-oid="69j49d0"
              >
                Are you answering correctly and in good time?
              </CardDescription>
            </div>
            <Badge
              className="bg-primary/10 text-primary border-0 font-black text-[10px] tracking-widest shrink-0"
              data-oid=":6rz877"
            >
              Improving Your Pace
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-6 flex-1 flex flex-col min-h-0" data-oid="e3qaqek">
          {hasData ? (
            <>
              {/* Quadrant Stats */}
              <QuadrantStats data={chartData} data-oid="_nhsg:d" />

              {/* Quadrant Chart */}
              <div className="h-[300px] md:h-[400px] w-full min-h-0" data-oid="d0_gp24">
                <ResponsiveContainer width="100%" height="100%" data-oid="ht5usjv">
                  <ScatterChart
                    data={chartData}
                    margin={{ top: 20, right: 30, bottom: 60, left: 65 }}
                    data-oid="qpa0n5h"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                      data-oid="l2496jm"
                    />

                    {/* Quadrant Reference Lines */}
                    <ReferenceLine
                      x={120}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      opacity={0.5}
                      data-oid="_x3be1h"
                    />

                    <ReferenceLine
                      y={70}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      opacity={0.5}
                      data-oid="sokkxg9"
                    />

                    {/* Quadrant Labels */}
                    <QuadrantLabel quadrant="Q1" x={90} y={30} data-oid="8s109c0" />
                    <QuadrantLabel quadrant="Q2" x={210} y={30} data-oid="814zdun" />
                    <QuadrantLabel quadrant="Q3" x={90} y={85} data-oid="6_kw8g2" />
                    <QuadrantLabel quadrant="Q4" x={210} y={85} data-oid="gaxu19r" />

                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[0, 'dataMax + 30']}
                      label={{
                        value: 'Average Time (seconds)',
                        position: 'insideBottom',
                        offset: -10,
                        style: {
                          fontSize: 11,
                          fontWeight: 700,
                          fill: 'hsl(var(--muted-foreground))',
                        },
                      }}
                      tick={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      data-oid="jdqrj2r"
                    />

                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[0, 100]}
                      label={{
                        value: 'Accuracy (%)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: -5,
                        style: {
                          fontSize: 11,
                          fontWeight: 700,
                          fill: 'hsl(var(--muted-foreground))',
                        },
                      }}
                      tick={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      data-oid="hxjuisl"
                    />

                    <Tooltip content={<CustomTooltip data-oid="rc3ku.9" />} data-oid="8xvyzy5" />

                    <Scatter data={chartData} fill="hsl(var(--primary))" data-oid="ct5z:qg">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} data-oid="y591dag">
                          <QuestionTypeBubble data={entry} index={index} data-oid="efhuoj0" />
                        </Cell>
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Insights */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-gradient-to-r from-blue-500/5 to-emerald-500/5 border border-blue-500/10 p-4 mt-auto"
                data-oid="qwh98x0"
              >
                <div
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4"
                  data-oid="l44q6e_"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
                    data-oid="cr3sfpz"
                  >
                    <Brain className="w-5 h-5" data-oid="v.2afo2" />
                  </div>
                  <div className="space-y-3 flex-1 w-full" data-oid="nd.1iic">
                    <div className="flex items-center justify-between gap-2" data-oid="er9k75a">
                      <div className="text-sm font-black text-foreground" data-oid="tc7gaag">
                        Smart Success Tips
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-black text-blue-600 dark:text-blue-400 border-blue-200"
                        data-oid="qluz:qi"
                      >
                        {chartData.length} Type{chartData.length !== 1 ? 's' : ''} Analyzed
                      </Badge>
                    </div>
                    <div
                      className="text-[11px] md:text-xs text-muted-foreground leading-relaxed italic border-l-2 border-blue-500/30 pl-3 py-1"
                      data-oid=":k35:3p"
                    >
                      "
                      {(() => {
                        const q1 = chartData.filter(
                          (d) => d.avgTime <= 120 && d.accuracy >= 70
                        ).length;
                        const q3 = chartData.filter(
                          (d) => d.avgTime <= 120 && d.accuracy < 70
                        ).length;
                        const q4 = chartData.filter(
                          (d) => d.avgTime > 120 && d.accuracy < 70
                        ).length;

                        if (q1 > chartData.length * 0.6)
                          return "You're doing great in the 'Perfect Pace' zone. This balance is exactly what's needed for a high score.";
                        if (q3 > q1)
                          return "You're often moving too fast, which leads to small mistakes. Slowing down just a bit will help your score rise.";
                        if (q4 > 0)
                          return `You have ${q4} question type(s) that need more focus. These are the areas where you can gain the most points.`;
                        return 'Your time management is developing well. Keep up the good balance between speed and accuracy!';
                      })()}
                      "
                    </div>
                    <div
                      className="grid grid-cols-1 xs:grid-cols-2 gap-x-2 md:gap-x-4 gap-y-2.5 mt-2"
                      data-oid="-o5k52:"
                    >
                      <div className="flex items-center gap-2 group/item" data-oid="xn4xbx:">
                        <div
                          className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          data-oid="fhf8b3:"
                        />
                        <span
                          className="text-[10px] md:text-[11px] font-bold text-foreground/80 leading-none truncate"
                          data-oid="b0rpm43"
                        >
                          Perfect Pace: Balanced & Steady
                        </span>
                      </div>
                      <div className="flex items-center gap-2 group/item" data-oid="1ffvcfx">
                        <div
                          className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                          data-oid="oxip_yv"
                        />
                        <span
                          className="text-[10px] md:text-[11px] font-bold text-foreground/80 leading-none truncate"
                          data-oid="ssaoa7l"
                        >
                          Taking Extra Time: Very Careful
                        </span>
                      </div>
                      <div className="flex items-center gap-2 group/item" data-oid="4vpn6mb">
                        <div
                          className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          data-oid="9j_n79b"
                        />
                        <span
                          className="text-[10px] md:text-[11px] font-bold text-foreground/80 leading-none truncate"
                          data-oid="con1n0i"
                        >
                          Rushing Zone: Slow Down Slightly
                        </span>
                      </div>
                      <div className="flex items-center gap-2 group/item" data-oid="xd-zb0g">
                        <div
                          className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                          data-oid="0txezfj"
                        />
                        <span
                          className="text-[10px] md:text-[11px] font-bold text-foreground/80 leading-none truncate"
                          data-oid="165vuu4"
                        >
                          Struggling Zone: More Work Needed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            // Empty State
            <EmptyAnalyticsState
              icon={Gauge}
              title="Time Analysis"
              description="Complete tests with timing data to see your time management patterns and optimize your test-taking strategy."
              className="py-12"
              data-oid="moc-z_2"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
