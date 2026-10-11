import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, Panel, PanelTitle } from '@/features/dashboard/components/primitives';
import { formatBandScore } from '../../utils/speakingReportSummary';
import { CRITERION_HELP } from '../../utils/speakingReportInsights';
import { describeSound } from '../../utils/speakingDrillLibrary';
import { FOCUS_RING } from './reportStyles';

const SEVERITY_TONE = {
  major: 'bg-[rgb(var(--signal-fault))]',
  moderate: 'bg-[rgb(var(--signal-warn))]',
};

function PronunciationDetail({ breakdown }) {
  if (!breakdown) return null;
  const { problematicSounds = [], wordIssues = [] } = breakdown;
  return (
    <div className="mt-2 space-y-2">
      {problematicSounds.length > 0 && (
        <p className="text-[12.5px] text-slate-700 dark:text-slate-200">
          Sounds to work on:{' '}
          <span className="font-bold">
            {problematicSounds.slice(0, 4).map(describeSound).join(', ')}
          </span>
        </p>
      )}
      {wordIssues.length > 0 && (
        <ul className="grid gap-1 sm:grid-cols-2">
          {wordIssues.slice(0, 8).map((item) => (
            <li key={item.word} className="flex items-baseline gap-2 text-[12.5px]">
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full',
                  SEVERITY_TONE[item.severity] || 'bg-slate-300 dark:bg-white/30'
                )}
                aria-hidden="true"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-100">{item.word}</span>
              <span className={MUTED}>{item.issue}</span>
            </li>
          ))}
        </ul>
      )}
      <p className={cn('text-[11.5px]', MUTED)}>
        This was checked on a short part of your recording, so use it as a guide only.
      </p>
    </div>
  );
}

export default function CriteriaDetailPanel({ criteria, strengths, pronunciationBreakdown }) {
  return (
    <Panel className="p-4" aria-labelledby="speaking-criteria-title">
      <PanelTitle label={<span id="speaking-criteria-title">How you were scored</span>} />

      {strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
            What’s already working
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {strengths.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="divide-y divide-[#eceafa] border-t border-[#eceafa] dark:divide-white/[0.07] dark:border-white/[0.07]">
        {criteria.map((criterion) => {
          const note = criterion.note;
          const isPronunciation = criterion.key === 'pronunciation';
          const hasDetail = note || (isPronunciation && pronunciationBreakdown);
          return (
            <details key={criterion.key} className="group">
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center gap-2 py-2.5 [&::-webkit-details-marker]:hidden',
                  FOCUS_RING,
                  'rounded-sm focus-visible:ring-offset-0'
                )}
              >
                <span className="flex-1">
                  <span className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">
                    {criterion.label}
                  </span>
                  {CRITERION_HELP[criterion.key] && (
                    <span className={cn('block text-[11.5px]', MUTED)}>
                      {CRITERION_HELP[criterion.key]}
                    </span>
                  )}
                </span>
                <span className={cn(NUM, 'text-[13px] font-bold text-slate-900 dark:text-white')}>
                  {criterion.value == null ? '—' : formatBandScore(criterion.value)}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="pb-3">
                {hasDetail ? (
                  <>
                    {note && (
                      <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {note}
                      </p>
                    )}
                    {isPronunciation && <PronunciationDetail breakdown={pronunciationBreakdown} />}
                  </>
                ) : (
                  <p className={cn('text-[12.5px]', MUTED)}>No examiner note was saved for this.</p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </Panel>
  );
}
