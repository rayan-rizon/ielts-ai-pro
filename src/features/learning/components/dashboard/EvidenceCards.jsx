import React, { useMemo } from 'react';
import { Check, Gauge } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Empty, NUM } from '@/features/dashboard/components/primitives';
import { CardHeader, INSET, PlanCard, ROW_RULE, SECONDARY_TEXT } from './PlanCard';
import { computeRunway, isFarBelow } from './studyPlanModel';
import {
  formatMinutes,
  formatSkill,
  getFriendlyPlanText,
  getModuleStyle,
  getPrioritiesList,
} from './dashboardUtils';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];
const BAND_MAX = 9;
const TREND_LABEL = { up: 'Improving', down: 'Declining', stable: 'Steady' };

const FAULT_TEXT = 'text-[rgb(var(--signal-fault))]';
const FAULT_FILL = 'bg-[rgb(var(--signal-fault))]';

const ACCENT_FILL = 'bg-[#5a63df] dark:bg-[#8f97ff]';
const FOOTNOTE = cn('text-[11px] leading-relaxed', SECONDARY_TEXT);

const SMALL_BUTTON =
  'h-7 shrink-0 rounded-lg border border-[#e4e2f0] bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition-all duration-150 hover:border-[#5a63df]/35 hover:text-[#5a63df] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-[#b8bdff]';

function SkillRow({ skill, onStart }) {
  const style = getModuleStyle(skill.module);
  const Icon = style.icon;
  const mastery = Math.round((skill.mastery || 0) * 100);
  const low = mastery < 40;
  const name = formatSkill(skill.skill_code);

  return (
    <li className={cn('flex flex-1 items-center gap-3 py-3', ROW_RULE)}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13px] font-medium">
          <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{name}</span>
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <div className={cn('h-1 flex-1 overflow-hidden rounded-full', INSET)}>
            <div
              className={cn('h-full rounded-full', low ? FAULT_FILL : 'bg-slate-400')}
              style={{ width: `${Math.max(3, mastery)}%` }}
            />
          </div>
          <span className={cn(NUM, 'w-8 text-right text-xs font-semibold', low && FAULT_TEXT)}>
            {mastery}%
          </span>
        </div>
        <p className={cn('mt-1 truncate text-[11px]', SECONDARY_TEXT)}>
          {(skill.observations || 0).toLocaleString()} answers
        </p>
      </div>
      <button
        type="button"
        className={SMALL_BUTTON}
        aria-label={`Practise ${name}, currently ${mastery}% correct`}
        onClick={() =>
          onStart({
            module: skill.module,
            activity_type: 'targeted_drill',
            title: `${style.label}: ${name.toLowerCase()} practice`,
            skill_targets: [skill.skill_code],
            routing: { route: skill.module, mode: 'practice', skill: skill.skill_code },
            requested_mode: 'practice',
          })
        }
      >
        Practise
      </button>
    </li>
  );
}

/** The skills costing the most band, each one a single tap from practice. */
export function FocusSkillsCard({ evidence, onStart }) {
  const priorities = getPrioritiesList(evidence);
  const due = evidence?.due_reviews?.length;

  return (
    <PlanCard aria-label="What to improve" className="gap-1">
      <CardHeader title="What to improve" aside={due ? `${due} reviews due` : null} />
      {priorities.length === 0 ? (
        <Empty
          icon={Gauge}
          title="No focus skills yet"
          message="Complete scored practice and your weakest skills appear here."
        />
      ) : (
        <ul className="flex flex-1 flex-col">
          {priorities.map((skill) => (
            <SkillRow key={`${skill.module}-${skill.skill_code}`} skill={skill} onStart={onStart} />
          ))}
        </ul>
      )}
    </PlanCard>
  );
}

const gapText = (scored, gap) => {
  if (!scored) return 'No score yet. Take a test.';
  return gap <= 0 ? 'At target' : `${gap.toFixed(1)} below`;
};

const scoreFill = (score, gap, target) => {
  if (isFarBelow(score, target)) return FAULT_FILL;
  return gap <= 0 ? 'bg-[rgb(var(--signal-ok))]' : ACCENT_FILL;
};

