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
    { icon: Clock, value: dueCount, label: 'Due today', tone: dueCount > 0 ? 'rose' : 'neutral' },
    { icon: Flame, value: `${stats.streak}d`, label: 'Streak', tone: 'amber' },
    { icon: Trophy, value: '8.0+', label: 'Goal', tone: 'sky' },
  ];

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 items-stretch gap-1.5 sm:gap-2 xl:w-auto xl:flex xl:flex-nowrap',
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
