import React from 'react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, Pill, TILE } from '@/features/dashboard/components/primitives';

export function getQuestionSuccessSummary(data = []) {
  const totals = data.reduce(
    (summary, item) => ({
      correct: summary.correct + (Number(item.correct) || 0),
      total: summary.total + (Number(item.total) || 0),
    }),
    { correct: 0, total: 0 }
  );

  return {
    ...totals,
    accuracy: totals.total ? Math.round((totals.correct / totals.total) * 100) : 0,
  };
}

/**
 * Tone for a question-type row.
 *
 * Sample size is checked before accuracy on purpose: 0% from two questions is
 * noise, and colouring it like a real weakness sends learners to drill a
 * question type they have barely met.
 */
export function questionSuccessTone(accuracy, sampleSize = 0) {
  if (sampleSize < 5) {
    return { label: 'Low sample', pill: 'neutral', bar: 'bg-slate-300 dark:bg-white/20' };
  }
  if (accuracy >= 70) {
    return { label: 'Strong', pill: 'ok', bar: 'bg-[rgb(var(--signal-ok))]' };
  }
  if (accuracy >= 50) {
    return { label: 'Developing', pill: 'warn', bar: 'bg-[rgb(var(--signal-warn))]' };
  }
  return { label: 'Focus next', pill: 'accent', bar: 'bg-[#5a63df]' };
}

/** Compact three-up metric tile used inside a panel body. */
export function StatMiniCard({ icon: Icon, label, value }) {
  return (
    <div className={cn(TILE, 'flex flex-col items-center justify-center gap-0.5 px-2 py-2')}>
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 text-[#5a63df] dark:text-[#a9afff]" strokeWidth={2.25} />
        <span className={cn(MICRO, MUTED, 'truncate')}>{label}</span>
      </div>
      <span
        className={cn(NUM, 'truncate text-xs font-extrabold text-slate-900 dark:text-slate-50')}
      >
        {value}
      </span>
    </div>
  );
}

/** Sub-heading inside a panel body — quieter than PanelTitle, which owns the card. */
export function SectionHeading({ icon: Icon, label, subLabel }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
        <Icon className="h-3 w-3 text-[#5a63df] dark:text-[#a9afff]" strokeWidth={2.25} />
        {label}
      </span>
      {subLabel ? <span className={cn(MICRO, MUTED)}>{subLabel}</span> : null}
    </div>
  );
}

export function getModulePrefix(item) {
  const known = ['listening', 'reading', 'writing', 'speaking', 'grammar'];
  const capitalise = (value) => value.charAt(0).toUpperCase() + value.slice(1);

  const mod = String(item?.skillModule || '').toLowerCase();
  if (known.includes(mod)) return capitalise(mod);

  const code = String(item?.skillCode || '').toLowerCase();
  const matched = known.find((name) => code.startsWith(name));
  return matched ? capitalise(matched) : null;
}

export function EvidencePriorityItem({ item }) {
  const isMeasured = item?.evidenceClass === 'measured_priority';
  const mastery =
    item?.mastery == null ? null : Math.round(Math.max(0, Math.min(1, item.mastery)) * 100);

  const modulePrefix = getModulePrefix(item);
  const rawTitle = item?.module || 'IELTS fundamentals';
  const fullTitle =
    modulePrefix && !rawTitle.toLowerCase().startsWith(modulePrefix.toLowerCase())
      ? `${modulePrefix} — ${rawTitle}`
      : rawTitle;

  return (
    <div
      className={cn(
        TILE,
        'p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
            {fullTitle}
          </p>
          <p className={cn(MICRO, MUTED, 'mt-0.5')}>
            <span className={NUM}>{item?.observations || 0}</span> graded answers
            {mastery == null ? '' : ' · '}
            {mastery == null ? null : <span className={NUM}>{mastery}%</span>}
            {mastery == null ? '' : ' mastery'}
          </p>
        </div>
        <Pill tone={isMeasured ? 'ok' : 'neutral'}>
          {isMeasured ? 'Confirmed' : 'Needs results'}
        </Pill>
      </div>
    </div>
  );
}
