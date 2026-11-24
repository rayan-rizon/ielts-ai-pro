import React from 'react';
import { Award, BookMarked, ClipboardCheck, Timer } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';
import {
  AnimatedNumber,
  IconChip,
  InfoTip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  WELL,
} from '@/features/dashboard/components/primitives';

/**
 * One metric inside the supporting-context panel.
 *
 * These used to be three separate `Stat` cards sitting beside the headline
 * panel — each with its own border and shadow, sized to its own short
 * content, so the row read as one dense card next to three squat, disconnected
 * ones. A single shared panel with hairline dividers makes them one visual
 * peer of the headline panel instead of three: one border, one shadow, one
 * card — sized to its own content rather than stretched to match a taller
 * neighbour, which only traded "three small boxes" for "one box with dead air
 * in it".
 */
function ContextStat({ icon, tone, label, shortLabel, value, sub, delta, tip }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2 first:pl-0 last:pr-0 sm:px-3.5">
      <div className="flex items-center gap-1.5">
        <IconChip icon={icon} tone={tone} size="sm" className="hidden sm:inline-flex" />
        <p className={cn(MICRO, MUTED, 'truncate')}>
          <span className="sm:hidden">{shortLabel || label}</span>
          <span className="hidden sm:inline">{label}</span>
        </p>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            NUM,
            'text-base font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg'
          )}
        >
          {value}
        </span>
        {delta ? <span className="hidden sm:inline-flex">{delta}</span> : null}
      </div>
      {sub && <p className={cn(MICRO, MUTED, 'hidden sm:block')}>{sub}</p>}
    </div>
  );
}

/**
 * "Where you stand right now."
 *
 * Two questions used to share one panel — "what's my score" and "how far is
 * my target" — which meant the panel's height was always going to dwarf the
 * three short metrics beside it. Splitting them lets the headline card stay
 * exactly as tall as a band number and a subtitle actually need, so it now
 * sits naturally close to the metrics panel's own height instead of forcing
 * one to stretch to match the other. The distance-to-target meter gets a
 * full-width row of its own below, where it has room without borrowing it
 * from a neighbour.
 */
