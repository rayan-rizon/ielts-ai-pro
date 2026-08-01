import React from 'react';
import { Award, Target, Timer, BookMarked } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { getBandLabel, formatBand } from '../utils';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  Stat,
  WELL,
} from '@/features/dashboard/components/primitives';

/**
 * Tier 1 — "Where you stand right now".
 *
 * The headline band is the one number a learner opens this page for, so it gets
 * a panel to itself at display size with the target gap drawn underneath it.
 * Goal / effort / vocabulary are supporting context and stay at Stat size — the
 * old four-equal-cards row gave them the same weight as the band score and left
 * learners with nothing to read first.
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
  const targetLabel = hasTarget ? getBandLabel(parsedTarget) : null;
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

  const studySubtitle = averageMinutes ? `${averageMinutes} min/test average` : 'No timing data';
  const trackPct = Math.max(0, Math.min(100, Number(progressToTarget) || 0));
  const targetReached = hasTarget && hasScoreData && gap <= 0;

  return (
    <m.section variants={ITEM_VARIANTS} className="grid grid-cols-12 items-start gap-3">
      {/* Headline band — the answer to "what band am I at?" */}
      <div className={cn(PANEL, 'col-span-12 px-3.5 py-3 lg:col-span-5')}>
        <div className="flex items-center gap-1.5">
          <IconChip icon={Award} tone="accent" size="sm" />
          <p className={cn(MICRO, MUTED)}>
            {hasOverallEstimate ? 'Overall estimate' : 'Practice average'}
          </p>
        </div>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span
            className={cn(
              NUM,
              'text-3xl font-extrabold leading-none text-slate-900 dark:text-slate-50'
            )}
          >
            {displayScore}
          </span>
          <Pill tone={targetReached ? 'ok' : 'accent'}>{currentLabel}</Pill>
        </div>

        <p className={cn(MICRO, MUTED, 'mt-1.5')}>{scoreSubtitle}</p>

        {/* Distance to target, drawn rather than described. */}
        <div className="mt-2.5 border-t border-[#eceafa] pt-2.5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between">
            <span className={cn(MICRO, MUTED)}>
              {hasTarget ? 'Progress to target' : 'Target not set'}
            </span>
            <span className={cn(MICRO, targetReached ? 'text-[rgb(var(--signal-ok))]' : MUTED)}>
              {hasTarget && hasScoreData ? (
                <>
                  <span className={cn(NUM, 'font-bold')}>{Math.round(trackPct)}</span>% of the way
                </>
              ) : !hasTarget ? (
                'Set a target'
              ) : (
                'Not started'
              )}
            </span>
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
          <div className="mt-1.5 flex items-center justify-between">
            <span className={cn(MICRO, MUTED)}>
              Now <span className={cn(NUM, 'font-bold')}>{displayScore}</span>
            </span>
            <span className={cn(MICRO, MUTED)}>
              Target{' '}
              <span className={cn(NUM, 'font-bold')}>
                {hasTarget ? formatBand(parsedTarget) : '—'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Supporting context — deliberately quieter than the band score. */}
      <div className="col-span-12 grid grid-cols-1 items-start gap-3 sm:grid-cols-3 lg:col-span-7">
        <Stat
          size="sm"
          icon={Target}
          tone="accent"
          label="Your Goal"
          value={hasTarget ? formatBand(parsedTarget) : '—'}
          sub={goalSubtitle}
          delta={targetLabel ? <Pill tone="neutral">{targetLabel}</Pill> : null}
        />
        <Stat
          size="sm"
          icon={Timer}
          tone="sky"
          label="Study Effort"
          value={
            Number(stats.studyMinutes) > 0 && Number(stats.studyMinutes) < 60
              ? `${stats.studyMinutes}m`
              : `${Number(stats.studyHours || 0).toFixed(1)}h`
          }
          sub={studySubtitle}
          delta={
            stats.studyHoursTrend != null && stats.studyHoursTrend !== 0 ? (
              // Studying less this period is worth noticing, not alarming — amber.
              <Pill tone={stats.studyHoursTrend >= 0 ? 'ok' : 'warn'}>
                {`${stats.studyHoursTrend >= 0 ? '+' : ''}${stats.studyHoursTrend}%`}
              </Pill>
            ) : null
          }
        />
        <Stat
          size="sm"
          icon={BookMarked}
          tone="emerald"
          label="Saved Vocabulary"
          value={stats.vocabCount}
          sub="Active vocabulary entries"
        />
      </div>
    </m.section>
  );
}
