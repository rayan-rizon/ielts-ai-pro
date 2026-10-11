import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Empty,
  MUTED,
  NUM,
  Panel,
  PanelTitle,
  Stat,
  StatRail,
} from '@/features/dashboard/components/primitives';
import {
  LENGTH_TARGETS,
  formatSeconds,
  lengthRatio,
  lengthStatus,
} from '../../utils/speakingReportInsights';
import { FOCUS_RING, LENGTH_TONE } from './reportStyles';

/**
 * Bars are drawn so the target sits at the same height in every part: a bar
 * that reaches the dashed line met its target, whatever the part. Anything
 * past 1.6× the target is capped so one long answer cannot flatten the rest.
 */
const CAP = 1.6;
const TARGET_LINE = (1 / CAP) * 100;

const STATUS_LABEL = {
  ok: 'long enough',
  short: 'too short',
  'very-short': 'much too short',
  unknown: 'length not recorded',
};

function measureLabel(answer, basis) {
  return basis === 'time' ? formatSeconds(answer.durationMs) : `${answer.words} words`;
}

function PartGroup({ part, answers, basis, grown, onSelect, activeId }) {
  const short = answers.filter((answer) => {
    const status = lengthStatus(answer, basis);
    return status === 'short' || status === 'very-short';
  }).length;
  const target = LENGTH_TARGETS[part];

  return (
    <div
      className="flex min-w-[5rem] flex-col"
      style={{ flexGrow: Math.max(answers.length, 1.5), flexBasis: 0 }}
    >
      <div className="relative h-28 sm:h-32">
        <div
          className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-slate-500/80 dark:border-white/45"
          style={{ bottom: `${TARGET_LINE}%` }}
          aria-hidden="true"
        />
        <ul className="absolute inset-0 flex items-end justify-center gap-1 sm:gap-1.5">
          {answers.map((answer, index) => {
            const ratio = lengthRatio(answer, basis);
            const status = lengthStatus(answer, basis);
            const height = ratio == null ? 6 : Math.max(4, (Math.min(ratio, CAP) / CAP) * 100);
            const label = answer.isLongTurn
              ? 'Part 2 talk'
              : `Part ${answer.part}, question ${answer.number}`;
            return (
              <li key={answer.id} className="flex h-full max-w-6 flex-1 items-end">
                <button
                  type="button"
                  onClick={() => onSelect(answer.id)}
                  aria-label={`${label}: ${measureLabel(answer, basis)}, ${STATUS_LABEL[status]}. Show this answer.`}
                  title={`${label}: ${measureLabel(answer, basis)}`}
                  className={cn(
                    'group relative h-full w-full rounded-t-[3px]',
                    FOCUS_RING,
                    'focus-visible:ring-offset-0'
                  )}
                >
                  <span
                    className={cn(
                      'absolute inset-x-0 bottom-0 origin-bottom rounded-t-[3px] transition-[transform,opacity] duration-500 ease-smooth-out group-hover:opacity-80 motion-reduce:transition-none',
                      LENGTH_TONE[status],
                      activeId === answer.id && 'ring-2 ring-slate-900/70 dark:ring-white/80'
                    )}
                    style={{
                      height: `${height}%`,
                      transform: grown ? 'scaleY(1)' : 'scaleY(0)',
                      transitionDelay: grown ? `${index * 40}ms` : '0ms',
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2 border-t border-[#e4e2f0] pt-1.5 text-center dark:border-white/10">
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Part {part}</p>
        <p className={cn('text-[11px] leading-snug', MUTED)}>
          {answers.length === 0
            ? 'No answers'
            : short === 0
              ? 'All long enough'
              : `${short} of ${answers.length} too short`}
        </p>
        <p className={cn(NUM, 'text-[10.5px] text-slate-400 dark:text-slate-500')}>
          {basis === 'time' ? target.short : `${target.words}+ words`}
        </p>
      </div>
    </div>
  );
}

export default function AnswerLengthMap({ answers, basis, delivery, onSelect, activeId }) {
  const reduceMotion = useReducedMotion();
  const [grown, setGrown] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) {
      setGrown(true);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  const parts = [1, 2, 3].map((part) => ({
    part,
    answers: answers.filter((answer) => answer.part === part),
  }));

  return (
    <Panel className="p-4" aria-labelledby="speaking-length-title">
      <PanelTitle
        label={<span id="speaking-length-title">How much you said</span>}
        accent
        tip="Each bar is one of your answers. Bars that reach the dashed line were long enough. Shorter answers give the examiner less to score."
      />

      <StatRail className="-mx-1 mb-4 rounded-lg border border-[#eeedf7] dark:border-white/[0.07]">
        <Stat
          bare
          label="Speaking time"
          value={delivery.speakingMs == null ? 'Not recorded' : formatSeconds(delivery.speakingMs)}
        />
        <Stat bare label="Words" value={String(delivery.words)} />
        <Stat
          bare
          label="Pace"
          value={delivery.wordsPerMinute == null ? 'Not measured' : String(delivery.wordsPerMinute)}
          unit={delivery.wordsPerMinute == null ? undefined : 'wpm'}
          tip="How many words you said each minute. About 110 to 150 sounds natural."
        />
        <Stat
          bare
          label="Clarity"
          value={delivery.clarity == null ? 'Not measured' : String(delivery.clarity)}
          unit={delivery.clarity == null ? undefined : '/100'}
          tip="How easy your words were to understand, checked on a short part of your recording."
        />
      </StatRail>

      {answers.length === 0 ? (
        <Empty
          title="No answers were saved for this test"
          message="Answer lengths appear here after you complete a speaking test."
        />
      ) : (
        <>
          <div className="flex gap-3 sm:gap-6" role="group" aria-label="Answer lengths by part">
            <div className="relative h-28 w-8 shrink-0 sm:h-32" aria-hidden="true">
              <span
                className="absolute right-0 translate-y-1/2 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                style={{ bottom: `${TARGET_LINE}%` }}
              >
                target
              </span>
            </div>
            {parts.map((group) => (
              <PartGroup
                key={group.part}
                {...group}
                basis={basis}
                grown={grown}
                onSelect={onSelect}
                activeId={activeId}
              />
            ))}
          </div>
          <div
            className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]', MUTED)}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t-[1.5px] border-dashed border-slate-500 dark:border-white/45" />
              Target length
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-[2px]', LENGTH_TONE.ok)} /> Long enough
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-[2px]', LENGTH_TONE.short)} /> Too short
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-[2px]', LENGTH_TONE['very-short'])} /> Much too
              short
            </span>
            {basis === 'words' && (
              <span>Measured in words, because answer times weren’t saved for this test.</span>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
