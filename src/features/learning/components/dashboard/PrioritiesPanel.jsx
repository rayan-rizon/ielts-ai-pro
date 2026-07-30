import React from 'react';
import { BarChart3, Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatSkill, getModuleStyle, getPrioritiesList } from './dashboardUtils';

function ConfidenceBadge({ label }) {
  const isHigh = label === 'high';
  const isModerate = label === 'moderate' || label === 'developing';
  const displayLabel = isHigh
    ? 'Reliable scores'
    : isModerate
      ? 'Some scores'
      : 'More scores needed';

  const tone = isHigh
    ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30'
    : isModerate
      ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/30'
      : 'bg-white/80 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200/60 dark:border-white/10';

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow-2xs',
        tone
      )}
    >
      {displayLabel}
    </span>
  );
}

function PriorityRow({ skill, index }) {
  const style = getModuleStyle(skill.module);
  const Icon = style.icon;
  const mastery = Math.round((skill.mastery || 0) * 100);
  const tone =
    skill.tone === 'rose'
      ? 'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300'
      : skill.tone === 'amber'
        ? 'bg-amber-50/90 text-amber-800 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300'
        : 'bg-teal-50/90 text-teal-800 border-teal-200/80 dark:bg-teal-500/15 dark:text-teal-300';
  const confidence = Number(skill.confidence || 0);
  const confidenceText =
    confidence >= 0.7
      ? 'Enough recent answers'
      : confidence >= 0.4
        ? 'Some recent answers'
        : 'Needs more answers';
  const kindLabel =
    {
      'Confirmed focus': 'Confirmed focus',
      'Needs more results': 'Watch this skill',
      'Review due': 'Review now',
    }[skill.kind] || skill.kind;

  return (
    <div className="min-w-0 border-b border-slate-100 p-3.5 last:border-b-0 dark:border-white/5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500">
          {index + 1}
        </span>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs',
            style.surface,
            style.color
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="min-w-[7rem] flex-1 text-xs font-black leading-snug text-slate-950 dark:text-white">
              {formatSkill(skill.skill_code)}
            </p>
            <span
              className={cn(
                'max-w-full shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider',
                tone
              )}
            >
              {kindLabel}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className={cn('h-full rounded-full transition-all duration-500', style.bar)}
                style={{ width: `${Math.max(5, mastery)}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs font-black tabular-nums text-slate-700 dark:text-slate-300">
              {mastery}%
            </span>
          </div>
          <p className="mt-1 break-words text-[10.5px] font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
            Current skill level · {(skill.observations || 0).toLocaleString()} answers ·{' '}
            {confidenceText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrioritiesPanel({ evidence }) {
  const priorities = getPrioritiesList(evidence);

  return (
    <section
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#e0e4f1] bg-white shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 backdrop-blur hover:shadow-[0_24px_55px_-38px_rgba(48,58,128,0.85)] dark:border-white/10 dark:bg-[#10131f] p-5 sm:p-6"
      aria-labelledby="priorities-title"
    >
      {/* Corner Light Gradient Glow matching Grammar Lab */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#dcd8ff]/50 blur-2xl dark:bg-indigo-900/30"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#505bdd] dark:text-indigo-400">
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
              Your focus areas
            </span>
          </div>
          <h2
            id="priorities-title"
            className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl"
          >
            What to improve next
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Skills to practise now, skills to watch, and reviews due.
          </p>
        </div>
        <ConfidenceBadge label={evidence?.confidence_label || 'diagnostic'} />
      </div>

      <div className="mt-5 flex-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e0e4f1] bg-white shadow-sm dark:border-white/10 dark:bg-[#10131f]/90">
        {priorities.length > 0 ? (
          priorities.map((skill, index) => (
            <PriorityRow key={`${skill.kind}-${skill.skill_code}`} skill={skill} index={index} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200/80 px-4 py-8 text-center dark:border-white/10">
            <Gauge className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Complete a scored level check to find your first focus area.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
