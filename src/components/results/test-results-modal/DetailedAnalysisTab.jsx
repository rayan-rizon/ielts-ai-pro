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
  Clock3,
  Headphones,
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
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Ring,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import { buildPremiumAnalysis } from './premiumAnalysis';
import { accuracyTone, deriveResultStats } from './resultStats';
import PaidFeatureGate from '@/features/subscription/components/PaidFeatureGate';

/**
 * This tab used to carry its own design language: an off-brand `#5661e9`
 * indigo, a second Tailwind `indigo-*` ramp, a third `#2563eb` blue for the
 * trend chart, plus navy `#101322/#0e111d/#141829` dark surfaces that never
 * matched the `#131315` panel used everywhere else. It is now on the shared
 * panel primitives and the brand/signal palette.
 */
const CARD = cn(PANEL, 'min-w-0');

const TONE_TEXT = {
  ok: 'text-[rgb(var(--signal-ok))]',
  warn: 'text-[rgb(var(--signal-warn))]',
  fault: 'text-[rgb(var(--signal-fault))]',
};

/** Answer outcomes read the same here as on the Overview tab. */
const OUTCOME = {
  correct: { fill: 'bg-[rgb(var(--signal-ok))]', text: 'text-[rgb(var(--signal-ok))]' },
  incorrect: { fill: 'bg-[rgb(var(--signal-fault))]', text: 'text-[rgb(var(--signal-fault))]' },
  skipped: { fill: 'bg-[rgb(var(--signal-warn))]', text: 'text-[rgb(var(--signal-warn))]' },
};

function formatBand(value) {
  return Number(value || 0).toFixed(1);
}

