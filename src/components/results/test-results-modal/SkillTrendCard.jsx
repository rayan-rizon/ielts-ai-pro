import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Repeat } from 'lucide-react';
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
} from '@/features/dashboard/components/primitives';

/**
 * `classifyTypeTrend` compares this attempt's accuracy for each question type
 * against the same type across the learner's last five sessions, and labels it
 * improving / declining / recurring / stable. It has existed in
 * `premiumAnalysis.js` the whole time and was used for exactly one thing: a
 * silent +1 to a mistake's sort priority. The learner never saw it.
 *
 * It is the single most valuable thing a paid tier can show on a result screen,
 * because it is the only claim on the page that no single attempt can make:
 * whether a weakness is new, or one they keep paying for.
 */
const STATUS_META = {
  improving: {
    label: 'Improving',
    tone: 'ok',
    icon: ArrowUpRight,
    text: 'text-[rgb(var(--signal-ok))]',
    dot: 'bg-[rgb(var(--signal-ok))]',
    rank: 3,
  },
  declining: {
    label: 'Declining',
    tone: 'fault',
    icon: ArrowDownRight,
    text: 'text-[rgb(var(--signal-fault))]',
    dot: 'bg-[rgb(var(--signal-fault))]',
    rank: 1,
  },
  recurring: {
    label: 'Recurring weakness',
    tone: 'warn',
    icon: Repeat,
    text: 'text-[rgb(var(--signal-warn))]',
    dot: 'bg-[rgb(var(--signal-warn))]',
    rank: 0,
  },
  stable: {
    label: 'Stable',
    tone: 'neutral',
    icon: Minus,
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400 dark:bg-slate-500',
    rank: 2,
  },
};

/**
 * A dumbbell: past accuracy on the left dot, this attempt on the right, the
 * connector coloured by direction. Two positions on one axis make the movement
 * legible at a glance in a way two separate percentages never do.
 */
function TrendRow({ entry }) {
  const meta = STATUS_META[entry.trend.status] || STATUS_META.stable;
  const from = Math.max(0, Math.min(100, entry.trend.historicalAccuracy));
  const to = Math.max(0, Math.min(100, entry.accuracy));
  const delta = to - from;
  const left = Math.min(from, to);
  const width = Math.abs(delta);
  const Icon = meta.icon;

  return (
    <div className={cn(TILE, 'p-2.5')}>
      <div className="flex items-baseline justify-between gap-2">
        <Tip content={entry.label}>
          <span className="min-w-0 cursor-default truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
            {entry.label}
          </span>
        </Tip>
        <span className={cn('flex shrink-0 items-center gap-1', meta.text)}>
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          <span className={cn(NUM, 'text-[11px] font-extrabold')}>
            {delta === 0 ? 'no change' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`}
          </span>
        </span>
      </div>

      {/*
        The track is inset so a 0% reading still has a visible dot instead of
        being clipped at the very edge — a learner stuck at zero on both sides
        would otherwise see an apparently empty row.
      */}
      <div className="relative mt-2 h-4 px-1.5">
        <div className="relative h-full w-full">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e4e2f0] dark:bg-white/[0.12]" />
          {width > 0 && (
            <span
              className={cn('absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full', meta.dot)}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          )}
          <span
            title={`Previous average ${from}%`}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-400 bg-white dark:border-slate-500 dark:bg-[#131315]"
            style={{ left: `${from}%` }}
          />
          <span
            title={`This attempt ${to}%`}
            className={cn(
              'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-[#131315]',
              meta.dot
            )}
            style={{ left: `${to}%` }}
          />
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className={cn(MICRO, MUTED, 'truncate normal-case tracking-normal')}>
          <span className={NUM}>{from}%</span> before → <span className={NUM}>{to}%</span> now
          <span className="text-slate-400 dark:text-slate-500">
            {' '}
            · {entry.trend.attempts} prior attempt{entry.trend.attempts === 1 ? '' : 's'}
          </span>
        </span>
        <span className={cn(MICRO, meta.text, 'shrink-0')}>{meta.label}</span>
      </div>
    </div>
  );
}

export function SkillTrendCard({ analysis }) {
  const { tracked, untracked, counts } = React.useMemo(() => {
    const all = analysis?.typeLosses || [];
    const withHistory = all
      .filter(
        (entry) => entry.trend?.historicalAccuracy !== null && entry.trend?.status !== 'limited'
      )
      .sort((a, b) => {
        const rankA = STATUS_META[a.trend.status]?.rank ?? 2;
        const rankB = STATUS_META[b.trend.status]?.rank ?? 2;
        return rankA - rankB || b.lost - a.lost;
      });

    return {
      tracked: withHistory,
      untracked: all.filter(
        (entry) => entry.trend?.status === 'limited' || entry.trend?.historicalAccuracy === null
      ),
      counts: {
        improving: withHistory.filter((e) => e.trend.status === 'improving').length,
        declining: withHistory.filter((e) => e.trend.status === 'declining').length,
        recurring: withHistory.filter((e) => e.trend.status === 'recurring').length,
      },
    };
  }, [analysis]);

  const headline = counts.recurring
    ? {
        tone: 'warn',
        text:
          counts.recurring === 1
            ? '1 weakness keeps coming back'
            : `${counts.recurring} weaknesses keep coming back`,
      }
    : counts.declining
      ? {
          tone: 'fault',
          text: `${counts.declining} skill${counts.declining === 1 ? '' : 's'} slipped this attempt`,
        }
      : counts.improving
        ? {
            tone: 'ok',
            text: `${counts.improving} skill${counts.improving === 1 ? '' : 's'} improving`,
          }
        : { tone: 'neutral', text: 'Holding steady across attempts' };

  return (
    <section className={cn(PANEL, 'flex h-full flex-col p-4')} aria-labelledby="skill-trend-title">
      <PanelTitle
        label="Skills across your attempts"
        tip="Compares this attempt with the same question types in your last five results. Needs at least two prior attempts with six or more questions of that type."
        action={
          tracked.length > 0 ? (
            <Pill tone={headline.tone === 'neutral' ? 'neutral' : headline.tone}>
              {headline.text}
            </Pill>
          ) : null
        }
      />
      <p id="skill-trend-title" className={cn('text-[11px] font-medium leading-relaxed', MUTED)}>
        A single result cannot tell you whether a weakness is new or permanent. This one can.
      </p>

      {tracked.length === 0 ? (
        <Empty icon={AlertTriangle}>
          Not enough history yet. Two more attempts in this module will start comparing your
          question types.
        </Empty>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          {tracked.map((entry) => (
            <TrendRow key={entry.type} entry={entry} />
          ))}
        </div>
      )}

      {untracked.length > 0 && (
        <p
          className={cn(
            MICRO,
            MUTED,
            'mt-auto border-t border-[#eceafa] pt-2.5 normal-case tracking-normal dark:border-white/[0.07]'
          )}
        >
          <span className={NUM}>{untracked.length}</span> more type
          {untracked.length === 1 ? '' : 's'} in this paper without enough history to compare yet.
        </p>
      )}
    </section>
  );
}

export default SkillTrendCard;
