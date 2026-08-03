import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, NUM, Pill, Tip } from '@/features/dashboard/components/primitives';
import { bandDescriptor } from './resultStats';

export function ArchScoreGauge({ score }) {
  const gradientId = React.useId();
  const glowId = React.useId();
  const scoreNum = parseFloat(score) || 0;
  const bandText = scoreNum.toFixed(1);
  const descriptor = bandDescriptor(scoreNum);

  // The SVG keeps the reference proportions while CSS scales it to the card.
  const width = 320;
  const height = 190;
  const cx = 160;
  const cy = 154;
  const radius = 112;
  const strokeWidth = 28;

  // Arc length for 180 degrees (semi-circle)
  const arcLength = Math.PI * radius; // ~270.18
  const clampedScore = Math.min(9.0, Math.max(0, scoreNum));
  const percentage = clampedScore / 9.0;
  const strokeDashoffset = arcLength * (1 - percentage);

  // Band ticks 1 to 9
  const bandTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((band) => {
    const angle = Math.PI - ((band - 1) / 8) * Math.PI;
    const tickRadius = radius + 29;
    const x = cx + tickRadius * Math.cos(angle);
    const y = cy - tickRadius * Math.sin(angle);
    return { band, x, y };
  });

  const endAngle = Math.PI - percentage * Math.PI;
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy - radius * Math.sin(endAngle);

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-1 group">
      <div className="relative w-[270px] h-[160px] xl:w-[320px] xl:h-[190px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient
              id={gradientId}
              x1="40"
              y1="154"
              x2="280"
              y2="154"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#5a63df" />
              <stop offset="55%" stopColor="#4a52c9" />
              <stop offset="100%" stopColor="#3d44a8" />
            </linearGradient>
            {/* Kept as a no-op-ish soft edge; the panel system avoids glows,
                so the blur radius is minimal rather than a halo. */}
            <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Animated Active Arc Stroke */}
          <motion.path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
            filter={`url(#${glowId})`}
          />

          <motion.circle
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: percentage > 0 ? 1 : 0, scale: 1 }}
            transition={{ delay: 1.05, type: 'spring', stiffness: 260, damping: 18 }}
            cx={endX}
            cy={endY}
            r="8"
            fill="#5a63df"
            stroke="white"
            strokeWidth="4"
            className="dark:stroke-slate-950"
          />
          {/* Invisible hit-target so the marker itself carries the tooltip,
              matching how the trend chart's dots behave. */}
          <Tip
            content={
              <span>
                Band {bandText} of 9.0 — <span className="font-bold">{descriptor}</span>
              </span>
            }
          >
            <circle cx={endX} cy={endY} r="14" fill="transparent" className="cursor-default" />
          </Tip>

          {/* Band Number Ticks (1 to 9) */}
          {bandTicks.map(({ band, x, y }) => (
            <text
              key={band}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500"
            >
              {band}
            </text>
          ))}
        </svg>

        {/* Center Text inside the Arc */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end text-center">
          <span className={cn(MICRO, 'mb-1 leading-none text-slate-500 dark:text-slate-400')}>
            Band score
          </span>
          <span
            className={cn(
              NUM,
              'mb-2 text-[46px] font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50 xl:text-[54px]'
            )}
          >
            {bandText}
          </span>
          <Pill tone="accent">{descriptor}</Pill>
        </div>
      </div>
    </div>
  );
}

export default ArchScoreGauge;
