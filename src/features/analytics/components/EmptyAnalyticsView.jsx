import React from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, BarChart3, Brain, ChevronRight, TrendingUp } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { CONTAINER_VARIANTS, ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelFootnote,
  PanelTitle,
  Pill,
  ROW_CHEVRON,
  ROW_HOVER,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';
import AnalyticsHeader from './AnalyticsHeader';
import StatCards from './StatCards';

const STARTER_PAPERS = [
  {
    id: 'starter-reading',
    module: 'reading',
    title: 'Academic Reading · Diagnostic Set',
    minutes: 15,
    tag: 'Quick Start',
    href: '/reading-test',
    detail: '1 passage · 13 questions · instant band score',
  },
  {
    id: 'starter-listening',
    module: 'listening',
    title: 'Listening Section 1 · Everyday Social',
    minutes: 10,
    tag: 'Audio',
    href: '/listening-test',
    detail: '1 audio track · 10 questions · note strategy',
  },
  {
    id: 'starter-writing',
    module: 'writing',
    title: 'Writing Task 2 · Essay Prompt',
    minutes: 40,
    tag: 'AI Feedback',
    href: '/writing-task',
    detail: 'Detailed band 9 scoring across all 4 criteria',
  },
  {
    id: 'starter-speaking',
    module: 'speaking',
    title: 'Speaking Part 1 · Interview Flow',
    minutes: 5,
    tag: 'Fluency',
    href: '/speaking-test',
    detail: 'AI speech coach · pronunciation & speed check',
  },
];

const ANALYTICS_PREVIEWS = [
  {
    icon: TrendingUp,
    tone: 'accent',
    title: 'Band trajectory engine',
    desc: 'Longitudinal progression per module with confidence bounds and target gap analysis.',
  },
  {
    icon: Award,
    tone: 'emerald',
    title: 'Examiner criteria rubric',
    desc: 'Criterion-by-criterion breakdown across Task Achievement, Coherence, Lexical Resource, and Grammar.',
  },
  {
    icon: Brain,
    tone: 'sky',
    title: 'Weak-spot diagnostic radar',
    desc: 'Pinpoints exact question formats (T/F/NG, Headings, Matching) costing you marks.',
  },
];

function formatTestDate(testDate) {
  if (!testDate) return null;
  return new Date(testDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseTargetScore(stats) {
  if (!stats?.targetScore) return null;
  const num = Number(stats.targetScore);
  return Number.isNaN(num) ? null : num;
}

function AnalyticsPreviewsGrid() {
  return (
    <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {ANALYTICS_PREVIEWS.map((item) => (
        <div key={item.title} className={cn(TILE, 'flex flex-col gap-2 p-3')}>
          <div className="flex items-center gap-2">
            <IconChip icon={item.icon} tone={item.tone} size="sm" />
            <span className="truncate text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
              {item.title}
            </span>
          </div>
          <p className={cn(MICRO, MUTED, 'normal-case leading-snug tracking-normal')}>
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function StarterPapersGrid() {
  return (
    <div className="mt-4 border-t border-[#eeedf7] pt-3 dark:border-white/[0.07]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn(MICRO, MUTED)}>RECOMMENDED STARTER PAPERS</span>
        <span className={cn(MICRO, MUTED)}>DIRECT DIAGNOSTIC</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTER_PAPERS.map((starter) => (
          <Link
            key={starter.id}
            to={starter.href}
            className={cn(
              TILE,
              ROW_HOVER,
              'group flex items-center gap-3 p-2.5 transition-all duration-150'
            )}
          >
            <div
              className={cn(
                WELL,
                'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-[#e4e2f0] dark:border-white/10'
              )}
            >
              <span
                className={cn(
                  NUM,
                  'text-xs font-bold leading-none text-slate-900 dark:text-slate-50'
                )}
              >
                {starter.minutes}
              </span>
              <span
                className={cn(MICRO, 'text-[8px] leading-none text-[#5a63df] dark:text-[#afb5ff]')}
              >
                min
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]">
                {starter.title}
              </p>
              <p className={cn(MICRO, MUTED, 'mt-0.5 truncate')}>{starter.detail}</p>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-[#5a63df] opacity-80 group-hover:opacity-100 dark:text-[#afb5ff]">
              <span className="hidden xs:inline">Start</span>
              <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', ROW_CHEVRON)} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PerformancePipelinePanel() {
  return (
    <div className="col-span-12 lg:col-span-8">
      <m.section variants={ITEM_VARIANTS} className={cn(PANEL, 'flex h-full flex-col p-4 sm:p-5')}>
        <PanelTitle
          label="Performance analytics pipeline"
          accent
          action={<Pill tone="accent">Awaiting baseline test</Pill>}
          tip="Automated analytics, diagnostic insights, and score trajectories activate once you complete any scored practice test."
        />

        {/* Hero Callout */}
        <div
          className={cn(
            TILE,
            'flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3.5 sm:p-4'
          )}
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
            <BarChart3 className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50">
              Unlock your IELTS performance intelligence
            </h3>
            <p className={cn(MICRO, MUTED, 'mt-1 normal-case leading-relaxed tracking-normal')}>
              Complete your first scored practice test to activate automated band estimation, IELTS
              examiner criteria breakdown, and question-type error pattern diagnostics.
            </p>
          </div>
        </div>

        {/* 3 Analytics Previews */}
        <AnalyticsPreviewsGrid />

        {/* Recommended Starter Tests */}
        <StarterPapersGrid />

        <PanelFootnote className="mt-auto pt-3">
          All four modules (Reading, Listening, Writing, Speaking) are required to generate your
          official IELTS-rounded overall band estimate.
        </PanelFootnote>
      </m.section>
    </div>
  );
}

function ReadinessBenchmarksCard({ targetScore }) {
  const targetProximityText = targetScore ? `Band ${formatBand(targetScore)}` : 'Awaiting score';

  return (
    <m.section variants={ITEM_VARIANTS} className={cn(PANEL, 'flex flex-col p-4 sm:p-5')}>
      <PanelTitle
        label="Readiness benchmarks"
        action={<Pill tone="neutral">0 of 3 active</Pill>}
        tip="Examiner readiness requires evidence across 4-module coverage, score consistency, and target proximity."
      />

      <p className={cn(MICRO, MUTED, 'mb-3')}>
        IELTS test readiness requires verified evidence across three core benchmarks:
      </p>

      <div className="space-y-2">
        <div className={cn(TILE, 'p-3')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
              4-Module Baseline
            </span>
            <Pill tone="warn">Pending</Pill>
          </div>
          <p className={cn(MICRO, MUTED, 'mt-1 normal-case leading-snug tracking-normal')}>
            Complete at least one scored test in Reading, Listening, Writing, and Speaking to unlock
            holistic band prediction.
          </p>
        </div>

        <div className={cn(TILE, 'p-3')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
              Score Consistency
            </span>
            <Pill tone="neutral">0 / 3 tests</Pill>
          </div>
          <p className={cn(MICRO, MUTED, 'mt-1 normal-case leading-snug tracking-normal')}>
            Maintain band score variance within ±0.5 across 3 consecutive practice tests.
          </p>
        </div>

        <div className={cn(TILE, 'p-3')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
              Target Proximity
            </span>
            <Pill tone="neutral">{targetProximityText}</Pill>
          </div>
          <p className={cn(MICRO, MUTED, 'mt-1 normal-case leading-snug tracking-normal')}>
            Reach within 0.5 bands of your target score in all 4 test formats.
          </p>
        </div>
      </div>

      <PanelFootnote className="mt-auto">
        Readiness criteria match British Council & IDP assessment standards.
      </PanelFootnote>
    </m.section>
  );
}

function TargetScheduleCard({ targetScore, formattedTestDate, hasTestDate }) {
  const targetBandText = targetScore ? formatBand(targetScore) : '—';
  const targetGoalText = targetScore ? 'Official goal' : 'Not set yet';
  const examDateStatus = hasTestDate ? 'Scheduled' : 'No date set';
  const scheduleActionText = targetScore ? 'Update preparation schedule' : 'Set your target score';

  return (
    <m.section variants={ITEM_VARIANTS} className={cn(PANEL, 'flex flex-col p-4 sm:p-5')}>
      <PanelTitle
        label="Target & schedule"
        action={
          <Link to="/onboarding" className={cn(PANEL_LINK, 'text-[11px] font-bold')}>
            Adjust <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <div className={cn(TILE, 'p-2.5')}>
          <p className={cn(MICRO, MUTED)}>Target Band</p>
          <p className={cn(NUM, 'mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-50')}>
            {targetBandText}
          </p>
          <p className={cn(MICRO, MUTED, 'mt-0.5')}>{targetGoalText}</p>
        </div>

        <div className={cn(TILE, 'p-2.5')}>
          <p className={cn(MICRO, MUTED)}>Exam Date</p>
          <p
            className={cn(
              NUM,
              'mt-1 text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate'
            )}
          >
            {formattedTestDate || '—'}
          </p>
          <p className={cn(MICRO, MUTED, 'mt-0.5')}>{examDateStatus}</p>
        </div>
      </div>

      <div className="mt-2.5">
        <Link
          to="/onboarding"
          className={cn(
            TILE,
            ROW_HOVER,
            'flex items-center justify-between p-2.5 text-slate-700 dark:text-slate-200'
          )}
        >
          <span className="text-[11px] font-bold">{scheduleActionText}</span>
          <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
        </Link>
      </div>
    </m.section>
  );
}

/**
 * Empty Analytics View — instrument-panel zero-state for IELTS candidates.
 *
 * Renders the top KPI metrics (average, test count, effort, distance to target),
 * previews the 3 analytical engines that will activate, and provides a direct
 * 4-module starter paper launchpad instead of a dead-end redirect.
 */
export default function EmptyAnalyticsView({ headerProps, stats, user, progressToTarget = 0 }) {
  const targetScore = parseTargetScore(stats);
  const testDate = user?.test_date ?? null;
  const formattedTestDate = formatTestDate(testDate);

  return (
    <TooltipProvider delayDuration={150}>
      <m.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-[1600px] space-y-3"
      >
        <AnalyticsHeader {...headerProps} />

        {/* Top KPI instrument strip */}
        <StatCards stats={stats} progressToTarget={progressToTarget} />

        <div className="grid grid-cols-12 gap-3">
          {/* Main Pipeline Panel (8 cols) */}
          <PerformancePipelinePanel />

          {/* Right Rail (4 cols): Readiness Benchmarks & Target Profile */}
          <div className="col-span-12 flex flex-col gap-3 lg:col-span-4">
            <ReadinessBenchmarksCard targetScore={targetScore} />
            <TargetScheduleCard
              targetScore={targetScore}
              formattedTestDate={formattedTestDate}
              hasTestDate={Boolean(testDate)}
            />
          </div>
        </div>
      </m.div>
    </TooltipProvider>
  );
}