function formatTime(seconds) {
  if (!seconds) return 'Not recorded';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${String(remaining).padStart(2, '0')}s`;
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

function RecoveryMap({ analysis, testResults, currentBand, selectedTarget, _onTargetChange }) {
  const totalLost = analysis.typeLosses.reduce((sum, entry) => sum + entry.lost, 0);
  // The paper-level mix comes from the same source the Overview tab uses.
  // Re-summing `typeLosses` here produced a different total whenever a question
  // carried no type label, so the two tabs disagreed on the same result.
  const stats = React.useMemo(() => deriveResultStats(testResults), [testResults]);
  const {
    total: totalQuestions,
    correct: totalCorrect,
    wrong: totalIncorrect,
    skipped: totalSkipped,
  } = stats;
  const correctPct = stats.accuracy;
  const largestLoss = analysis.typeLosses[0];

  return (
    <section className={`${CARD} p-4`}>
      <SectionHeading
        icon={BarChart3}
        eyebrow="Compare the size of each loss before choosing what to practise."
        title="Where you lost marks"
        action={
          <span className={cn(NUM, 'shrink-0 text-sm font-extrabold', OUTCOME.incorrect.text)}>
            {totalLost} lost
          </span>
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
        {/* Standing — where the learner is and what the gap costs */}
        <div className={cn(TILE, 'p-3')}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={cn(MICRO, MUTED)}>Current</p>
              <p
                className={cn(
                  NUM,
                  'text-xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {formatBand(currentBand)}
              </p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
            <div className="min-w-0 text-right">
              <p className={cn(MICRO, MUTED)}>Target band</p>
              <p
                className={cn(
                  NUM,
                  'text-xl font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
                )}
              >
                {formatBand(selectedTarget)}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
            <span
              className={cn(
                NUM,
                'text-lg font-extrabold leading-none text-[#5a63df] dark:text-[#a9afff]'
              )}
            >
              +{analysis.target.additionalCorrect}
            </span>
            <span className={cn(MICRO, MUTED)}>
              answer{analysis.target.additionalCorrect === 1 ? '' : 's'} needed
            </span>
          </div>
        </div>

        {/* Movement — per-type composition, signal-coded */}
        <div className="grid auto-rows-min gap-1.5 sm:grid-cols-2">
          {analysis.typeLosses.length ? (
            analysis.typeLosses.map((entry) => (
              <div key={entry.type} className={cn(TILE, 'p-2.5')}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                    {entry.label}
                  </p>
                  <p className={cn(NUM, 'shrink-0 text-[11px] font-bold', OUTCOME.incorrect.text)}>
                    −{entry.lost}
                  </p>
                </div>
                <div
                  className={cn('mt-1.5 flex h-1.5 overflow-hidden rounded-full', WELL)}
                  aria-label={`${entry.label}: ${entry.correct} correct, ${entry.incorrect} incorrect and ${entry.skipped} skipped`}
                >
                  {[
                    [entry.correct, OUTCOME.correct.fill],
                    [entry.incorrect, OUTCOME.incorrect.fill],
                    [entry.skipped, OUTCOME.skipped.fill],
                  ].map(([value, fill], i) => (
                    <span
                      key={i}
                      className={fill}
                      style={{ width: `${entry.total ? (value / entry.total) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <p className={cn(NUM, MUTED, 'mt-1 text-[10px] font-bold')}>
                  {entry.correct}/{entry.total} correct
                </p>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2">
              <Empty>No lost marks in this result.</Empty>
            </div>
          )}
        </div>

        {/* Summary ring — replaces a hand-rolled conic-gradient donut */}
        <div className={cn(TILE, 'flex h-full flex-col justify-between p-3')}>
          <div className="flex items-center gap-3">
            <Ring
              value={correctPct}
              size={52}
              stroke={5}
              label={`${totalQuestions ? Math.round(correctPct) : 0}%`}
              tone="rgb(var(--signal-ok))"
            />
            <div className="min-w-0 flex-1">
              <p className={cn(MICRO, MUTED)}>Answer mix</p>
              <p
                className={cn(
                  NUM,
                  'mt-0.5 text-sm font-extrabold text-slate-900 dark:text-slate-50'
                )}
              >
                {totalCorrect}/{totalQuestions || 0}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-1')}>
                <span className={OUTCOME.incorrect.text}>{totalIncorrect}</span> wrong ·{' '}
                <span className={OUTCOME.skipped.text}>{totalSkipped}</span> skipped
              </p>
            </div>
          </div>
          {largestLoss && (
            <div className="mt-3 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
              <p className={cn(MICRO, MUTED)}>Best recovery opportunity</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                  {largestLoss.label}
                </p>
                <p className={cn(NUM, 'shrink-0 text-[11px] font-bold', OUTCOME.incorrect.text)}>
                  {largestLoss.lost} marks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MistakeQueue({ analysis, onReviewQuestion }) {
  return (
    <section className={`${CARD} p-3.5 sm:p-4 space-y-3`}>
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
              className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"
              aria-label={`${analysis.errorBuckets.nearMiss} near misses, ${analysis.errorBuckets.changedWrong} changed wrong, ${analysis.errorBuckets.skipped} skipped, and ${analysis.errorBuckets.otherWrong} other wrong answers`}
            >
              {[
                [analysis.errorBuckets.nearMiss, 'bg-[rgb(var(--signal-warn))]'],
                [analysis.errorBuckets.changedWrong, 'bg-[#8f97ff]'],
                [analysis.errorBuckets.skipped, 'bg-slate-400 dark:bg-slate-500'],
                [analysis.errorBuckets.otherWrong, 'bg-[rgb(var(--signal-fault))]'],
              ].map(([value, color], index) => (
                <span
                  key={index}
                  className={color}
                  style={{
                    width: `${analysis.errorBuckets.total ? (value / analysis.errorBuckets.total) * 100 : 0}%`,
                  }}
                />
              ))}
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5a63df]/10 text-xs font-extrabold text-[#5a63df] border border-[#5a63df]/20 dark:bg-[#8f97ff]/[0.16] dark:text-[#a9afff] dark:border-[#8f97ff]/30 shadow-2xs shrink-0">
                      Q{item.questionNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white">
                        {item.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <span className="inline-block rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/[0.16] dark:text-[#a9afff] border border-[#5a63df]/20 dark:border-[#8f97ff]/30 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                          {item.label}
                        </span>
                        <span className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                          {formattedType}
                        </span>
                      </div>
                    </div>
                  </div>
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

function SectionStrategy({ analysis, testType }) {
  const isReading = testType === 'reading';
  return (
    <section className={`${CARD} h-full p-3.5 sm:p-4 space-y-3`}>
      <SectionHeading
        icon={isReading ? Clock3 : Headphones}
        eyebrow={
          isReading
            ? 'Compare accuracy and time across each passage.'
            : 'See which listening parts cost the most marks.'
        }
        title={isReading ? 'Passage performance' : 'Part performance'}
      />
      <div className="space-y-2.5">
        {analysis.sectionStrategy.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 dark:bg-white/[0.04]">
            Section-level scoring was not stored for this result.
          </p>
        )}
        {analysis.sectionStrategy.map((section) => (
          <div
            key={section.index}
            className="p-3 rounded-xl border border-[#ebeaf7] bg-white/90 dark:border-white/10 dark:bg-white/5 shadow-2xs space-y-2 transition-all hover:border-[#5a63df]/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white">
                  {section.label}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {section.lost} point{section.lost === 1 ? '' : 's'} lost · {section.accuracy}%
                  accuracy
                </p>
              </div>
              <span
                className={cn(
                  NUM,
                  'shrink-0 text-xs font-bold',
                  TONE_TEXT[accuracyTone(section.accuracy)]
                )}
              >
                {section.correct}/{section.total}
              </span>
            </div>

            {/* Visual Accuracy Bar */}
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.07]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  section.accuracy >= 80
                    ? 'bg-[rgb(var(--signal-ok))]'
                    : section.accuracy >= 50
                      ? 'bg-[rgb(var(--signal-warn))]'
                      : 'bg-[rgb(var(--signal-fault))]'
                }`}
                style={{ width: `${Math.max(5, section.accuracy)}%` }}
              />
            </div>

            {/* Only rendered when timing was actually captured — every row
                previously printed "Not recorded / Timing unavailable", which
                was pure noise on results that never stored per-section time. */}
            {isReading && section.seconds ? (
              <div className="flex items-center justify-between border-t border-[#eceafa] pt-2 dark:border-white/[0.07]">
                <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
                  <Clock3 className="h-3 w-3" />
                  <span className={NUM}>{formatTime(section.seconds)}</span>
                </span>
                {section.paceDeltaSeconds != null && (
                  <span
                    className={cn(
                      MICRO,
                      section.paceDeltaSeconds > 0 ? TONE_TEXT.warn : TONE_TEXT.ok
                    )}
                  >
                    <span className={NUM}>
                      {Math.ceil(Math.abs(section.paceDeltaSeconds) / 60)}m
                    </span>{' '}
                    {section.paceDeltaSeconds > 0 ? 'over benchmark' : 'available'}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {!isReading && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Listening analysis intentionally uses error concentration by part; answer timestamps are
          not presented as time spent.
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

function TrendSparkline({ scores }) {
  const values = scores.map((entry) => Number(entry.score) || 0);
  const minVal = Math.max(0, Math.min(...values) - 0.5);
  const maxVal = Math.min(9, Math.max(...values) + 0.5);
  const range = Math.max(1, maxVal - minVal);
  const gradientId = React.useId().replace(/:/g, '');

  const pointsArray = scores.map((entry, index) => {
    const value = Number(entry.score) || 0;
    const x = values.length <= 1 ? 120 : 16 + (index / (values.length - 1)) * 208;
    const y = 64 - ((value - minVal) / range) * 44; // maps y between 20 and 64
    return {
      x,
      y,
      value,
      date: entry.date,
      isCurrent: index === scores.length - 1,
    };
  });

  const points = pointsArray.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `16,74 ${points} 224,74`;

  return (
    // `currentColor` drives the line, area fill and dot rings, so the chart
    // follows the brand accent in both themes instead of the hardcoded blue.
    // `preserveAspectRatio="none"` makes the SVG stretch to fill the container
    // exactly, so the hit-target overlay below can use plain x/y percentages
    // instead of guessing at the letterboxed render box.
    <div className="relative w-full text-[#5a63df] dark:text-[#a9afff]">
      <svg
        viewBox="0 0 240 80"
        preserveAspectRatio="none"
        className="h-24 w-full overflow-visible"
        role="img"
        aria-label="Recent band score trend"
      >
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Quiet grid lines keep the score movement readable without competing with the line. */}
        {[20, 42, 64].map((y) => (
          <line
            key={y}
            x1="12"
            x2="228"
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-slate-200/80 dark:text-[#3d3a5d]"
            strokeDasharray="1 5"
            strokeLinecap="round"
          />
        ))}

        {/* Area fill gives the chart a little depth while preserving the flat dashboard surface. */}
        {values.length > 1 && <polygon points={polygonPoints} fill={`url(#${gradientId}-area)`} />}

        {values.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${gradientId}-glow)`}
          />
        )}

        {pointsArray.map((p, index) => (
          <circle
            key={index}
            cx={p.x}
            cy={p.y}
            r={p.isCurrent ? 5.5 : 4}
            className={
              p.isCurrent ? 'fill-current' : 'fill-white stroke-current dark:fill-[#242427]'
            }
            stroke="currentColor"
            strokeWidth={p.isCurrent ? '2' : '2.5'}
          />
        ))}
      </svg>

      {/* Real point controls keep the chart hoverable and keyboard-focusable without adding click state. */}
      {pointsArray.map((p, index) => (
        <Tooltip key={index} delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`${formatTrendDate(p.date)}: band ${p.value.toFixed(1)}`}
              className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-help rounded-full transition-colors hover:bg-[#5a63df]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50 dark:hover:bg-[#a9afff]/10 dark:focus-visible:ring-[#a9afff]/55"
              style={{ left: `${(p.x / 240) * 100}%`, top: `${(p.y / 80) * 100}%` }}
            />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-slate-700 shadow-lg dark:border-white/[0.14] dark:bg-[#242427] dark:text-slate-100"
          >
            <p className="text-xs font-extrabold">Band {p.value.toFixed(1)}</p>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {formatTrendDate(p.date)} · Hover for details
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
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

  return (
    <section className={`${CARD} h-full space-y-3.5 p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={History}
          eyebrow="Your latest results in this test type."
          title="Your score trend"
        />
        {!loading && !failed && analysis.history.scores.length > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.07] px-2.5 py-1 text-[10px] font-extrabold text-[#5a63df] dark:border-[#a9afff]/20 dark:bg-[#a9afff]/[0.10] dark:text-[#b8bcff]">
            <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-white/[0.04]" />
      ) : failed ? (
        <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300">
          History could not be loaded. Current-result analysis is unaffected.
        </p>
      ) : !analysis.history.scores.length ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#5a63df]/20 bg-[#5a63df]/[0.06] p-3.5 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.08]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#5a63df] shadow-2xs dark:bg-white/[0.04]">
            {formatBand(currentBand)}
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Baseline recorded</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Your next same-module result will start the trend line.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              WELL,
              'rounded-xl border border-slate-200/70 p-3.5 dark:border-white/[0.08]'
            )}
          >
            <div className="flex items-start justify-between gap-4 px-1 pb-2">
              <div>
                <p className={cn(MICRO, MUTED)}>First attempt</p>
                <p
                  className={cn(
                    NUM,
                    'mt-0.5 text-sm font-extrabold text-slate-700 dark:text-slate-200'
                  )}
                >
                  Band {formatBand(firstScore)}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#a9afff]')}>Latest result</p>
                <p
                  className={cn(
                    NUM,
                    'mt-0.5 text-sm font-extrabold text-[#5a63df] dark:text-[#b8bcff]'
                  )}
                >
                  Band {formatBand(latestScore)}
                </p>
              </div>
            </div>
            <div className="relative rounded-lg border border-slate-200/70 bg-white/45 px-1.5 pt-1 dark:border-white/[0.06] dark:bg-[#0d0d12]/45">
              <TrendSparkline scores={scores} />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200/70 px-1 pt-2 text-[10px] font-bold text-slate-400 dark:border-white/[0.07] dark:text-slate-500">
              <span>
                {scores.length} scored attempt{scores.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-500 dark:text-slate-400">Hover a point for details</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function RecoveryPlan({ analysis, canSave, saving, savedPathId, onSave, onViewPlan }) {
  const [showAllDays, setShowAllDays] = React.useState(false);
  const visiblePlan = showAllDays ? analysis.plan : analysis.plan.slice(0, 3);

  return (
    <section className={`${CARD} p-4 space-y-3`}>
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
      <div
        className={`grid grid-cols-1 gap-2 sm:grid-cols-3 ${
          showAllDays ? 'lg:grid-cols-4 xl:grid-cols-7' : ''
        }`}
      >
        {visiblePlan.map((item) => (
          <div
            key={item.day}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-white/[0.07] dark:bg-white/5"
          >
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
      <div className="mx-auto max-w-[1400px] space-y-3">
        <RecoveryMap
          analysis={analysis}
          testResults={testResults}
          currentBand={testResults.bandScore}
          selectedTarget={selectedTarget || analysis.target.targetBand}
          onTargetChange={setSelectedTarget}
        />
        <div className="grid items-start gap-3 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <MistakeQueue analysis={analysis} onReviewQuestion={handleReview} />
          </div>
          <div className="min-w-0 space-y-3 lg:col-span-5">
            <SectionStrategy analysis={analysis} testType={testType} />
          </div>
        </div>
        {isPremium ? (
          <div className="grid items-start gap-3 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5">
              <RecentPatterns
                analysis={analysis}
                loading={historyQuery.isLoading}
                failed={historyQuery.isError}
                currentBand={testResults.bandScore}
              />
            </div>
            <div className="min-w-0 lg:col-span-7">
              <RecoveryPlan
                analysis={analysis}
                canSave={Boolean(sessionId)}
                saving={saveMutation.isPending}
                savedPathId={savedPathId}
                onSave={() => saveMutation.mutate()}
                onViewPlan={() => navigate('/learning-path')}
              />
            </div>
          </div>
        ) : (
          <PaidFeatureGate
            hasAccess={false}
            label="Advanced coaching"
            title="Turn this result into a longer-term plan"
            description="Compare this score with recent attempts and get a personalised seven-day recovery plan you can save to your learning path."
            benefits={['Cross-test score patterns', 'Saved seven-day practice plan']}
            className="min-h-[210px]"
            onUpgrade={handleUpgrade}
          />
        )}
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
