import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-xl px-3 py-2"
        data-oid="060v8kk"
      >
        <p className="text-sm font-bold text-foreground mb-1" data-oid="wkzd01s">
          {label}
        </p>
        <div className="flex items-center gap-2" data-oid="_bqswve">
          <div className="w-2 h-2 rounded-full bg-primary" data-oid="w1ltswk" />
          <p className="text-xs font-medium text-muted-foreground" data-oid="8cfq0xd">
            Score:{' '}
            <span className="text-foreground font-bold" data-oid="scojlm6">
              {Number(payload[0].value).toFixed(1)}
            </span>
            <span className="text-muted-foreground/60 ml-0.5" data-oid="10tgc63">
              / 9.0
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const SkillRadarChart = ({ data }) => {
  // data should be an array of { subject: string, A: number, fullMark: number }

  return (
    <div className="w-full h-full min-h-[250px] relative" data-oid="yf9w2ol">
      <ResponsiveContainer width="100%" height="100%" data-oid="u9571uq">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="65%"
          margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
          data={data}
          data-oid="hbdcaew"
        >
          <defs data-oid=".g4dbo-">
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1" data-oid="kr1r-pw">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.8}
                data-oid=":8yxyfn"
              />

              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.1}
                data-oid="6vdn80z"
              />
            </linearGradient>
            <filter id="glow" height="200%" width="200%" data-oid="nur41g3">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" data-oid="93sz8_:" />
              <feOffset in="blur" dx="0" dy="0" result="offsetBlur" data-oid="-:aendl" />
              <feFlood
                floodColor="hsl(var(--primary))"
                floodOpacity="0.4"
                result="offsetColor"
                data-oid="46yes_0"
              />

              <feComposite
                in="offsetColor"
                in2="offsetBlur"
                operator="in"
                result="offsetBlur"
                data-oid="i-gy3te"
              />

              <feMerge data-oid="my1tx81">
                <feMergeNode in="offsetBlur" data-oid="s9cdzpo" />
                <feMergeNode in="SourceGraphic" data-oid="aivjko1" />
              </feMerge>
            </filter>
          </defs>

          <PolarGrid
            gridType="polygon"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.3}
            strokeDasharray="4 4"
            data-oid=".js0265"
          />

          <PolarAngleAxis
            dataKey="subject"
            tick={({ payload, x, y, textAnchor, stroke, radius }) => (
              <text
                x={x}
                y={y}
                textAnchor={textAnchor}
                fill="hsl(var(--foreground))"
                fontSize={10}
                fontWeight={700}
                className="uppercase tracking-widest"
                data-oid="6r41st."
              >
                {payload.value}
              </text>
            )}
            data-oid="f6-htdv"
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 9]}
            tick={false}
            axisLine={false}
            data-oid="oeqw7av"
          />

          <Tooltip
            content={<CustomTooltip data-oid="c2rizf1" />}
            cursor={{
              stroke: 'hsl(var(--primary))',
              strokeWidth: 1,
              strokeOpacity: 0.5,
              strokeDasharray: '4 4',
            }}
            data-oid=".mk-f6."
          />

          <Radar
            name="Skills"
            dataKey="A"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#radarGradient)"
            fillOpacity={0.8}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-out"
            activeDot={{ r: 7, strokeWidth: 2, fill: 'hsl(var(--primary))', filter: 'url(#glow)' }}
            style={{ filter: 'url(#glow)' }}
            data-oid="vp-f1cs"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
