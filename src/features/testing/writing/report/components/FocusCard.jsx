/**
 * The one thing to work on: where the learner is now, what the goal band looks
 * like, and (as children) their paragraph beside a stronger one.
 */
import React from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { bandGoal, goalTextKey } from '../bandGoals';
import {
  CARD,
  ENGLISH,
  HAIRLINE,
  HEADING,
  PRIMARY_BUTTON,
  TEXT_BUTTON,
  formatBand,
} from './reportStyles';

function GoalPill({ criterion, score, goal }) {
  if (!criterion) return null;
  const hasScore = Number(score) > 0;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ba7c1a]/[0.13] px-2.5 py-0.5 text-[11.5px] font-bold text-[#7a4f0c] dark:bg-[#f0b54a]/15 dark:text-[#f5c870]">
      <bdi {...ENGLISH}>{criterion}</bdi>
      {hasScore && (
        <span className="font-mono tabular-nums tracking-tight" dir="ltr">
          {formatBand(score)}
          {goal && ` → ${formatBand(goal)}`}
        </span>
      )}
    </span>
  );
}

const SIDES = {
  now: {
    box: 'bg-[#fbfaf6] dark:bg-[#f0b54a]/[0.06]',
    title: 'text-[#7a4f0c] dark:text-[#f5c870]',
  },
  goal: {
    box: 'bg-[#f6f9f7] dark:bg-[#7fe0bb]/[0.06]',
    title: 'text-[#0b6b4c] dark:text-[#7fe0bb]',
  },
};

function Side({ kind, title, children }) {
  return (
    <div className={cn('px-4 py-3.5 @2xl:px-[18px] @2xl:py-4', SIDES[kind].box)}>
      <h3 className={cn('text-[13px] font-extrabold', SIDES[kind].title)}>{title}</h3>
      <div className="mt-1.5 text-[14px] leading-relaxed text-[#2a2f47] dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}

function Evidence({ t, text, onShow }) {
  if (!text) return null;
  return (
    <>
      <blockquote
        className="mt-2 font-serif text-[14.5px] leading-relaxed [overflow-wrap:anywhere]"
        {...ENGLISH}
      >
        “{text}”
      </blockquote>
      {onShow && (
        <button type="button" className={TEXT_BUTTON} onClick={onShow}>
          {t('showInEssay')}
        </button>
      )}
    </>
  );
}

/**
 * The marker gives what is wrong and what to do. The action heads the card and
 * the problem is "what you do now"; the length rule already reads that way.
 */
function wording(step) {
  if (step.kind === 'priority' && step.body) return { heading: step.body, now: step.title };
  return { heading: step.title, now: step.body };
}

function Boxes({ t, step, now, goalText, goal, onShowInEssay }) {
  const show =
    onShowInEssay && step.evidenceText
      ? () => onShowInEssay({ originalText: step.evidenceText })
      : null;
  if (![now, step.evidenceText, goalText].some(Boolean)) return null;
  return (
    <div
      className={cn(
        'grid divide-y divide-[#ebeaf5] overflow-hidden rounded-xl border border-[#ebeaf5] dark:divide-white/[0.07] dark:border-white/[0.07]',
        goalText && '@2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0 rtl:@2xl:divide-x-reverse'
      )}
    >
      <Side kind="now" title={t('nowLabel')}>
        {now && <p>{now}</p>}
        <Evidence t={t} text={step.evidenceText} onShow={show} />
      </Side>
      {goalText && (
        <Side kind="goal" title={t('goalLabel', { band: goal })}>
          <p>{goalText}</p>
        </Side>
      )}
    </div>
  );
}

function Focus({ t, taskType, step, score, target, onShowInEssay }) {
  if (!step) {
    return (
      <div>
        <h2 id="writing-focus-title" className={HEADING}>
          {t('noProblemTitle')}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#2a2f47] dark:text-slate-200">
          {t('noProblemBody')}
        </p>
      </div>
    );
  }
  const goal = bandGoal(score, target);
  const key = goalTextKey(step.criterion, taskType, goal);
  const { heading, now } = wording(step);
  return (
    <>
      <div className="flex flex-wrap-reverse items-start justify-between gap-x-4 gap-y-2.5">
        <h2
          id="writing-focus-title"
          className="min-w-0 flex-[1_1_22rem] text-[21px] font-extrabold leading-[1.2] tracking-[-0.025em] text-[#12142b] @2xl:text-[26px] dark:text-white"
        >
          {heading}
        </h2>
        <GoalPill criterion={step.criterion} score={score} goal={goal} />
      </div>
      <Boxes
        t={t}
        step={step}
        now={now}
        goal={goal}
        goalText={key ? t(key) : null}
        onShowInEssay={onShowInEssay}
      />
    </>
  );
}

export function FocusCard({ t, taskType, step, score, target, onShowInEssay, onRevise, children }) {
  const hasComparison = React.Children.toArray(children).length > 0;
  return (
    <section
      className={cn(CARD, '@container space-y-5 p-4 @2xl:p-[26px]')}
      aria-labelledby="writing-focus-title"
    >
      <Focus
        t={t}
        taskType={taskType}
        step={step}
        score={score}
        target={target}
        onShowInEssay={onShowInEssay}
      />
      {hasComparison && <div className={cn('border-t pt-5', HAIRLINE)}>{children}</div>}
      {!hasComparison && onRevise && (
        <button type="button" className={PRIMARY_BUTTON} onClick={onRevise}>
          <PenLine className="h-4 w-4" aria-hidden="true" />
          {t('reviseAnswer')}
        </button>
      )}
    </section>
  );
}
