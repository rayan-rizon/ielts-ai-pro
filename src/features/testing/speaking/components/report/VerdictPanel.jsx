import React from 'react';
import { cn } from '@/lib/cn';
import {
  InfoTip,
  MUTED,
  NUM,
  Panel,
  Pill,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { formatBandScore } from '../../utils/speakingReportSummary';
import { compactText } from '../../utils/speakingReportHelpers';

function CriterionRow({ criterion, isLowest }) {
  const pct = criterion.value == null ? 0 : (criterion.value / 9) * 100;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
          {criterion.label}
        </span>
        {isLowest && <Pill tone="warn">Lowest</Pill>}
      </div>
      <span
        className={cn(
          NUM,
          'row-span-2 text-right text-[15px] font-extrabold text-slate-900 dark:text-white'
        )}
      >
        {criterion.value == null ? '—' : formatBandScore(criterion.value)}
      </span>
      <div className={cn('h-1.5 overflow-hidden rounded-full', WELL)} aria-hidden="true">
        <div
          className={cn(
            'h-full rounded-full',
            isLowest ? 'bg-[rgb(var(--signal-warn))]' : 'bg-[rgb(var(--panel-accent))]'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

export default function VerdictPanel({ summary, criteria, holdingBack, targetTip }) {
  const lowestKey = holdingBack && !holdingBack.level ? holdingBack.key : null;
  const tip = compactText(targetTip, { maxSentences: 1, maxChars: 180 });

  return (
    <Panel className="h-full p-4" aria-labelledby="speaking-verdict-title">
      <h2 id="speaking-verdict-title" className="sr-only">
        Your band score
      </h2>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={cn('text-[12px] font-semibold', MUTED)}>Overall band</p>
          <p
            className={cn(
              NUM,
              'mt-0.5 text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] text-slate-900 dark:text-white'
            )}
          >
            {formatBandScore(summary.overallScore)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 pb-1 text-right">
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
            {summary.bandInfo.label}
          </span>
          {summary.isTranscriptEstimate && (
            <span className="inline-flex items-center gap-0.5">
              <Pill tone="warn">Estimate</Pill>
              <InfoTip label="Why this is an estimate">
                We couldn’t measure your pronunciation from the recording, so this band is based
                only on the words you said.
              </InfoTip>
            </span>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-3" aria-label="Scores by criterion">
        {criteria.map((criterion) => (
          <CriterionRow
            key={criterion.key}
            criterion={criterion}
            isLowest={criterion.key === lowestKey}
          />
        ))}
      </ul>

      {holdingBack && (
        <div className="mt-4 border-t border-[#eceafa] pt-3 dark:border-white/10">
          <p className={cn(TITLE, 'text-[12.5px]')}>
            {holdingBack.level
              ? 'All your scores are the same'
              : `${holdingBack.label} is your weakest area`}
          </p>
          {(tip || holdingBack.level) && (
            <p className={cn('mt-1 text-[12px] leading-relaxed', MUTED)}>
              {tip || 'Your next step shows the easiest way to improve.'}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