export default function StatCards({ stats, progressToTarget = 0 }) {
  if (!stats) return null;

  const hasScoreData = (stats.measuredTests ?? stats.scoredTests ?? stats.totalTests ?? 0) > 0;
  const parsedTarget = Number(stats.targetScore);
  const hasTarget = Number.isFinite(parsedTarget) && parsedTarget > 0;
  const modulesWithData = stats.modulesWithData || 0;
  const hasOverallEstimate = stats.overallEstimate != null && modulesWithData === 4;
  const displayScore = !hasScoreData
    ? '--'
    : hasOverallEstimate
      ? String(
          stats.overallEstimate % 1 === 0 ? stats.overallEstimate.toFixed(1) : stats.overallEstimate
        )
      : stats.avgScore;

  const currentLabel = hasScoreData ? getBandLabel(displayScore) : 'No score yet';
  // Mean recorded minutes per test. Averaging the per-module averages instead
  // gave one Speaking session the same weight as twenty Reading tests.
  const averageMinutes = Number(stats.avgMinutesPerTest) > 0 ? stats.avgMinutesPerTest : null;

  const scoredText = hasOverallEstimate
    ? 'Latest score from all 4 modules'
    : 'Completed-practice average';
  const improvementVal = parseFloat(stats.improvement);
  const trendText =
    hasScoreData && improvementVal !== 0
      ? ` • ${improvementVal > 0 ? '▲' : '▼'} ${Math.abs(improvementVal)} bands`
      : '';
  const scoreSubtitle = `${scoredText}${trendText}`;

  const scoreForGoal = hasOverallEstimate ? Number(stats.overallEstimate) : Number(stats.avgScore);
  const gap = hasTarget ? parsedTarget - scoreForGoal : null;
  const goalSubtitle = !hasTarget
    ? 'Set your target band'
    : !hasScoreData
      ? 'Awaiting test scores'
      : gap <= 0
        ? 'Target achieved!'
        : `${formatBand(gap)} ${gap === 1 ? 'band' : 'bands'} to target`;

  const trackPct = Math.max(0, Math.min(100, Number(progressToTarget) || 0));
  const targetReached = hasTarget && hasScoreData && gap <= 0;

  const sat = Number(stats.measuredTests ?? stats.scoredTests ?? 0);
  const totalTests = Number(stats.totalTests ?? 0);
  const abandoned = Number(stats.abandonedTests ?? 0);
  const satSubtitle = abandoned
    ? `${abandoned} left early, excluded`
    : `${totalTests} session${totalTests === 1 ? '' : 's'} in this period`;

  return (
    <m.section variants={ITEM_VARIANTS} className={cn(PANEL, 'relative overflow-hidden')}>
      <div className="grid grid-cols-12 items-stretch">
        {/* Headline band — the answer to "what band am I at?" and nothing else. */}
        <div
          className={cn(
            'col-span-12 flex flex-col justify-center border-b px-3.5 py-2 xl:col-span-5 xl:border-b-0 xl:border-r',
            'border-[#e4e2f0] dark:border-white/[0.07]'
          )}
        >
          <div className="flex items-center gap-1.5">
            <IconChip icon={Award} tone="accent" size="sm" />
            <p className={cn(MICRO, MUTED)}>
              {hasOverallEstimate ? 'Overall estimate' : 'Practice average'}
            </p>
            <InfoTip>
              {hasOverallEstimate
                ? 'IELTS-rounded average of your latest Reading, Writing, Listening and Speaking scores.'
                : 'Average of every scored, non-abandoned test in this period.'}{' '}
              The ▲/▼ trend compares your recent and earlier results within each module, then
              averages across modules.
            </InfoTip>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <span
              className={cn(
                NUM,
                'text-3xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50'
              )}
            >
              <AnimatedNumber value={displayScore} decimals={1} />
            </span>
            {hasScoreData && (
              <span className={cn(NUM, 'text-sm font-bold text-slate-400 dark:text-slate-500')}>
                / 9
              </span>
            )}
            <Pill tone={targetReached ? 'ok' : 'accent'} className="self-center">
              {currentLabel}
            </Pill>
          </div>

          <p className={cn(MICRO, MUTED, 'mt-1 hidden sm:block')}>{scoreSubtitle}</p>
        </div>

        {/* Supporting context — one panel, three metrics, hairline-divided. */}
        <div
          className={cn(
            'col-span-12 flex divide-x divide-[#e4e2f0] px-3.5 py-0 dark:divide-white/[0.07] sm:py-2 xl:col-span-7'
          )}
        >
          <ContextStat
            icon={ClipboardCheck}
            tone="accent"
            label="Tests Counted"
            shortLabel="Tests"
            value={<AnimatedNumber value={sat} decimals={0} />}
            sub={satSubtitle}
            tip="Sessions actually sat and scored in this period. Tests left early are tracked separately and kept out of every average on this page."
          />
          <ContextStat
            icon={Timer}
            tone="accent"
            label="Study Effort"
            shortLabel="Study"
            value={
              Number(stats.studyMinutes) > 0 && Number(stats.studyMinutes) < 60
                ? `${stats.studyMinutes}m`
                : `${Number(stats.studyHours || 0).toFixed(1)}h`
            }
            sub={averageMinutes ? `${averageMinutes} min/test average` : 'No timing data'}
            delta={
              stats.studyHoursTrend != null && stats.studyHoursTrend !== 0 ? (
                // Studying less this period is worth noticing, not alarming — amber.
                <Pill tone={stats.studyHoursTrend >= 0 ? 'ok' : 'warn'}>
                  {`${stats.studyHoursTrend >= 0 ? '▲' : '▼'} ${Math.abs(stats.studyHoursTrend)}%`}
                </Pill>
              ) : null
            }
            tip="Total recorded time across every session in this period, versus the same window before it."
          />
          <ContextStat
            icon={BookMarked}
            tone="accent"
            label="Saved Vocabulary"
            shortLabel="Vocab"
            value={<AnimatedNumber value={stats.vocabCount} decimals={0} />}
            sub="Active vocabulary entries"
            tip="Words currently saved to your vocabulary list, not limited to this timeframe."
          />
        </div>
      </div>

      {/* Distance to target — the footer of the same unit, split by a hairline. */}
      <div className={cn('border-t px-3.5 py-2', 'border-[#e4e2f0] dark:border-white/[0.07]')}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn(MICRO, MUTED, 'flex items-center gap-1')}>
            {hasTarget ? 'Progress to target' : 'Target not set'}
            <InfoTip>
              Your score as a share of the distance from band 0 to your target band.
            </InfoTip>
          </span>
          {hasTarget && hasScoreData ? (
            <span
              className={cn(
                MICRO,
                'flex items-center gap-1.5',
                targetReached ? 'text-[rgb(var(--signal-ok))]' : MUTED
              )}
            >
              {targetReached && gap < 0 ? (
                <Pill tone="ok">{`+${formatBand(-gap)} above`}</Pill>
              ) : null}
              <span>
                <span className={cn(NUM, 'font-bold')}>
                  <AnimatedNumber value={trackPct} decimals={0} />
                </span>
                % of the way
              </span>
            </span>
          ) : null}
        </div>
        <div className={cn('relative mt-1 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
          <div
            className={cn(
              'h-full origin-left rounded-full transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
              targetReached
                ? 'bg-[rgb(var(--signal-ok))]'
                : 'bg-gradient-to-r from-[#5a63df]/70 to-[#5a63df]'
            )}
            style={{ width: '100%', transform: `scaleX(${trackPct / 100})` }}
          />
          {/* One tick per band up to the target, so the fill reads as steps, not a smear. */}
          {hasTarget && parsedTarget <= 9
            ? Array.from({ length: Math.ceil(parsedTarget) - 1 }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-white/70 dark:bg-black/40"
                  style={{ left: `${((i + 1) / parsedTarget) * 100}%` }}
                />
              ))
            : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className={cn(MICRO, MUTED)}>
            Now{' '}
            <span className={cn(NUM, 'font-bold')}>
              <AnimatedNumber value={displayScore} decimals={1} />
            </span>
          </span>
          <span
            className={cn(
              MICRO,
              targetReached
                ? 'font-bold text-[rgb(var(--signal-ok))]'
                : 'text-slate-600 dark:text-slate-300'
            )}
          >
            {goalSubtitle}
          </span>
          <span className={cn(MICRO, MUTED)}>
            Target{' '}
            <span className={cn(NUM, 'font-bold')}>
              {hasTarget ? formatBand(parsedTarget) : '—'}
            </span>
          </span>
        </div>
      </div>
    </m.section>
  );
}