const targetPercent = (target) => Math.min(100, (target / BAND_MAX) * 100);

function ScoreRow({ module, item, target, trend }) {
  const median = item?.median;
  const scored = median !== null && median !== undefined;
  const score = scored ? Number(median) : null;
  const gap = scored ? Number((target - score).toFixed(1)) : null;
  const style = getModuleStyle(module);
  const Icon = style.icon;
  const trendText = trend ? TREND_LABEL[trend] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[13px] font-medium">
          <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          {style.label}
        </span>
        <span
          className={cn(NUM, 'text-base font-semibold', isFarBelow(score, target) && FAULT_TEXT)}
        >
          {scored ? score.toFixed(1) : '—'}
        </span>
      </div>
      <div className={cn('relative mt-1.5 h-1.5 rounded-full', INSET)}>
        {scored && (
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500 ease-out',
              scoreFill(score, gap, target)
            )}
            style={{ width: `${Math.min(100, (score / BAND_MAX) * 100)}%` }}
          />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-y-[-3px] w-px -translate-x-1/2 bg-slate-400 dark:bg-white/60"
          style={{ left: `${targetPercent(target)}%` }}
        />
      </div>
      <p className={cn('mt-1.5 text-[11px]', SECONDARY_TEXT)}>
        {gapText(scored, gap)}
        {trendText ? ` · ${trendText}` : ''}
      </p>
    </div>
  );
}

const trendFor = (readiness, moduleTrends, module) =>
  Number(readiness?.modules?.[module]?.sample_count) >= 2 ? moduleTrends[module] : null;

/** Median of the last 90 days of scored practice per subject, against the target. */
export function ScoresCard({ readiness, targetBand, moduleTrends = {} }) {
  const range = readiness?.overall?.available ? readiness.overall.range : null;
  const target = Number(targetBand) || 7;

  return (
    <PlanCard aria-label="Where you stand" className="gap-4">
      <CardHeader
        title="Where you stand"
        aside={`Target ${target.toFixed(1)}${range ? ` · Overall ${range[0]}–${range[1]}` : ''}`}
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-x-8">
        {MODULES.map((module) => (
          <ScoreRow
            key={module}
            module={module}
            item={readiness?.modules?.[module]}
            target={target}
            trend={trendFor(readiness, moduleTrends, module)}
          />
        ))}
      </div>
    </PlanCard>
  );
}

const MARKER_BASE =
  'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors duration-200';
const MARKER_TONE = {
  done: 'border-[rgb(var(--signal-ok)/0.35)] bg-[rgb(var(--signal-ok)/0.14)] text-[rgb(var(--signal-ok))]',
  current:
    'border-[#5a63df] bg-[#5a63df]/10 text-[#4a52c9] dark:border-[#8f97ff] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]',
  later:
    'border-[#e4e2f0] bg-white text-slate-400 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-500',
};

function StageMarker({ state, index }) {
  return (
    <span className={cn(MARKER_BASE, MARKER_TONE[state])}>
      {state === 'done' ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-label="Done" />
      ) : (
        index + 1
      )}
    </span>
  );
}

const stageState = (done, current) => {
  if (done) return 'done';
  return current ? 'current' : 'later';
};

