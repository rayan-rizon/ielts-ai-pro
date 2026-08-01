import React from 'react';
import { BookOpen, Check, Headphones, Mic, PenTool } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, MUTED, TILE } from '@/features/dashboard/components/primitives';

const modules = [
  { id: 'reading', label: 'Reading', icon: BookOpen, description: 'Comprehension & speed' },
  { id: 'writing', label: 'Writing', icon: PenTool, description: 'Essays & task response' },
  { id: 'listening', label: 'Listening', icon: Headphones, description: 'Audio & note-taking' },
  { id: 'speaking', label: 'Speaking', icon: Mic, description: 'Fluency & confidence' },
];

/**
 * One colour, not four — matches AnalyticsOverview's module ranking, where
 * colour is reserved for the selected state rather than tinting each module
 * its own hue for no reason.
 */
export default function FocusStep({ weakArea, onChangeWeakArea }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 py-2">
      {modules.map((m) => {
        const isSelected = weakArea === m.id;

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChangeWeakArea(m.id)}
            className={cn(
              TILE,
              'relative flex h-32 flex-col justify-between p-4 text-left transition-all duration-200',
              isSelected
                ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.06] dark:bg-[#5a63df]/10'
                : 'hover:-translate-y-0.5 hover:border-[#c9cdf3] hover:shadow-sm dark:hover:border-white/[0.15]'
            )}
          >
            <IconChip icon={m.icon} tone={isSelected ? 'accent' : 'neutral'} size="md" />

            <div>
              <p className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                {m.label}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>
                {m.description}
              </p>
            </div>

            {isSelected && (
              <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#5a63df]">
                <Check className="h-3 w-3 stroke-[3] text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
