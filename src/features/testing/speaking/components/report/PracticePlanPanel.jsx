import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { MUTED, NUM, Panel, PanelTitle } from '@/features/dashboard/components/primitives';
import { SKILL_LAB_ENABLED, skillLabUrl } from '@/features/skill-lab/skills';
import { localDayKey } from '../../utils/speakingReportPractice';
import { describeSound } from '../../utils/speakingDrillLibrary';
import { FOCUS_RING, TEXT_BUTTON } from './reportStyles';

function drillLink(drill, sourceId) {
  if (drill.route === '/grammar') return { to: '/grammar', label: 'Open Grammar Lab' };
  if (drill.route === '/vocabulary') return { to: '/vocabulary', label: 'Open Vocabulary' };
  if (drill.skill && SKILL_LAB_ENABLED) {
    return {
      to: skillLabUrl({ module: 'speaking', skill: drill.skill, sourceId }),
      label: 'Practise in Practice Lab',
    };
  }
  return null;
}

function DayTicks({ drill, week, done, onToggle }) {
  const today = localDayKey();
  return (
    <div className="mt-2.5 flex gap-1" role="group" aria-label={`Days you did ${drill.title}`}>
      {week.map((day) => {
        const checked = done.includes(day.key);
        const future = day.key > today;
        return (
          <button
            key={day.key}
            type="button"
            aria-pressed={checked}
            aria-label={`${day.label}${checked ? ', done' : ''}`}
            title={day.label}
            disabled={future}
            onClick={() => onToggle(drill.id, day.key)}
            className={cn(
              'grid h-7 flex-1 place-items-center rounded-md border text-[10.5px] font-bold transition-[background-color,border-color,color] duration-150',
              FOCUS_RING,
              'focus-visible:ring-offset-1',
              checked
                ? 'border-[#5a63df] bg-[#5a63df] text-white dark:border-[#8f97ff] dark:bg-[#8f97ff] dark:text-[#100f15]'
                : 'border-[#e4e2f0] bg-white text-slate-500 hover:border-[#5a63df]/50 dark:border-white/10 dark:bg-white/4 dark:text-slate-400',
              day.key === today &&
                !checked &&
                'border-[#5a63df]/60 text-[#5a63df] dark:text-[#afb5ff]',
              future && 'cursor-not-allowed opacity-40 hover:border-[#e4e2f0]'
            )}
          >
            {checked ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : day.short}
          </button>
        );
      })}
    </div>
  );
}

export default function PracticePlanPanel({ drills, week, days, onToggleDay, sourceId }) {
  const totalDone = drills.reduce((sum, drill) => sum + (days[drill.id]?.length || 0), 0);

  return (
    <Panel className="p-4" aria-labelledby="speaking-plan-title">
      <PanelTitle label={<span id="speaking-plan-title">Your 7-day plan</span>} accent />
      <p className={cn('-mt-1 text-[12.5px] leading-relaxed', MUTED)}>
        Three short exercises chosen from this test. Start with number 1. Tick a day when you do
        one.
      </p>

      <ol className="mt-3 space-y-3">
        {drills.map((drill, index) => {
          const link = drillLink(drill, sourceId);
          const done = days[drill.id] || [];
          return (
            <li
              key={drill.id}
              className="rounded-lg border border-[#ebeaf7] p-3 dark:border-white/10"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    NUM,
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                    index === 0
                      ? 'bg-[#5a63df] text-white dark:bg-[#8f97ff] dark:text-[#100f15]'
                      : 'bg-[#f4f3fb] text-slate-600 dark:bg-white/8 dark:text-slate-300'
                  )}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                      {drill.title}
                    </h3>
                    <span className={cn(NUM, 'shrink-0 text-[11px]', MUTED)}>
                      {drill.minutes} min
                    </span>
                  </div>
                  {drill.reason && (
                    <p className={cn('mt-0.5 text-[12px] leading-snug', MUTED)}>{drill.reason}</p>
                  )}
                </div>
              </div>

              <details className="group mt-2">
                <summary
                  className={cn(
                    TEXT_BUTTON,
                    'cursor-pointer list-none [&::-webkit-details-marker]:hidden'
                  )}
                >
                  How to do it
                  <ChevronDown
                    className="h-3 w-3 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-[12.5px] leading-relaxed text-slate-600 marker:text-slate-400 dark:text-slate-300">
                  {drill.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                {drill.pairs?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {drill.pairs.map((pair) => (
                      <li
                        key={pair.sound}
                        className="text-[12.5px] text-slate-700 dark:text-slate-200"
                      >
                        <span className="font-bold">{describeSound(pair.sound)}</span>{' '}
                        <span className={MUTED}>{pair.pairs}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              <DayTicks drill={drill} week={week} done={done} onToggle={onToggleDay} />

              {link && (
                <Link to={link.to} className={cn(TEXT_BUTTON, 'mt-2.5')}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className={cn('mt-3 text-[12px]', MUTED)}>
        <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>{totalDone}</span>{' '}
        practice {totalDone === 1 ? 'session' : 'sessions'} done this week
      </p>
    </Panel>
  );
}
