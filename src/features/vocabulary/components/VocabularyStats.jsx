import React from 'react';
import { BookOpen, Target, Clock, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Stat } from '@/features/dashboard/components/primitives';

export default function VocabularyStats({ stats, wordLimit, dueCount = 0, className }) {
  const displayLimit =
    wordLimit === Infinity ? stats.totalWords : `${stats.totalWords}/${wordLimit}`;

  const statItems = [
    { icon: BookOpen, value: displayLimit, label: 'Saved', tone: 'accent' },
    { icon: Target, value: stats.masteredWords, label: 'Mastered', tone: 'emerald' },
    // Amber, not rose: words due for review are the routine, expected state —
    // this is what the app is for, not a problem to be alarmed about.
    { icon: Clock, value: dueCount, label: 'Due today', tone: dueCount > 0 ? 'amber' : 'neutral' },
    { icon: Flame, value: `${stats.streak}d`, label: 'Streak', tone: 'amber' },
    { icon: Trophy, value: '8.0+', label: 'Goal', tone: 'sky' },
  ];

  return (
    <div
      className={cn(
        // `xs:` isn't a real Tailwind breakpoint in this project (no `screens.xs` in
        // tailwind.config.js), so it silently compiled to nothing — the grid was
        // stuck at 2 columns from 0 to 640px, leaving the 5th tile orphaned alone
        // in its own row. `min-[480px]:` is an arbitrary-value variant Tailwind
        // supports natively, so it actually renders.
        'grid w-full grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-5 items-stretch gap-1.5 sm:gap-2 xl:w-auto xl:flex xl:flex-nowrap',
        className
      )}
    >
      {statItems.map((stat) => (
        <Stat
          key={stat.label}
          size="sm"
          icon={stat.icon}
          tone={stat.tone}
          label={stat.label}
          value={stat.value}
          className="min-w-0 xl:min-w-[104px]"
        />
      ))}
    </div>
  );
}
