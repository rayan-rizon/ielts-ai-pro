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

const UniversalRadar = React.memo(function UniversalRadar({
  data,
  name,
  color: _color = 'primary',
}) {
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
          outerRadius="68%"
          margin={{ top: 6, right: 16, bottom: 6, left: 16 }}
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
        >
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <PolarGrid
            stroke="#a5b4fc"
            strokeWidth={1.2}
            opacity={0.6}
            className="dark:stroke-indigo-400/30"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: 'currentColor',
              fontSize: 9.5,
              fontWeight: 700,
            }}
          />

          <PolarRadiusAxis angle={30} domain={[0, 9]} tick={false} axisLine={false} />

          {hasData && (
            <Radar
              name={name}
              dataKey="A"
              stroke="#4f46e5"
              fill="url(#radarGradient)"
              fillOpacity={1}
              strokeWidth={2.2}
              dot={{
                r: 4,
                fill: '#4f46e5',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5.5,
                fill: '#4f46e5',
                stroke: '#ffffff',
                strokeWidth: 2.5,
              }}
              animationBegin={0}
              animationDuration={1200}
            />
          )}
          {hasData && <Tooltip content={<CustomTooltip />} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default UniversalRadar;
