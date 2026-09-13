import React from 'react';
import { BookOpen, Check, Headphones, Mic, PenTool, Sparkles } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MICRO,
  MUTED,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';

const modules = [
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    tag: 'Highest Impact',
    featured: true,
    description: 'Task 1 & 2 examiner scoring with band-boosting rewrites',
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
    tag: 'Voice AI',
    description: 'Live simulated examiner with fluency & pronunciation checks',
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    tag: 'Speed & Traps',
    description: 'Passage speed drills and keyword locator techniques',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    tag: 'Multi-Accent',
    description: 'Real exam audio with synced interactive transcripts',
  },
];

export default function FocusStep({ weakArea, onChangeWeakArea }) {
  const selectedModule = modules.find((m) => m.id === weakArea);

  return (
    <div className="space-y-3 py-1">
      <div className="grid grid-cols-2 gap-2.5">
        {modules.map((m) => {
          const isSelected = weakArea === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeWeakArea(m.id)}
              className={cn(
                'relative flex min-h-[105px] flex-col justify-between rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.98]',
                'border border-[#dedbea] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_4px_12px_-2px_rgba(15,23,42,0.04)]',
                'dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none',
                isSelected
                  ? 'border-[#5a63df] bg-[#5a63df]/[0.06] shadow-[0_2px_12px_-2px_rgba(90,99,223,0.16)] dark:border-[#8f97ff] dark:bg-[#8f97ff]/15 dark:shadow-none'
                  : 'hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.07),0_8px_24px_-4px_rgba(90,99,223,0.06)] dark:hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between">
                <IconChip icon={m.icon} tone={isSelected ? 'accent' : 'neutral'} size="sm" />
                <span
                  className={cn(
                    MICRO,
                    'rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wider',
                    isSelected
                      ? 'border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#b8bdff]'
                      : m.featured
                        ? 'border border-[#5a63df]/20 bg-[#5a63df]/6 text-[#5a63df] dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/10 dark:text-[#a9afff]'
                        : 'border border-slate-200/80 bg-slate-100/90 text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-400'
                  )}
                >
                  {m.tag}
                </span>
              </div>

              <div className="mt-2">
                <p className="text-[13.5px] font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                  {m.label}
                </p>
                <p
                  className={cn(
                    MICRO,
                    MUTED,
                    'mt-1 text-[10.5px] leading-relaxed normal-case tracking-normal'
                  )}
                >
                  {m.description}
                </p>
              </div>

              {isSelected && (
                <span className="absolute right-2.5 bottom-2.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#5a63df] text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-3 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedModule && (
        <m.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(WELL, 'flex items-center gap-2 rounded-lg px-3.5 py-2 text-left')}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#a9afff]" />
          <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            Priority queued:{' '}
            <span className="font-extrabold text-[#5a63df] dark:text-[#a9afff]">
              {selectedModule.label}
            </span>{' '}
            will be front-loaded in Day 1 of your adaptive roadmap.
          </p>
        </m.div>
      )}
    </div>
  );
}
