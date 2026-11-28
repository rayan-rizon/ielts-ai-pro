/** The checked revision: what moved, why, and which words changed. */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { criterionChanges, diffWords } from './revisionChecks';

const band = (value) => (Number(value) > 0 ? Number(value).toFixed(1) : '-');
const signed = (delta) => `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(1)}`;

function DeltaPill({ delta }) {
  if (!delta) return <Pill tone="neutral">Same</Pill>;
  return (
    <Pill tone={delta > 0 ? 'ok' : 'warn'}>
      <span className={NUM}>{signed(delta)}</span>
    </Pill>
  );
}

function ScoreMove({ before, after, large }) {
  return (
    <span
      className={cn(NUM, 'inline-flex items-center gap-1.5', large && 'text-2xl font-extrabold')}
    >
      <span className={MUTED}>{band(before)}</span>
      <ArrowRight className={large ? 'h-4 w-4' : 'h-3 w-3'} aria-label="to" />
      <span className="font-extrabold text-slate-900 dark:text-white">{band(after)}</span>
    </span>
  );
}

function CriterionRow({ row }) {
  return (
    <li className="border-t border-[#eceafa] py-2.5 dark:border-white/[0.07]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-[13px] font-bold text-slate-900 dark:text-white">{row.label}</span>
        <span className="flex items-center gap-2 text-[13px]">
          <ScoreMove before={row.before} after={row.after} />
          <DeltaPill delta={row.delta} />
        </span>
      </div>
      {row.note && (
        <p className="mt-1.5 text-[12.5px] leading-snug text-slate-600 dark:text-slate-300">
          {row.note}
          {row.evidence && (
            <span className="mt-1 block font-serif text-slate-800 dark:text-slate-100">
              “{row.evidence.trim()}”
            </span>
          )}
        </p>
      )}
    </li>
  );
}

export function RevisionResult({ feedback, checked }) {
  const rows = criterionChanges(
    feedback.criteriaScores,
    checked.criteriaScores,
    checked.priorities || []
  );
  const delta = Number(checked.overallBand) - Number(feedback.overallBand);
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="revision-result-title">
      <h3 id="revision-result-title" className={TITLE}>
        Your revision check
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <ScoreMove before={feedback.overallBand} after={checked.overallBand} large />
        <DeltaPill delta={Number.isFinite(delta) ? delta : 0} />
      </div>
      <p className={cn('mt-1 text-[12.5px]', MUTED)}>
        A practice check of your new draft. Your original Band {band(feedback.overallBand)} stays.
      </p>
      <ul className="mt-3">
        {rows.map((row) => (
          <CriterionRow key={row.key} row={row} />
        ))}
      </ul>
      <p
        className={cn(
          'border-t border-[#eceafa] pt-2.5 text-[11.5px] leading-4 dark:border-white/[0.07]',
          MUTED
        )}
      >
        Both numbers are AI estimates. Two checks can differ by about half a band, even for small
        edits.
      </p>
    </section>
  );
}

const MARKS = {
  added:
    'rounded-sm bg-[rgb(var(--signal-ok)/0.14)] underline decoration-[rgb(var(--signal-ok))] decoration-2 underline-offset-4',
  removed:
    'rounded-sm bg-[rgb(var(--signal-fault)/0.10)] line-through decoration-[rgb(var(--signal-fault))]',
};

const TAGS = { added: 'ins', removed: 'del', same: 'span' };

export function RevisionChanges({ original, draft }) {
  const runs = diffWords(original, draft);
  return (
    <section className={cn(PANEL, 'p-4')} aria-labelledby="revision-changes-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="revision-changes-title" className={TITLE}>
          What you changed
        </h3>
        <span className={cn(MICRO, MUTED)}>Added is underlined, removed is struck through</span>
      </div>
      <div
        className={cn(
          WELL,
          'mt-2.5 max-h-[60vh] overflow-y-auto whitespace-pre-wrap p-3 font-serif text-[15px] leading-8 text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100'
        )}
        lang="en"
        dir="ltr"
      >
        {runs.map((run, index) => {
          const Tag = TAGS[run.type];
          return (
            <React.Fragment key={index}>
              <Tag className={MARKS[run.type]}>{run.text}</Tag>{' '}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
