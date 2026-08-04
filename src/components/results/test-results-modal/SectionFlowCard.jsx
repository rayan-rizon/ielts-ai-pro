import React from 'react';
import { Clock3, LockKeyhole, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { accuracyTone } from './resultStats';
import {
  PASSAGE_BUDGET_SECONDS,
  deriveSectionFlow,
  formatClock,
  formatSignedMinutes,
  paceTone,
  sectionNoun,
} from './resultInsights';

const TONE_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
  neutral: 'text-slate-500 dark:text-slate-400',
};

const TONE_FILL = {
  ok: 'bg-[rgb(var(--signal-ok))]',
  warn: 'bg-[rgb(var(--signal-warn))]',
  fault: 'bg-[rgb(var(--signal-fault))]',
  neutral: 'bg-slate-300 dark:bg-white/20',
};

/**
 * Time against accuracy for one passage.
 *
 * The pairing is the whole point: twenty-four minutes on a passage is only a
 * problem if the accuracy did not come back with it, and four minutes is only
 * good if it did. Neither number means anything alone, which is why the old
 * card's "time, if we happened to record it" footnote under an accuracy bar
 * never told a learner what to change.
 */
function PaceRow({ section, maxSeconds }) {
  const tone = paceTone(section.overBudgetSeconds);
  const accTone = accuracyTone(section.accuracy);
  const width = maxSeconds > 0 ? Math.max(4, Math.round((section.seconds / maxSeconds) * 100)) : 0;
  const budgetMark = maxSeconds > 0 ? Math.round((PASSAGE_BUDGET_SECONDS / maxSeconds) * 100) : 0;

  return (
    <div className={cn(TILE, 'p-2.5')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
          {section.shortLabel}
        </span>
        <span className={cn(NUM, 'shrink-0 text-[11px] font-bold', TONE_TEXT[tone])}>
          {formatClock(section.seconds)}
        </span>
      </div>

      <div className={cn('relative mt-1.5 h-2 w-full overflow-hidden rounded-full', WELL)}>
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            TONE_FILL[tone]
          )}
          style={{ width: `${width}%` }}
        />
        {budgetMark > 0 && budgetMark <= 100 && (
          <Tip content="20-minute budget mark">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-slate-500/70 dark:bg-white/60 cursor-pointer"
              style={{ left: `${budgetMark}%` }}
            />
          </Tip>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className={cn(MICRO, TONE_TEXT[tone])}>
          {formatSignedMinutes(section.overBudgetSeconds)}
        </span>
        <span className={cn(MICRO, MUTED)}>
          <span className={cn(NUM, 'font-bold', TONE_TEXT[accTone])}>{section.accuracy}%</span>{' '}
          accuracy
        </span>
      </div>
    </div>
  );
}

/** Accuracy across the paper in order, so a drop-off is visible as a shape. */
function DropOffChart({ sections, noun }) {
  if (sections.length < 2) return null;

  return (
    <div className="mt-3">
      <div className="flex items-end gap-1.5">
        {sections.map((section) => {
          const tone = accuracyTone(section.accuracy);
          return (
            <div key={section.index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className={cn(NUM, 'text-[10px] font-bold', TONE_TEXT[tone])}>
                {section.accuracy}%
              </span>
              <Tip
                content={`${section.label}: ${section.correct}/${section.total} correct (${section.accuracy}%)`}
              >
                <div
                  className={cn(
                    'flex h-16 w-full flex-col justify-end overflow-hidden rounded-md cursor-pointer',
                    WELL
                  )}
                >
                  {/* A zero score leaves the track empty rather than painting a
                      three-pixel red sliver, which read as a rendering fault. */}
                  {section.accuracy > 0 && (
                    <div
                      className={cn(
                        'w-full rounded-md transition-[height] duration-500 ease-out',
                        TONE_FILL[tone]
                      )}
                      style={{ height: `${Math.max(4, section.accuracy)}%` }}
                    />
                  )}
                </div>
              </Tip>
              <span className={cn(MICRO, MUTED, 'truncate')}>
                {noun.charAt(0)}
                {section.index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "How the paper unfolded."
 *
 * Replaces `SectionStrategy`, which carried the heading "Passage performance" —
 * the exact heading the Overview tab's section card already used, over the exact
 * same `sectionStats`. Attribution now lives once, on the Overview tab; this
 * card answers a question that card cannot: whether the paper got worse as it
 * went on, and for reading, what the clock was doing while it did.
 */
export function SectionFlowCard({
  testResults,
  testType = 'reading',
  isPremium = false,
  onUpgrade,
}) {
  const flow = React.useMemo(
    () => deriveSectionFlow(testResults, testType),
    [testResults, testType]
  );
  const noun = sectionNoun(testType);
  const isReading = testType !== 'listening';

  if (flow.scored.length === 0) {
    return (
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle label="How the paper unfolded" />
        <Empty>{noun}-level scoring was not stored for this attempt.</Empty>
      </section>
    );
  }

  const { dropOff } = flow;
  // A paper with no marks anywhere has no shape to describe. Calling a 0%
  // passage the learner's "strongest" is technically true of the maximum and
  // completely useless to read, so the narrative is suppressed instead.
  const hasAnyMarks = flow.scored.some((section) => section.correct > 0);
  const fading = hasAnyMarks && dropOff && dropOff.firstToLast <= -10;
  const climbing = hasAnyMarks && dropOff && dropOff.firstToLast >= 10;
  const maxSeconds = flow.hasTiming
    ? Math.max(PASSAGE_BUDGET_SECONDS, ...flow.sections.map((s) => s.seconds || 0))
    : 0;
  // The part that swallowed the most marks — listening's equivalent of a
  // passage that ate the clock.
  const lossLeader =
    !isReading && flow.totalLost > 0
      ? flow.scored.reduce((a, b) => (b.lost > a.lost ? b : a))
      : null;

  return (
    <section className={cn(PANEL, 'flex h-full flex-col p-4')} aria-labelledby="flow-title">
      <PanelTitle
        label="How the paper unfolded"
        action={
          dropOff && hasAnyMarks ? (
            <Pill tone={fading ? 'warn' : climbing ? 'ok' : 'neutral'}>
              {fading ? 'Fading' : climbing ? 'Warming up' : 'Even'}
            </Pill>
          ) : null
        }
      />

      <p id="flow-title" className={cn('text-[11px] font-medium leading-relaxed', MUTED)}>
        {isReading
          ? 'Where the clock went, and whether the accuracy came back with it.'
          : `Accuracy across the four parts, in the order you heard them.`}
      </p>

      <DropOffChart sections={flow.scored} noun={noun} />

      {dropOff && !hasAnyMarks && (
        <div className={cn(TILE, 'mt-3 p-3')}>
          <p className={cn(MICRO, MUTED)}>Nothing scored</p>
          <p className="mt-0.5 text-[11.5px] font-bold leading-snug text-slate-800 dark:text-slate-100">
            No marks were recorded in any {noun.toLowerCase()}, so there is no shape to read yet.
          </p>
        </div>
      )}

      {dropOff && hasAnyMarks && (
        <div className={cn(TILE, 'mt-3 flex items-start gap-2.5 p-3')}>
          <span
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              fading
                ? 'bg-[rgb(var(--signal-warn)/0.12)] text-[rgb(var(--signal-warn))]'
                : climbing
                  ? 'bg-[rgb(var(--signal-ok)/0.12)] text-[rgb(var(--signal-ok))]'
                  : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/[0.18] dark:text-[#afb5ff]'
            )}
          >
            {fading ? (
              <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.25} />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
          </span>
          <div className="min-w-0">
            <p className={cn(MICRO, MUTED)}>
              {fading
                ? 'Accuracy fell as you went'
                : climbing
                  ? 'You built momentum'
                  : 'Steady across the paper'}
            </p>
            <p className="mt-0.5 text-[11.5px] font-bold leading-snug text-slate-800 dark:text-slate-100">
              {dropOff.best.shortLabel} was your strongest at{' '}
              <span className={NUM}>{dropOff.best.accuracy}%</span>
              {dropOff.best.index !== dropOff.weakest.index && (
                <>
                  , {dropOff.weakest.shortLabel} your weakest at{' '}
                  <span className={NUM}>{dropOff.weakest.accuracy}%</span>
                </>
              )}
              .
            </p>
            {dropOff.fatigue > 0 && (
              <p className={cn('mt-1 text-[11px] font-medium leading-relaxed', MUTED)}>
                You finished <span className={cn(NUM, 'font-bold')}>{dropOff.fatigue}</span> points
                below your best {noun.toLowerCase()} —{' '}
                {fading
                  ? 'stamina is costing you marks late in the paper.'
                  : 'a normal amount of variation.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Listening has no clock of its own, so the equivalent detail is where the
          lost marks actually cluster across the four parts. */}
      {!isReading && lossLeader && (
        <div className="mt-auto pt-3">
          <p className={cn(MICRO, MUTED)}>Where the losses cluster</p>
          <div className="mt-2 flex gap-1">
            {flow.scored.map((section) => {
              const share = flow.totalLost > 0 ? (section.lost / flow.totalLost) * 100 : 0;
              return (
                <Tip
                  key={section.index}
                  content={`${section.label}: ${section.lost} of ${flow.totalLost} marks lost`}
                >
                  <div className="min-w-0 flex-1 cursor-pointer">
                    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', WELL)}>
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-500 ease-out',
                          section.index === lossLeader.index
                            ? 'bg-[rgb(var(--signal-fault))]'
                            : 'bg-[rgb(var(--signal-fault)/0.4)]'
                        )}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className={cn(MICRO, MUTED, 'mt-1 text-center')}>
                      <span className={NUM}>{section.lost}</span>
                    </p>
                  </div>
                </Tip>
              );
            })}
          </div>
          <p className={cn(MICRO, MUTED, 'mt-1 normal-case tracking-normal')}>
            {lossLeader.label} cost the most, at{' '}
            <span className={cn(NUM, 'font-bold')}>{lossLeader.lost}</span> of{' '}
            <span className={NUM}>{flow.totalLost}</span> lost marks.
          </p>
        </div>
      )}

      {isReading && (
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
              <Clock3 className="h-3 w-3" /> Time per {noun.toLowerCase()}
            </span>
            {isPremium && flow.hasTiming && flow.totalSeconds > 0 && (
              <span className={cn(MICRO, MUTED)}>
                <span className={NUM}>{formatClock(flow.totalSeconds)}</span> tracked
              </span>
            )}
          </div>

          {!isPremium ? (
            <button
              type="button"
              onClick={onUpgrade}
              className={cn(
                TILE,
                'mt-2 flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:border-[#c9cdf3] dark:hover:border-white/[0.18]'
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/[0.18] dark:text-[#afb5ff]">
                <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100">
                  See where the clock went
                </span>
                <span className={cn(MICRO, MUTED, 'mt-0.5 block normal-case tracking-normal')}>
                  Per-passage time against the 20-minute budget, with the accuracy it bought.
                </span>
              </span>
              <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5a63df] dark:text-[#a9afff]">
                Pro
              </span>
            </button>
          ) : flow.hasTiming ? (
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {flow.sections
                .filter((section) => section.seconds !== null)
                .map((section) => (
                  <PaceRow key={section.index} section={section} maxSeconds={maxSeconds} />
                ))}
            </div>
          ) : (
            <p className={cn(MICRO, MUTED, 'mt-2 normal-case tracking-normal')}>
              Per-passage timing was not recorded for this attempt.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default SectionFlowCard;
