import React from 'react';
import { BookOpenText, Check, Clock3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { skillLabel } from '../../constants';
import { MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';

export function GuideHero({ resource, isCompleted }) {
  return (
    <section className={cn(PANEL, 'relative overflow-hidden p-4 sm:p-6')}>
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_75%_35%,rgba(90,99,223,0.12),transparent_60%)] lg:block" />
      <div className="relative max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">
            <BookOpenText className="h-3 w-3" />
            {skillLabel(resource.skill_code)}
          </Pill>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 shadow-2xs dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Check className="h-2.5 w-2.5" /> Completed
            </span>
          )}
        </div>
        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {resource.title}
        </h1>
        <p className={cn('mt-1.5 max-w-2xl text-xs font-medium leading-relaxed sm:text-sm', MUTED)}>
          {resource.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eceafa] bg-white/80 px-2.5 py-0.5 text-[11px] font-bold dark:border-white/10 dark:bg-white/5">
            <Clock3 className="h-3.5 w-3.5 text-[#5a63df]" />
            {resource.estimated_minutes} minute guide
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            IELTS Writing & Speaking
          </span>
          {resource.unit_number && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eceafa] bg-white/80 px-2.5 py-0.5 text-[11px] font-bold dark:border-white/10 dark:bg-white/5">
              Unit {resource.unit_number} of 18
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
