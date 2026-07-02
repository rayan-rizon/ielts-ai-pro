import React from 'react';
import { MessageSquare, Mic2, Brain } from 'lucide-react';

const PART_CONFIGS = [
  {
    key: 'part1',
    label: 'Part 1',
    subtitle: 'Intro',
    icon: MessageSquare,
    theme:
      'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-500/40 text-blue-700 dark:text-blue-300',
    accent: 'bg-blue-500',
  },
  {
    key: 'part2',
    label: 'Part 2',
    subtitle: 'Long Turn',
    icon: Mic2,
    theme:
      'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/40 text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
  },
  {
    key: 'part3',
    label: 'Part 3',
    subtitle: 'Discussion',
    icon: Brain,
    theme:
      'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 dark:border-rose-500/40 text-rose-700 dark:text-rose-300',
    accent: 'bg-rose-500',
  },
];

function PartCard({ part, data }) {
  const Icon = part.icon;

  return (
    <div
      className={`p-4 border-2 rounded-[1.5rem] flex flex-col items-center text-center space-y-2.5 transition-all hover:shadow-lg hover:scale-[1.02] duration-300 ${part.theme}`}
    >
      <div
        className={`w-10 h-10 rounded-xl ${part.accent}/20 flex items-center justify-center shrink-0 shadow-sm`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{part.label}</p>
        <p className="text-3xl font-black text-foreground">{data.band ?? 'N/A'}</p>
        <p className="text-[10px] font-black opacity-80">{part.subtitle}</p>
      </div>

      {data.keyObservation && (
        <p className="text-[13px] text-foreground font-bold leading-snug mt-1 pt-3 border-t border-current/10 w-full italic">
          {data.keyObservation}
        </p>
      )}
    </div>
  );
}

export default function PartByPartSection({ finalEvaluation }) {
  const partScores = finalEvaluation.partScores;

  if (!partScores || Object.keys(partScores).length === 0) return null;

  const availableParts = PART_CONFIGS.filter((p) => partScores[p.key]);

  if (availableParts.length === 0) return null;

  return (
    <div className="p-5 bg-zinc-50 dark:bg-black/40 rounded-[2.5rem] border-2 border-border/60">
      <div className="relative mb-5 text-center px-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/60"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-50 dark:bg-[#121212] px-6 text-[10px] font-black text-foreground uppercase tracking-[0.4em] shadow-sm py-1 rounded-full border border-border">
            Part-by-Part Performance
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableParts.map((part) => (
          <PartCard key={part.key} part={part} data={partScores[part.key]} />
        ))}
      </div>
    </div>
  );
}
