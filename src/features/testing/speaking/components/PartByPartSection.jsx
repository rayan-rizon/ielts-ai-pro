import React from 'react';
import { MessageSquare, Mic, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBandScore } from '../utils/speakingReportSummary';

const PART_CONFIGS = [
  {
    key: 'part1',
    icon: MessageSquare,
    bgGradient: 'from-[#fdfcff] to-[#f3efff] dark:from-[#101322] dark:to-[#16192d]',
    cardBorder:
      'border-[#e4e2f0] hover:border-violet-200/80 dark:border-white/[0.07] dark:hover:border-indigo-500/30',
    iconBg:
      'bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 border border-[#d2d7f8]/60 dark:border-indigo-500/30',
    dot: 'bg-[#5661e9]',
    scoreBadge:
      'bg-white/80 border-[#d2d7f8] dark:bg-indigo-950/60 dark:border-indigo-800/60 shadow-xs',
    scoreTag: 'text-[#5661e9] dark:text-indigo-400',
    scoreNum: 'text-slate-900 dark:text-white',
  },
  {
    key: 'part2',
    icon: Mic,
    bgGradient: 'from-[#fffdfc] to-[#fff5ee] dark:from-[#15121c] dark:to-[#1e1726]',
    cardBorder:
      'border-[#e4e2f0] hover:border-amber-200/80 dark:border-white/[0.07] dark:hover:border-amber-500/30',
    iconBg:
      'bg-[#fff1e7] text-[#df7437] dark:bg-amber-500/20 dark:text-amber-300 border border-[#fcdbc8]/60 dark:border-amber-500/30',
    dot: 'bg-[#df7437]',
    scoreBadge:
      'bg-white/80 border-[#fcdbc8] dark:bg-amber-950/60 dark:border-amber-800/60 shadow-xs',
    scoreTag: 'text-[#df7437] dark:text-amber-400',
    scoreNum: 'text-slate-900 dark:text-white',
  },
  {
    key: 'part3',
    icon: Users,
    bgGradient: 'from-[#fffdfd] to-[#fff0f5] dark:from-[#181119] dark:to-[#221422]',
    cardBorder:
      'border-[#e4e2f0] hover:border-rose-200/80 dark:border-white/[0.07] dark:hover:border-rose-500/30',
    iconBg:
      'bg-[#ffeef3] text-[#e11d48] dark:bg-rose-500/20 dark:text-rose-300 border border-[#fccedb]/60 dark:border-rose-500/30',
    dot: 'bg-[#e11d48]',
    scoreBadge:
      'bg-white/80 border-[#fccedb] dark:bg-rose-950/60 dark:border-rose-800/60 shadow-xs',
    scoreTag: 'text-[#e11d48] dark:text-rose-400',
    scoreNum: 'text-slate-900 dark:text-white',
  },
];

function PartCard({ part, data }) {
  const Icon = part.icon;
  const hasBand = data.band != null;

  return (
    <article
      className={cn(
        'group flex h-full flex-col justify-between rounded-2xl border bg-gradient-to-br p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
        part.bgGradient,
        part.cardBorder
      )}
    >
      <div>
        {/* Top Header: Icon + Title & Subtitle + Top-Right Score Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105',
                part.iconBg
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                {data.label}
              </h4>
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 mt-0.5">
                {data.subtitle}
              </p>
            </div>
          </div>

          {/* Top-Right Band Score Badge */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-transform group-hover:scale-105',
              hasBand
                ? part.scoreBadge
                : 'bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800'
            )}
          >
            <span className={cn('text-[10px] font-black uppercase tracking-wider', part.scoreTag)}>
              Band
            </span>
            <span className={cn('text-base font-black tracking-tight', part.scoreNum)}>
              {hasBand ? formatBandScore(data.band) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Part Analysis Section Text */}
        <div className="mt-3 border-t border-slate-200/60 pt-3 dark:border-white/[0.08]">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', part.dot)} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
              Part Analysis
            </span>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-200">
            {data.observation || 'No response was available for this part.'}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PartByPartSection({ parts }) {
  const normalizedParts = Array.isArray(parts) ? parts : [];
  if (normalizedParts.length === 0) return null;
  const hasSavedPartScore = normalizedParts.some((part) => part.band != null);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
          Part-by-Part Performance
        </h3>
        {!hasSavedPartScore && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            Individual part scores were not saved for this completed test.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
        {normalizedParts.map((data) => (
          <PartCard
            key={data.key}
            part={PART_CONFIGS.find((part) => part.key === data.key)}
            data={data}
          />
        ))}
      </div>
    </section>
  );
}
