import PracticeSkillLink from '@/features/skill-lab/components/PracticeSkillLink';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  History,
  Lightbulb,
  Save,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { trackAppEvent } from '@/lib/tracking';
import { fetchRecentResultSessions, saveResultFocusPlan } from '@/services/premiumAnalysisService';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  TILE,
  Tip,
  WELL,
} from '@/features/dashboard/components/primitives';
import { buildPremiumAnalysis } from './premiumAnalysis';
import { ExamBehaviourCard } from './ExamBehaviourCard';
import { SectionFlowCard } from './SectionFlowCard';
import { SkillTrendCard } from './SkillTrendCard';
import PaidFeatureGate from '@/features/subscription/components/PaidFeatureGate';

/**
 * This tab used to carry its own design language: an off-brand `#5661e9`
 * indigo, a second Tailwind `indigo-*` ramp, a third `#2563eb` blue for the
 * trend chart, plus navy `#101322/#0e111d/#141829` dark surfaces that never
 * matched the `#131315` panel used everywhere else. It is now on the shared
 * panel primitives and the brand/signal palette.
 */
const CARD = cn(PANEL, 'min-w-0');

/** Answer outcomes read the same here as on the Overview tab. */
const OUTCOME = {
  correct: { fill: 'bg-[rgb(var(--signal-ok))]', text: 'text-[rgb(var(--signal-ok))]' },
  incorrect: { fill: 'bg-[rgb(var(--signal-fault))]', text: 'text-[rgb(var(--signal-fault))]' },
  skipped: { fill: 'bg-[rgb(var(--signal-warn))]', text: 'text-[rgb(var(--signal-warn))]' },
};

function formatBand(value) {
  return Number(value || 0).toFixed(1);
}

