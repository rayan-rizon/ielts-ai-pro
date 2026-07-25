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
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import CustomTooltip from './CustomTooltip';

const UniversalRadar = React.memo(function UniversalRadar({ data, name, color = 'primary' }) {
  const hasData = data && data.length > 0;

  return (
    <div className="h-full w-full group/radar relative" data-oid="t0z754t">
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10" data-oid="rs:jonf">
          <Badge
            className="bg-background/90 backdrop-blur-md border border-primary/20 text-[10px] font-black tracking-widest text-muted-foreground px-3 py-1 rounded-full shadow-xl uppercase"
            data-oid="5wl8q_3"
          >
            Awaiting Test Results
          </Badge>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%" data-oid="zvgf8rl">
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="72%"
          margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
          data={
            hasData
              ? data
              : [
                  { subject: 'Reading', A: 0 },
                  { subject: 'Writing', A: 0 },
                  { subject: 'Listening', A: 0 },
                  { subject: 'Speaking', A: 0 },
                ]
          }
          className={cn(
            'transition-all duration-1000',
            !hasData && 'opacity-20 grayscale blur-[2px]'
          )}
          data-oid="t_kyv25"
        >
          <defs data-oid="6-.jt-:">
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1" data-oid="zr1lx3h">
              <stop
                offset="5%"
                stopColor={`hsl(var(--${color}))`}
                stopOpacity={0.6}
                data-oid="bfxqww5"
              />

              <stop
                offset="95%"
                stopColor={`hsl(var(--${color}))`}
                stopOpacity={0.1}
                data-oid="1qrlf82"
              />
            </linearGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" opacity={0.8} data-oid=":ii.j3k" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'hsl(var(--foreground))',
              fontSize: 10,
              fontWeight: 800,
              opacity: 0.9,
            }}
            data-oid=":3wln1i"
          />

          <PolarRadiusAxis
            angle={30}
            domain={[0, 9]}
            tick={false}
            axisLine={false}
            data-oid="misbqjk"
          />

          {hasData && (
            <Radar
              name={name}
              dataKey="A"
              stroke={`hsl(var(--${color}))`}
              fill="url(#radarGradient)"
              fillOpacity={1}
              strokeWidth={3}
              dot={{
                r: 3,
                fill: `hsl(var(--${color}))`,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              className="transition-all duration-500 hover:fill-opacity-80"
              animationBegin={0}
              animationDuration={1500}
              data-oid="m8bcq-0"
            />
          )}
          {hasData && <Tooltip content={<CustomTooltip data-oid="ctzx0i0" />} data-oid="pl-riae" />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default UniversalRadar;
