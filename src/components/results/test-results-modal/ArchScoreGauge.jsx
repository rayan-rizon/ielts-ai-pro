import React from 'react';
import { motion } from 'framer-motion';

function getBandDescriptor(score) {
  const num = parseFloat(score);
  if (num >= 9.0) return 'Expert User';
  if (num >= 8.0) return 'Very Good User';
  if (num >= 7.0) return 'Good User';
  if (num >= 6.0) return 'Competent User';
  if (num >= 5.0) return 'Modest User';
  if (num >= 4.0) return 'Limited User';
  if (num >= 3.0) return 'Extremely Limited';
  if (num >= 2.0) return 'Intermittent User';
  return 'Initial Level';
}

export function ArchScoreGauge({ score }) {
  const gradientId = React.useId();
  const glowId = React.useId();
  const scoreNum = parseFloat(score) || 0;
  const bandText = scoreNum.toFixed(1);
  const descriptor = getBandDescriptor(scoreNum);

  // The SVG keeps the reference proportions while CSS scales it to the card.
  const width = 320;
  const height = 190;
  const cx = 160;
  const cy = 154;
  const radius = 112;
  const strokeWidth = 22;

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
      <div className="absolute inset-x-10 top-10 bottom-1 rounded-full bg-blue-500/[0.06] blur-2xl pointer-events-none" />

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
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="55%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc Track */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800"
          />

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
            fill="#2563EB"
            stroke="white"
            strokeWidth="4"
            className="dark:stroke-slate-950"
          />

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
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 leading-none mb-1 uppercase tracking-[0.18em]">
            Your Band
          </span>
          <span className="text-[52px] xl:text-6xl font-black tracking-[-0.06em] text-slate-950 dark:text-white leading-none mb-2">
            {bandText}
          </span>
          <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {descriptor}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ArchScoreGauge;
