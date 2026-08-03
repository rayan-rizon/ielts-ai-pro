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
function ContextStat({ icon, tone, label, value, sub, delta, tip }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 px-4 py-2.5 sm:first:pl-0 sm:last:pr-0">
      <div className="flex items-center gap-1.5">
        <IconChip icon={icon} tone={tone} size="sm" />
        <p className={cn(MICRO, MUTED)}>{label}</p>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            NUM,
            'text-xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
          )}
        >
          {value}
        </span>
        {delta}
      </div>
      {sub && <p className={cn(MICRO, MUTED)}>{sub}</p>}
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
  const efficiencyValues = Object.values(stats.efficiency || {}).filter(
    (value) => Number(value) > 0
  );
  const averageMinutes = efficiencyValues.length
    ? Math.round(
        efficiencyValues.reduce((sum, value) => sum + Number(value), 0) / efficiencyValues.length
      )
    : null;

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
    <m.section variants={ITEM_VARIANTS} className="space-y-3">
      <div className="grid grid-cols-12 items-start gap-3">
        {/* Headline band — the answer to "what band am I at?" and nothing else. */}
        <div className={cn(PANEL, 'col-span-12 px-3.5 py-3 lg:col-span-5')}>
          <div className="flex items-center gap-1.5">
            <IconChip icon={Award} tone="accent" size="sm" />
            <p className={cn(MICRO, MUTED)}>
              {hasOverallEstimate ? 'Overall estimate' : 'Practice average'}
            </p>
            <InfoTip>
              {hasOverallEstimate
                ? 'IELTS-rounded average of your latest Reading, Writing, Listening and Speaking scores.'
                : 'Average of every scored, non-abandoned test in this period.'}
            </InfoTip>
          </div>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={cn(
                NUM,
                'text-3xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
              )}
            >
              <AnimatedNumber value={displayScore} decimals={1} />
            </span>
            <Pill tone={targetReached ? 'ok' : 'accent'}>{currentLabel}</Pill>
          </div>

          <p className={cn(MICRO, MUTED, 'mt-1.5')}>{scoreSubtitle}</p>
        </div>

        {/* Supporting context — one panel, three metrics, hairline-divided. */}
        <div
          className={cn(
            PANEL,
            'col-span-12 flex flex-col divide-y divide-[#eceafa] px-3.5 py-1 dark:divide-white/[0.07] sm:flex-row sm:divide-x sm:divide-y-0 sm:px-4 sm:py-2 lg:col-span-7'
          )}
        >
          <ContextStat
            icon={ClipboardCheck}
            tone="accent"
            label="Tests Counted"
            value={<AnimatedNumber value={sat} decimals={0} />}
            sub={satSubtitle}
            tip="Sessions actually sat and scored in this period. Tests left early are tracked separately and kept out of every average on this page."
          />
          <ContextStat
            icon={Timer}
            tone="sky"
            label="Study Effort"
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
                  {`${stats.studyHoursTrend >= 0 ? '+' : ''}${stats.studyHoursTrend}%`}
                </Pill>
              ) : null
            }
            tip="Total recorded time across every session in this period, versus the same window before it."
          />
          <ContextStat
            icon={BookMarked}
            tone="emerald"
            label="Saved Vocabulary"
            value={<AnimatedNumber value={stats.vocabCount} decimals={0} />}
            sub="Active vocabulary entries"
            tip="Words currently saved to your vocabulary list, not limited to this timeframe."
          />
        </div>
      </div>

      {/* Distance to target, drawn rather than described — full width, its own row. */}
      <div className={cn(PANEL, 'px-3.5 py-2.5')}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn(MICRO, MUTED, 'flex items-center gap-1')}>
            {hasTarget ? 'Progress to target' : 'Target not set'}
            <InfoTip>
              Your score as a share of the distance from band 0 to your target band.
            </InfoTip>
          </span>
          {hasTarget && hasScoreData ? (
            <span className={cn(MICRO, targetReached ? 'text-[rgb(var(--signal-ok))]' : MUTED)}>
              <span className={cn(NUM, 'font-bold')}>
                <AnimatedNumber value={trackPct} decimals={0} />
              </span>
              % of the way
            </span>
          ) : null}
        </div>
        <div className={cn('relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full', WELL)}>
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-700 ease-out',
              targetReached ? 'bg-[rgb(var(--signal-ok))]' : 'bg-[#5a63df]'
            )}
            style={{ width: `${trackPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
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
