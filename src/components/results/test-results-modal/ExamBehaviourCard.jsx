import React from 'react';
import { Flag, Repeat2, SpellCheck2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Ring,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { confidenceReading, deriveBehaviour, indecisionReading } from './resultInsights';

const TONE_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
};

const TONE_RING = {
  ok: 'rgb(var(--signal-ok))',
  warn: 'rgb(var(--signal-warn))',
  fault: 'rgb(var(--signal-fault))',
};

/** One behaviour count with the thing it actually cost underneath. */
function HabitTile({ icon, tone = 'accent', label, value, valueTone, unit, detail }) {
  return (
    <div className={cn(TILE, 'p-2.5')}>
      <div className="flex items-center gap-1.5">
        <IconChip icon={icon} tone={tone} size="sm" />
        <p className={cn(MICRO, MUTED, 'truncate')}>{label}</p>
      </div>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            NUM,
            'text-lg font-extrabold leading-none',
            valueTone || 'text-slate-900 dark:text-slate-50'
          )}
        >
          {value}
        </span>
        {unit && <span className={cn(MICRO, MUTED)}>{unit}</span>}
      </p>
      <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal')}>{detail}</p>
    </div>
  );
}

/**
 * "How you worked" — the behavioural half of the result.
 *
 * Every number here was already calculated at submit time and written to
 * `content_data`, then never shown: `confidenceIndex`, `indecisionScore`,
 * `answerChangeCounts`, and the per-question `wasFlagged` markers. They are the
 * only fields in the stored result that speak to *why* marks were lost rather
 * than repeating *that* they were, which is what the analysis tab's type and
 * section grids were doing against the Overview tab.
 *
 * Nothing is inferred where it was not recorded — an older result that predates
 * flag capture says so instead of printing a confident zero.
 */
export function ExamBehaviourCard({ testResults, errorBuckets }) {
  const behaviour = React.useMemo(
    () => deriveBehaviour(testResults, errorBuckets),
    [testResults, errorBuckets]
  );

  if (!behaviour.available) {
    return (
      <section className={cn(PANEL, 'flex flex-col p-4')}>
        <PanelTitle label="How you worked" />
        <Empty>
          This attempt did not record answer changes or flags, so working habits cannot be shown.
        </Empty>
      </section>
    );
  }

  const confidence = confidenceReading(behaviour.confidence);
  const indecision = indecisionReading(behaviour.indecision);

  // No `h-full`: this card sits first in a stacked pair (see
  // DetailedAnalysisTab), and claiming the whole stretched row height here
  // left nothing for the card stacked below it — the row inflated to fit both
  // instead of the second card absorbing the slack as intended.
  return (
    <section className={cn(PANEL, 'flex flex-col p-4')} aria-labelledby="behaviour-title">
      <PanelTitle label="How you worked" />
      <p id="behaviour-title" className={cn('text-[11px] font-medium leading-relaxed', MUTED)}>
        Technique habits behind this attempt.
      </p>

      {confidence && (
        <div className={cn(TILE, 'mt-2.5 flex items-center gap-3 p-2.5')}>
          <Ring
            value={behaviour.confidence}
            size={52}
            stroke={5}
            label={`${behaviour.confidence}`}
            tone={TONE_RING[confidence.tone]}
          />
          <div className="min-w-0 flex-1">
            <p className={cn(MICRO, MUTED)}>Answer confidence</p>
            <p
              className={cn(
                'mt-0.5 text-[12px] font-extrabold leading-snug',
                TONE_TEXT[confidence.tone]
              )}
            >
              {confidence.text}
            </p>
            {indecision && behaviour.indecision !== null && (
              <div className="mt-2 border-t border-[#eceafa] pt-2 dark:border-white/[0.07]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={cn(MICRO, MUTED)}>Second-guessing</span>
                  <span className={cn(NUM, 'text-[11px] font-bold', TONE_TEXT[indecision.tone])}>
                    {behaviour.indecision}%
                  </span>
                </div>
                <div className={cn('mt-1 h-1 w-full overflow-hidden rounded-full', WELL)}>
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-500 ease-out',
                      indecision.tone === 'ok'
                        ? 'bg-[rgb(var(--signal-ok))]'
                        : indecision.tone === 'warn'
                          ? 'bg-[rgb(var(--signal-warn))]'
                          : 'bg-[rgb(var(--signal-fault))]'
                    )}
                    style={{ width: `${Math.max(2, behaviour.indecision)}%` }}
                  />
                </div>
                <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal')}>
                  {indecision.text}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/*
        All four tiles always render. A missing signal shows "Not recorded"
        rather than disappearing: dropping the tile both hid the fact that the
        attempt never captured it, and collapsed the card to half height, which
        left the row it sits in visibly broken.
      */}
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <HabitTile
          icon={Undo2}
          tone={
            !behaviour.hasChangeData ? 'neutral' : behaviour.changedAndLost ? 'amber' : 'accent'
          }
          label="Answers changed"
          value={behaviour.hasChangeData ? behaviour.questionsChanged : '—'}
          valueTone={!behaviour.hasChangeData ? MUTED : undefined}
          unit={
            behaviour.hasChangeData && behaviour.totalChanges > behaviour.questionsChanged
              ? `${behaviour.totalChanges} edits`
              : null
          }
          detail={
            !behaviour.hasChangeData
              ? 'Not recorded'
              : behaviour.changedAndLost === null
                ? 'Edited before submit'
                : behaviour.changedAndLost > 0
                  ? `${behaviour.changedAndLost} ended wrong`
                  : '0 ended wrong'
          }
        />

        <HabitTile
          icon={SpellCheck2}
          tone={behaviour.nearMiss > 0 ? 'amber' : 'neutral'}
          label="Near misses"
          value={behaviour.nearMiss}
          valueTone={behaviour.nearMiss > 0 ? TONE_TEXT.warn : MUTED}
          detail={behaviour.nearMiss > 0 ? 'Spelling or form slip' : 'No spelling slips'}
        />

        <HabitTile
          icon={Flag}
          tone={!behaviour.hasFlagData ? 'neutral' : behaviour.flaggedLost > 0 ? 'rose' : 'sky'}
          label="Flagged for review"
          value={behaviour.hasFlagData ? behaviour.flaggedCount : '—'}
          valueTone={!behaviour.hasFlagData ? MUTED : undefined}
          detail={
            !behaviour.hasFlagData
              ? 'Not recorded'
              : behaviour.flaggedCount === 0
                ? 'None flagged'
                : `${behaviour.flaggedLost} missed`
          }
        />

        <HabitTile
          icon={Repeat2}
          tone={behaviour.skipped > 0 ? 'amber' : 'emerald'}
          label="Left blank"
          value={behaviour.skipped}
          valueTone={
            behaviour.skipped > 5
              ? TONE_TEXT.fault
              : behaviour.skipped > 0
                ? TONE_TEXT.warn
                : TONE_TEXT.ok
          }
          detail={behaviour.skipped > 0 ? 'No penalty for guessing' : 'All answered'}
        />
      </div>
    </section>
  );
}

export default ExamBehaviourCard;