function SectionHeading({ icon: Icon, eyebrow, title, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <IconChip icon={Icon} tone="accent" size="md" />
        <div className="min-w-0">
          <h3 className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          {eyebrow && (
            <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>{eyebrow}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/**
 * The gap to the next band, as a strip rather than a card.
 *
 * This was `RecoveryMap`: a three-column panel whose middle column re-rendered
 * `typeStats` as a loss grid and whose right column re-rendered the same
 * correct/wrong/skipped split the Overview hero already shows as a stacked bar
 * and three counts. Both are gone — attribution belongs to the Overview tab's
 * `MarkLossCard`, and the answer mix belongs to the hero. What is genuinely
 * this tab's to own is the arithmetic between here and the target band, so that
 * is all that remains.
 */
function TargetGapStrip({ analysis, testResults, currentBand, selectedTarget }) {
  const needed = analysis.target.additionalCorrect;
  const rawNeeded = analysis.target.rawNeeded;
  const total = analysis.target.total || 0;
  // Read the score from the result rather than reconstructing it as
  // `rawNeeded - needed`: once the learner is past the threshold `needed` is
  // clamped to zero, and that back-calculation would report the threshold
  // itself instead of what they actually scored.
  const current = Math.max(0, Math.min(total, Number(testResults?.correctAnswers) || 0));
  const progress = rawNeeded > 0 ? Math.min(100, Math.round((current / rawNeeded) * 100)) : 100;

  return (
    <section className={`${CARD} p-4`}>
      <SectionHeading
        icon={BarChart3}
        eyebrow="What this paper needed to reach the next band."
        title="Your gap to target"
        action={
          <span className={cn(NUM, 'shrink-0 text-sm font-extrabold', OUTCOME.incorrect.text)}>
            {needed > 0 ? `+${needed} to go` : 'Target met'}
          </span>
        }
      />

      <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full', WELL)}>
            <div
              className="h-full rounded-full bg-[#5a63df] transition-[width] duration-700 ease-out dark:bg-[#8f97ff]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className={cn(MICRO, MUTED)}>
              <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                {current}
              </span>{' '}
              correct now
            </span>
            <span className={cn(MICRO, MUTED)}>
              <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                {rawNeeded}
              </span>{' '}
              of {total} needed for band {formatBand(selectedTarget)}
            </span>
          </div>
        </div>

        <div className={cn(TILE, 'flex shrink-0 items-center gap-3 px-3.5 py-2.5')}>
          <div className="min-w-0 text-center">
            <p className={cn(MICRO, MUTED)}>Now</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
              )}
            >
              {formatBand(currentBand)}
            </p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <div className="min-w-0 text-center">
            <p className={cn(MICRO, MUTED)}>Target band</p>
            <p
              className={cn(
                NUM,
                'mt-0.5 text-xl font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
              )}
            >
              {formatBand(selectedTarget)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MistakeQueue({ analysis, onReviewQuestion, testType, sessionId }) {
  return (
    <section className={`${CARD} flex h-full flex-col p-3.5 sm:p-4 space-y-3`}>
      <SectionHeading
        icon={BookOpenCheck}
        eyebrow="Start with the answers most likely to improve your score."
        title="Review these answers first"
      />
      {!analysis.dataAvailability.hasReliableBuckets ? (
        <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <TriangleAlert className="h-4.5 w-4.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed font-medium text-amber-800 dark:text-amber-200">
            This older result does not contain enough question-level detail for trustworthy cause
            labels. The score map remains available.
          </p>
        </div>
      ) : analysis.mistakeQueue.length ? (
        <>
          <div className="rounded-xl border border-[#ebeaf7] bg-white/80 p-3 dark:border-white/10 dark:bg-white/5">
            <div
              className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6"
              aria-label={`${analysis.errorBuckets.nearMiss} near misses, ${analysis.errorBuckets.changedWrong} changed wrong, ${analysis.errorBuckets.skipped} skipped, and ${analysis.errorBuckets.otherWrong} other wrong answers`}
            >
              {[
                [analysis.errorBuckets.nearMiss, 'bg-[rgb(var(--signal-warn))]', 'Near miss'],
                [analysis.errorBuckets.changedWrong, 'bg-[#8f97ff]', 'Changed wrong'],
                [analysis.errorBuckets.skipped, 'bg-slate-400 dark:bg-slate-500', 'Skipped'],
                [analysis.errorBuckets.otherWrong, 'bg-[rgb(var(--signal-fault))]', 'Other wrong'],
              ].map(([value, color, label]) => {
                if (!value) return null;
                const pct = Math.round((value / (analysis.errorBuckets.total || 1)) * 100);
                return (
                  <Tip
                    key={label}
                    content={
                      <span>
                        <strong>{label}:</strong> {value} ({pct}%)
                      </span>
                    }
                  >
                    <span
                      className={cn(
                        color,
                        'h-full cursor-pointer transition-opacity hover:opacity-85'
                      )}
                      style={{
                        width: `${analysis.errorBuckets.total ? (value / analysis.errorBuckets.total) * 100 : 0}%`,
                      }}
                    />
                  </Tip>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
              {[
                [
                  'Near miss',
                  analysis.errorBuckets.nearMiss,
                  'text-[rgb(var(--signal-warn))]',
                  'bg-[rgb(var(--signal-warn))]',
                ],
                [
                  'Changed wrong',
                  analysis.errorBuckets.changedWrong,
                  'text-[#5a63df] dark:text-[#a9afff]',
                  'bg-[#8f97ff]',
                ],
                [
                  'Skipped',
                  analysis.errorBuckets.skipped,
                  'text-slate-600 dark:text-slate-300',
                  'bg-slate-400 dark:bg-slate-500',
                ],
                [
                  'Other wrong',
                  analysis.errorBuckets.otherWrong,
                  'text-[rgb(var(--signal-fault))]',
                  'bg-[rgb(var(--signal-fault))]',
                ],
              ].map(([label, value, color, dot]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {label} <strong className={color}>{value}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {analysis.mistakeQueue.map((item) => {
              const formattedType = item.type
                ?.replace(/_/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase());
              return (
                <div
                  key={`${item.questionId}-${item.questionNumber}`}
                  className="p-3 rounded-xl border border-[#ebeaf7] bg-white/90 dark:border-white/10 dark:bg-white/5 transition-all hover:border-[#5a63df]/60 shadow-2xs group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5a63df]/10 text-xs font-extrabold text-[#5a63df] border border-[#5a63df]/20 dark:bg-[#8f97ff]/16 dark:text-[#a9afff] dark:border-[#8f97ff]/30 shadow-2xs shrink-0">
                      Q{item.questionNumber}
                    </span>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div className="min-w-0 cursor-default">
                          <p className="truncate text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white">
                            {item.reason}
                          </p>
                          <div className="flex items-center gap-2 mt-1 min-w-0">
                            <span className="inline-block rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/16 dark:text-[#a9afff] border border-[#5a63df]/20 dark:border-[#8f97ff]/30 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                              {item.label}
                            </span>
                            <span className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                              {formattedType}
                            </span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[220px] rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-slate-700 shadow-lg dark:border-white/[0.14] dark:bg-[#242427] dark:text-slate-100"
                      >
                        <p className="text-xs font-extrabold">
                          Q{item.questionNumber} — {item.reason}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {item.label} · {formattedType}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <PracticeSkillLink module={testType} skill={item.type} sourceId={sessionId} />
                  <Button
                    onClick={() => onReviewQuestion(item)}
                    className="h-8.5 px-3.5 rounded-xl bg-[#5a63df] hover:bg-[#4a52c9] text-white font-extrabold text-xs shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  >
                    Review <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
          No recoverable mistakes remain in this result.
        </p>
      )}
    </section>
  );
}

/** "2026-01-05T…" → "Jan 5"; the synthetic current-attempt entry has no real date. */
function formatTrendDate(date) {
  if (!date || date === 'current') return 'This attempt';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Earlier attempt';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Band scale for the trend chart.
 *
 * Padded out to half-band steps and clamped to the IELTS 0–9 range, with a
 * one-band floor on the window so a learner whose scores have not moved gets a
 * readable flat line instead of a zero-height box.
 */
function trendScale(values) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let min = Math.max(0, Math.floor((rawMin - 0.5) * 2) / 2);
  let max = Math.min(9, Math.ceil((rawMax + 0.5) * 2) / 2);
  if (max - min < 1) {
    max = Math.min(9, min + 1);
    if (max - min < 1) min = Math.max(0, max - 1);
  }
  return { min, max, span: Math.max(0.5, max - min) };
}

/**
 * Band-score trend.
 *
 * The previous sparkline drew its dots as SVG `<circle>` elements inside a
 * `preserveAspectRatio="none"` viewBox — the same non-uniform scale that let
 * the line stretch to the container was also stretching every dot into an
 * ellipse. The line and area still stretch (that is what makes the percentage
 * overlay exact), but the dots are now HTML, so they stay round, and the chart
 * has the axis labels it needs to be read rather than merely glanced at.
 */
function ScoreTrendChart({ scores }) {
  const gradientId = React.useId().replace(/:/g, '');
  const values = scores.map((entry) => Number(entry.score) || 0);
  const { min, max, span } = trendScale(values);

  const points = scores.map((entry, index) => {
    const value = Number(entry.score) || 0;
    return {
      x: values.length <= 1 ? 50 : (index / (values.length - 1)) * 100,
      y: 100 - ((value - min) / span) * 100,
      value,
      date: entry.date,
      isCurrent: index === scores.length - 1,
    };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,100 ${line} 100,100`;
  const ticks = [max, min + span / 2, min];

  return (
    <div className="flex gap-2">
      {/* Y axis — without it the line shows movement but never says between what. */}
      <div className="flex w-7 shrink-0 flex-col justify-between py-[5px]">
        {ticks.map((tick) => (
          <span key={tick} className={cn(NUM, MICRO, MUTED, 'text-right leading-none')}>
            {tick.toFixed(1)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-[118px] w-full text-[#5a63df] dark:text-[#a9afff]">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              aria-hidden="true"
              className="absolute inset-x-0 h-px border-t border-dashed border-slate-200 dark:border-white/10"
              style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
            />
          ))}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Band score across ${scores.length} attempts`}
          >
            <defs>
              <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {values.length > 1 && <polygon points={area} fill={`url(#${gradientId}-area)`} />}
            {values.length > 1 && (
              <polyline
                points={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Dots live in HTML so the chart's horizontal stretch cannot deform
              them, and each one is its own hoverable, focusable control. */}
          {points.map((p, index) => (
            <Tooltip key={index} delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${formatTrendDate(p.date)}: band ${p.value.toFixed(1)}`}
                  className="group absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <span
                    className={cn(
                      'block rounded-full border-2 border-current transition-transform group-hover:scale-125 group-focus-visible:scale-125',
                      p.isCurrent
                        ? 'h-3 w-3 bg-current ring-4 ring-[#5a63df]/20 dark:ring-[#a9afff]/25'
                        : 'h-2.5 w-2.5 bg-white dark:bg-[#131315]'
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-slate-700 shadow-lg dark:border-white/[0.14] dark:bg-[#242427] dark:text-slate-100"
              >
                <p className={cn(NUM, 'text-xs font-extrabold')}>Band {p.value.toFixed(1)}</p>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {formatTrendDate(p.date)}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* X axis — only the ends are labelled, so a long run of attempts does
            not collapse into overlapping dates. */}
        <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-[#eceafa] pt-1.5 dark:border-white/[0.07]">
          <span className={cn(MICRO, MUTED, 'truncate')}>{formatTrendDate(scores[0]?.date)}</span>
          <span className={cn(MICRO, 'shrink-0 text-[#5a63df] dark:text-[#a9afff]')}>
            {formatTrendDate(scores[scores.length - 1]?.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentPatterns({ analysis, loading, failed, currentBand }) {
  const scores = [
    ...[...analysis.history.scores].reverse(),
    { score: currentBand, date: 'current' },
  ];
  const firstScore = Number(scores[0]?.score) || 0;
  const latestScore = Number(currentBand) || 0;
  const trendDelta = latestScore - firstScore;
  const trendDirection = trendDelta > 0.05 ? 'up' : trendDelta < -0.05 ? 'down' : 'steady';
  const trendLabel =
    trendDirection === 'steady'
      ? 'Holding steady'
      : `${trendDelta > 0 ? '+' : ''}${trendDelta.toFixed(1)} since first`;
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : History;

  const best = scores.reduce(
    (a, b) => ((Number(b.score) || 0) > (Number(a.score) || 0) ? b : a),
    scores[0] || { score: 0 }
  );

  return (
    // No `h-full` here: this card is the first of a stacked pair inside a
    // stretched grid row (the practice plan below it absorbs the rest via
    // `flex-1`). `h-full` on the first item claims the whole stretched row for
    // itself and pushes the row's total height well past what either card
    // actually needs — the bug behind the oversized card in review.
    <section className={`${CARD} flex flex-col p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={History}
          eyebrow="Your latest results in this test type."
          title="Your score trend"
        />
        {!loading && !failed && analysis.history.scores.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.07] px-2.5 py-1 text-[10px] font-extrabold text-[#5a63df] dark:border-[#a9afff]/20 dark:bg-[#a9afff]/10 dark:text-[#b8bcff]">
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-48 flex-1 animate-pulse rounded-xl bg-slate-100 dark:bg-white/4" />
      ) : failed ? (
        <p className="rounded-xl border border-amber-200/60 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          History could not be loaded. Current-result analysis is unaffected.
        </p>
      ) : !analysis.history.scores.length ? (
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-dashed border-[#5a63df]/20 bg-[#5a63df]/6 p-3.5 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/8">
          <span
            className={cn(
              NUM,
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#5a63df] dark:bg-white/4'
            )}
          >
            {formatBand(currentBand)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Baseline recorded</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Your next same-module result will start the trend line.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Three read-outs the chart itself cannot state precisely. */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'First', value: firstScore, tone: MUTED },
              {
                label: 'Best',
                value: Number(best?.score) || 0,
                tone: 'text-[rgb(var(--signal-ok))]',
              },
              {
                label: 'Latest',
                value: latestScore,
                tone: 'text-[#5a63df] dark:text-[#a9afff]',
              },
            ].map((stat) => (
              <div key={stat.label} className={cn(TILE, 'px-3 py-2')}>
                <p className={cn(MICRO, MUTED)}>{stat.label}</p>
                <p className={cn(NUM, 'mt-1 text-lg font-extrabold leading-none', stat.tone)}>
                  {formatBand(stat.value)}
                </p>
              </div>
            ))}
          </div>

          <div
            className={cn(
              WELL,
              'mt-3 flex flex-1 flex-col justify-center rounded-xl border border-slate-200/70 p-3 dark:border-white/8'
            )}
          >
            <ScoreTrendChart scores={scores} />
          </div>

          <p className={cn(MICRO, MUTED, 'mt-2.5 normal-case tracking-normal')}>
            <span className={NUM}>{scores.length}</span> scored attempt
            {scores.length === 1 ? '' : 's'} in this module · hover any point for its band.
          </p>
        </>
      )}
    </section>
  );
}

function RecoveryPlan({ analysis, canSave, saving, savedPathId, onSave, onViewPlan }) {
  const [showAllDays, setShowAllDays] = React.useState(false);
  const visiblePlan = showAllDays ? analysis.plan : analysis.plan.slice(0, 3);

  return (
    <section className={`${CARD} flex h-full flex-col p-4 space-y-3`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeading
          icon={CalendarCheck2}
          eyebrow="One focused practice action per day."
          title="Your 7-day practice plan"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {analysis.plan.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllDays((visible) => !visible)}
              className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-[#5a63df] hover:bg-[#5a63df]/10 dark:text-[#a9afff] dark:hover:bg-white/5"
              aria-expanded={showAllDays}
            >
              {showAllDays ? 'Show first 3 days' : 'Show all 7 days'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAllDays ? 'rotate-180' : ''}`}
              />
            </button>
          )}
          {savedPathId ? (
            <Button
              variant="outline"
              onClick={onViewPlan}
              className="h-9 rounded-xl px-4 text-xs font-bold border-slate-200 dark:border-white/[0.07] shadow-2xs hover:bg-[#5a63df]/10 dark:hover:bg-[#8f97ff]/10"
            >
              View saved plan <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-[#5a63df]" />
            </Button>
          ) : (
            <Button
              onClick={onSave}
              disabled={!canSave || saving}
              className="h-9 rounded-xl bg-[#5a63df] px-4 text-xs font-extrabold text-white shadow-xs hover:bg-[#4a52c9] active:scale-[0.98] disabled:opacity-55"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save plan'}
            </Button>
          )}
        </div>
      </div>
      {/*
        This card lives in a narrower stacked column now (roughly 7/12 of the
        modal width, not the full page) — `lg:`/`xl:` breakpoints key off
        *viewport* width, so on a wide screen they still forced all 7 cards
        into one row inside that narrower container, squeezing each one to
        under 120px and truncating the title down to a stray character. A flat
        3-column cap sizes to what this column can actually offer: one row of
        3 collapsed, three rows (3/3/1) expanded, every card wide enough to
        read.
      */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePlan.map((item) => (
          <Tooltip key={item.day} delayDuration={200}>
            <TooltipTrigger asChild>
              <div className="flex min-w-0 cursor-default items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-white/[0.07] dark:bg-white/5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5a63df] text-[10px] font-extrabold text-white">
                  D{item.day}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {item.skill}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-extrabold text-[#5a63df] dark:text-[#a9afff]">
                  {item.minutes}m
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-[220px] rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-slate-700 shadow-lg dark:border-white/[0.14] dark:bg-[#242427] dark:text-slate-100"
            >
              <p className="text-xs font-extrabold">{item.title}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {item.skill} · {item.minutes}m
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {!canSave && (
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:text-right">
          This older result can show the plan, but it cannot be saved.
        </p>
      )}
    </section>
  );
}

export function DetailedAnalysisTab({
  testResults,
  testData,
  userId,
  sessionId,
  targetBand,
  isPremium,
  onUpgrade,
  onReviewQuestion,
  testType = 'reading',
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTarget =
    Number(targetBand) > Number(testResults.bandScore) ? Number(targetBand) : undefined;
  const [selectedTarget, setSelectedTarget] = React.useState(initialTarget);
  const [savedPathId, setSavedPathId] = React.useState(null);
  const viewedRef = React.useRef(false);

  const historyQuery = useQuery({
    queryKey: ['premium-analysis-history', userId, testType, sessionId || 'legacy'],
    queryFn: () => fetchRecentResultSessions({ userId, testType, sessionId }),
    enabled: Boolean(isPremium && userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const analysis = React.useMemo(
    () =>
      buildPremiumAnalysis({
        testResults,
        testData,
        recentSessions: historyQuery.data || [],
        testType,
        targetBand: selectedTarget,
      }),
    [testResults, testData, historyQuery.data, testType, selectedTarget]
  );

  React.useEffect(() => {
    if (!selectedTarget && analysis.target.targetBand)
      setSelectedTarget(analysis.target.targetBand);
  }, [analysis.target.targetBand, selectedTarget]);

  React.useEffect(() => {
    if (!isPremium || viewedRef.current) return;
    viewedRef.current = true;
    trackAppEvent('premium_analysis_viewed', {
      module: testType,
      history_available: analysis.dataAvailability.hasHistory,
      insight_category: 'score_recovery_coach',
    });
  }, [analysis.dataAvailability.hasHistory, isPremium, testType]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveResultFocusPlan({
        sessionId,
        testType,
        plan: analysis.plan,
        targetBand: analysis.target.targetBand,
      }),
    onSuccess: (result) => {
      setSavedPathId(result?.path_id || result?.pathId || true);
      queryClient.invalidateQueries({ queryKey: ['learningPath'] });
      trackAppEvent('premium_plan_saved', {
        module: testType,
        history_available: analysis.dataAvailability.hasHistory,
        insight_category: 'seven_day_plan',
      });
      toast.success('Your seven-day recovery plan is ready.');
    },
    onError: (error) => toast.error(error?.message || 'The plan could not be saved.'),
  });

  const handleUpgrade = () => {
    trackAppEvent('premium_analysis_upgrade_clicked', {
      module: testType,
      history_available: false,
      insight_category: 'free_teaser',
    });
    onUpgrade?.();
  };

  const handleReview = (item) => {
    trackAppEvent('premium_analysis_review_clicked', {
      module: testType,
      history_available: analysis.dataAvailability.hasHistory,
      insight_category: item.bucket,
    });
    onReviewQuestion?.(item.questionNumber);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5">
      {/*
        This tab answers "why", never "what". Attribution — accuracy by question
        type and by passage — is the Overview tab's job and appears there once,
        cross-tabulated. Everything below is a signal the Overview cannot carry:
        the arithmetic to the next band, which answers to reopen, how the paper
        unfolded, how the learner worked, and how the skills are moving across
        attempts.
      */}
      <div className="mx-auto max-w-[1400px] space-y-3">
        <PracticeSkillLink module={testType} sourceId={sessionId} />
        <TargetGapStrip
          analysis={analysis}
          testResults={testResults}
          currentBand={testResults.bandScore}
          selectedTarget={selectedTarget || analysis.target.targetBand}
        />

        {/*
          Every row stretches and every card fills it. The mistake queue runs to
          five rows while a behaviour card is four tiles tall, so pairing them
          one-to-one left half a screen of dead panel underneath the short one.
          The tall card is now balanced by a stacked pair instead.
        */}
        <div className="grid items-stretch gap-3 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col lg:col-span-7">
            <MistakeQueue
              analysis={analysis}
              onReviewQuestion={handleReview}
              testType={testType}
              sessionId={sessionId}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
            {/*
              This card is the first of a stacked pair (SectionFlowCard fills
              what's left below it) — `h-auto` overrides the gate's default
              `h-full`, which would otherwise claim the entire stretched row
              height for itself and leave nothing for the card underneath.
            */}
            <PaidFeatureGate
              hasAccess={Boolean(isPremium)}
              label="Working habits"
              title="See how you worked, not just what you scored"
              description="Answer changes, second-guessing, flagged questions and blanks — the technique signals recorded during the test that explain why marks were lost."
              benefits={[
                'Confidence and second-guessing read-outs',
                'Flagged and changed answers traced to marks',
              ]}
              onUpgrade={handleUpgrade}
              className="h-auto"
            >
              <ExamBehaviourCard testResults={testResults} errorBuckets={analysis.errorBuckets} />
            </PaidFeatureGate>

            <div className="flex min-w-0 flex-1 flex-col">
              <SectionFlowCard
                testResults={testResults}
                testType={testType}
                isPremium={Boolean(isPremium)}
                onUpgrade={handleUpgrade}
              />
            </div>
          </div>
        </div>

        <div className="grid items-stretch gap-3 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col lg:col-span-5">
            <PaidFeatureGate
              hasAccess={Boolean(isPremium)}
              label="Skill trends"
              title="See whether a weakness is new or permanent"
              description="Compares every question type in this paper with the same types across your recent attempts, so a recurring weakness stops hiding behind one bad result."
              benefits={[
                'Improving vs recurring per question type',
                'Built from your last five attempts',
              ]}
              onUpgrade={handleUpgrade}
            >
              <SkillTrendCard analysis={analysis} />
            </PaidFeatureGate>
          </div>
          {/*
            The skill-trend list runs one row per question type — six on a full
            reading paper — while the trend chart is a fixed height. Pairing them
            one-to-one left the whole lower half of the right column empty, so
            the chart and the practice plan stack to meet it instead.
          */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
            {/* First of a stacked pair — see the note above the habits card. */}
            <PaidFeatureGate
              hasAccess={Boolean(isPremium)}
              label="Score trend"
              title="Track this module across every attempt"
              description="Plot this result against your recent scores in the same module to see whether the band is genuinely moving."
              benefits={['Cross-test score patterns', 'Every scored attempt on one line']}
              onUpgrade={handleUpgrade}
              className="h-auto"
            >
              <RecentPatterns
                analysis={analysis}
                loading={historyQuery.isLoading}
                failed={historyQuery.isError}
                currentBand={testResults.bandScore}
              />
            </PaidFeatureGate>

            <div className="flex min-w-0 flex-1 flex-col">
              <PaidFeatureGate
                hasAccess={Boolean(isPremium)}
                label="Advanced coaching"
                title="Turn this result into a longer-term plan"
                description="Get a personalised seven-day recovery plan built from the mistakes above, and save it straight to your learning path."
                benefits={[
                  'Seven-day plan built from this result',
                  'Saves into your learning path',
                ]}
                onUpgrade={handleUpgrade}
              >
                <RecoveryPlan
                  analysis={analysis}
                  canSave={Boolean(sessionId)}
                  saving={saveMutation.isPending}
                  savedPathId={savedPathId}
                  onSave={() => saveMutation.mutate()}
                  onViewPlan={() => navigate('/learning-path')}
                />
              </PaidFeatureGate>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          WELL,
          MICRO,
          MUTED,
          'mx-auto mt-3 flex max-w-[1400px] items-center gap-2.5 rounded-xl px-4 py-2.5 normal-case tracking-normal'
        )}
      >
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#a9afff]" />
        Near-miss labels are review hints. They never change your official score.
      </div>
    </div>
  );
}
