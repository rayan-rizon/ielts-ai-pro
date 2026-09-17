import React from 'react';
import { Zap, Clock, Target, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, PANEL, TILE } from '@/features/dashboard/components/primitives';

const MIN_WORDS = 4;

export default function SimulationHub({ onStartSpeedQuiz, onStartMatchPairs, wordCount = 0 }) {
  const ready = wordCount >= MIN_WORDS;
  const games = [
    {
      id: 'quiz',
      name: 'Speed Match',
      icon: Clock,
      start: onStartSpeedQuiz,
      desc: 'Race against the clock to match terms.',
      tone: 'amber',
    },
    {
      id: 'match',
      name: 'Match Pairs',
      icon: Target,
      start: onStartMatchPairs,
      desc: 'Pair high-impact words with definitions.',
      tone: 'emerald',
    },
  ];

  return (
    <div className={cn(PANEL, 'relative overflow-hidden p-4')}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5a63df]/10 blur-xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-[#eeedf7] pb-3 dark:border-white/[0.07]">
        <h3 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white min-w-0">
          <IconChip icon={Zap} />
          <span className="truncate">Practice Arena</span>
        </h3>
        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {ready ? `${wordCount} words ready` : `Needs ${MIN_WORDS} words with definitions`}
        </span>
      </div>

      <div className="relative space-y-2.5 pt-3.5">
        {games.map((game) => (
          <button
            type="button"
            key={game.id}
            onClick={game.start}
            disabled={!ready}
            className={cn(
              TILE,
              'group flex w-full items-center justify-between p-3 text-left transition-all duration-200',
              ready
                ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#c9cdf3] dark:hover:border-white/20'
                : 'cursor-not-allowed opacity-60'
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <IconChip icon={game.icon} tone={game.tone} size="lg" />
              <div className="min-w-0">
                <h4 className="truncate text-xs font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-indigo-300">
                  {game.name}
                </h4>
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {game.desc}
                </p>
              </div>
            </div>

            <div className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-all group-hover:bg-[#5a63df] group-hover:text-white dark:bg-white/10">
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
        {!ready && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Save at least {MIN_WORDS} words with definitions to play. You have {wordCount}.
          </p>
        )}
      </div>
    </div>
  );
}
