import React from 'react';
import { MessageSquare, Mic, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { formatBandScore } from '../utils/speakingReportSummary';

const PART_CONFIGS = [
  {
    key: 'part1',
    icon: MessageSquare,
    bgGradient: 'bg-white dark:bg-[#131315]',
    cardBorder: 'border-[#e4e2f0] dark:border-white/10',
    iconBg:
      'bg-[#ffeef3] text-[#d81b4e] dark:bg-white/[0.07] dark:text-rose-300 border border-[#fccedb]/60 dark:border-rose-500/30',
    dot: 'bg-[#d81b4e]',
    scoreBadge: 'bg-white/80 border-[#fccedb] dark:bg-white/6 dark:border-white/12 shadow-xs',
    scoreTag: 'text-[#d81b4e] dark:text-rose-300',
    scoreNum: 'text-slate-900 dark:text-white',
  },
  {
    key: 'part2',
    icon: Mic,
    bgGradient: 'bg-white dark:bg-[#131315]',
    cardBorder: 'border-[#e4e2f0] dark:border-white/10',
    iconBg:
      'bg-[#fff0f1] text-[#dc2f45] dark:bg-white/[0.07] dark:text-red-300 border border-[#f9c6ce]/60 dark:border-red-500/30',
    dot: 'bg-[#dc2f45]',
    scoreBadge: 'bg-white/80 border-[#f9c6ce] dark:bg-white/6 dark:border-white/12 shadow-xs',
    scoreTag: 'text-[#dc2f45] dark:text-red-300',
    scoreNum: 'text-slate-900 dark:text-white',
  },
  {
    key: 'part3',
    icon: Users,
    bgGradient: 'bg-white dark:bg-[#131315]',
    cardBorder: 'border-[#e4e2f0] dark:border-white/10',
    iconBg:
      'bg-[#ffeef3] text-[#e11d48] dark:bg-white/[0.07] dark:text-rose-300 border border-[#fccedb]/60 dark:border-rose-500/30',
    dot: 'bg-[#e11d48]',
    scoreBadge: 'bg-white/80 border-[#fccedb] dark:bg-white/6 dark:border-white/12 shadow-xs',
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
        'flex h-full flex-col justify-between rounded-xl border p-3.5',
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
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                part.iconBg
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
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
              'flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5',
              hasBand
                ? part.scoreBadge
                : 'bg-slate-50 border-slate-200 dark:bg-zinc-900 dark:border-zinc-800'
            )}
          >
            <span
              className={cn('text-[10px] font-extrabold uppercase tracking-wider', part.scoreTag)}
            >
              Band
            </span>
            <span className={cn(NUM, 'text-base font-extrabold tracking-tight', part.scoreNum)}>
              {hasBand ? formatBandScore(data.band) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Part Analysis Section Text */}
        <div className="mt-3 border-t border-slate-200/60 pt-3 dark:border-white/8">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', part.dot)} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
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
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
          Part-by-Part Performance
        </h3>
        {!hasSavedPartScore && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            Individual part scores were not saved for this completed test.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 sm:gap-3">
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