function PathStage({ phase, index, current, last }) {
  const done = Number(phase.progressPercent) >= 100;
  const percent = Math.round(phase.progressPercent || 0);
  const hint = current ? phase.progressLabel || phase.progressRule : null;
  const subtitle = done ? null : phase.dateRange;

  return (
    <li className="relative grid grid-cols-[24px_1fr] gap-x-3 pb-4 last:pb-0">
      {!last && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-[11.5px] top-6 bottom-0 w-px',
            done ? 'bg-[rgb(var(--signal-ok)/0.4)]' : 'bg-[#e4e2f0] dark:bg-white/10'
          )}
        />
      )}
      <StageMarker state={stageState(done, current)} index={index} />
      <div
        className={cn(
          'min-w-0 rounded-xl',
          current && '-mt-1.5 -mb-1.5 bg-[#5a63df]/[0.06] px-3 py-2 dark:bg-[#8f97ff]/[0.09]'
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'min-w-0 truncate text-[13px]',
              current ? 'font-semibold' : done ? 'font-medium text-slate-500' : 'font-medium'
            )}
          >
            {phase.shortName}
          </p>
          <span className={cn(NUM, 'shrink-0 text-xs font-semibold', done && SECONDARY_TEXT)}>
            {done ? 'Done' : `${percent}%`}
          </span>
        </div>
        {subtitle && <p className={cn('mt-0.5 text-[11px]', SECONDARY_TEXT)}>{subtitle}</p>}
        {!done && (
          <div className={cn('mt-2 h-1 overflow-hidden rounded-full', INSET)}>
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-out',
                ACCENT_FILL
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        {hint && (
          <p className={cn('mt-1.5 text-[11px] leading-snug', SECONDARY_TEXT)}>
            {getFriendlyPlanText(hint)}
          </p>
        )}
      </div>
    </li>
  );
}

/** One slim bar split into the four stages, each filled by its own progress. */
function PathOverview({ phases, percent, cleared }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={cn(NUM, 'text-3xl font-semibold leading-none')}>{percent}%</span>
        <span className={cn('text-xs', SECONDARY_TEXT)}>
          of the way · {cleared} of {phases.length} stages cleared
        </span>
      </div>
      <div
        className={cn('relative mt-3 h-2 overflow-hidden rounded-full', INSET)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progress to exam day"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            ACCENT_FILL
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
        {phases.slice(1).map((phase, index) => (
          <span
            key={phase.key}
            className="absolute inset-y-0 w-0.5 bg-white dark:bg-[#141319]"
            style={{ left: `${((index + 1) / phases.length) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

/** Four stages, each measured from verified practice. */
export function PathCard({
  phases,
  pathProgress,
  daysLeft,
  examDatePassed,
  weeklyCapacity,
  days,
  readiness,
  targetBand,
}) {
  const percent = Math.round(Number(pathProgress?.overallPercent) || 0);
  const cleared = Number(pathProgress?.stagesDone) || 0;
  const runway = useMemo(
    () => computeRunway({ daysLeft, weeklyCapacity, days, readiness, targetBand }),
    [daysLeft, weeklyCapacity, days, readiness, targetBand]
  );
  const available = daysLeft > 0 && !examDatePassed;
  return (
    <PlanCard aria-label="Path to exam day" className="gap-5">
      <CardHeader title="Path to exam day" aside={available ? `${daysLeft} days to exam` : null} />
      <PathOverview phases={phases} percent={percent} cleared={cleared} />
      {available && (
        <p className={cn(NUM, 'text-xs font-semibold')}>
          <FigureValue value={runway.weeks} />
          <span className={cn('font-sans font-normal', SECONDARY_TEXT)}> weeks · </span>
          <FigureValue value={runway.sessions} />
          <span className={cn('font-sans font-normal', SECONDARY_TEXT)}> sessions · </span>
          <FigureValue value={formatMinutes(runway.minutes)} />
          <span className={cn('font-sans font-normal', SECONDARY_TEXT)}> study time left</span>
        </p>
      )}
      <ol>
        {phases.map((phase, index) => (
          <PathStage
            key={phase.key}
            phase={phase}
            index={index}
            last={index === phases.length - 1}
            current={index === pathProgress?.currentIndex && Number(phase.progressPercent) < 100}
          />
        ))}
      </ol>
      <p className={FOOTNOTE}>
        Each stage is measured from your verified practice. They can clear in any order.
      </p>
    </PlanCard>
  );
}

/** "23h 43m" → digits stay loud, unit letters drop back so the number reads first. */
function FigureValue({ value }) {
  return String(value)
    .split(/(\d+(?:\.\d+)?)/)
    .filter(Boolean)
    .map((part, index) =>
      /^\d/.test(part) ? (
        <span key={index}>{part}</span>
      ) : (
        <span key={index} className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
          {part}
        </span>
      )
    );
}
