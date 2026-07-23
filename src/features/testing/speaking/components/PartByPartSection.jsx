import React from 'react';
import { MessageSquare, Mic, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatBandScore } from '../utils/speakingReportSummary';

const PART_CONFIGS = [
  {
    key: 'part1',
    icon: MessageSquare,
    iconBg: 'bg-blue-100/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    cardBorder: 'border-slate-200/90 dark:border-white/10',
    dot: 'bg-blue-500',
    analysisBg: 'bg-slate-50/70 border-slate-200/60 dark:bg-zinc-900/60 dark:border-white/10',
    scoreBadge:
      'bg-blue-50/90 border-blue-200/90 dark:bg-blue-950/60 dark:border-blue-800/60 shadow-xs',
    scoreTag: 'text-blue-600 dark:text-blue-400',
    scoreNum: 'text-blue-950 dark:text-blue-100',
  },
  {
    key: 'part2',
    icon: Mic,
    iconBg: 'bg-amber-100/80 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    cardBorder: 'border-slate-200/90 dark:border-white/10',
    dot: 'bg-amber-500',
    analysisBg: 'bg-slate-50/70 border-slate-200/60 dark:bg-zinc-900/60 dark:border-white/10',
    scoreBadge:
      'bg-amber-50/90 border-amber-200/90 dark:bg-amber-950/60 dark:border-amber-800/60 shadow-xs',
    scoreTag: 'text-amber-600 dark:text-amber-400',
    scoreNum: 'text-amber-950 dark:text-amber-100',
  },
  {
    key: 'part3',
    icon: Users,
    iconBg: 'bg-pink-100/80 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
    cardBorder: 'border-slate-200/90 dark:border-white/10',
    dot: 'bg-rose-500',
    analysisBg: 'bg-slate-50/70 border-slate-200/60 dark:bg-zinc-900/60 dark:border-white/10',
    scoreBadge:
      'bg-rose-50/90 border-rose-200/90 dark:bg-rose-950/60 dark:border-rose-800/60 shadow-xs',
    scoreTag: 'text-rose-600 dark:text-rose-400',
    scoreNum: 'text-rose-950 dark:text-rose-100',
  },
];

function PartCard({ part, data }) {
  const Icon = part.icon;
  const hasBand = data.band != null;

  return (
    <article
      className={cn(
        'group flex h-full flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-950',
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
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 mt-0.5">
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
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/[0.08]">
          <div className="mb-2 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', part.dot)} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
              Part Analysis
            </span>
          </div>
          <p
            className={cn(
              'rounded-xl border p-3.5 text-xs font-semibold leading-relaxed text-slate-800 dark:text-zinc-200',
              part.analysisBg
            )}
          >
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
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
          Part-by-Part Performance
        </h3>
        {!hasSavedPartScore && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            Individual part scores were not saved for this completed test.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-5">
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
