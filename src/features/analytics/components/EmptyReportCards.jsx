import React from 'react';
import { m } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { READINESS_FACTORS } from '../hooks/analyticsCalculations';
import {
  FAINT,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives';

/*
 * The full report's cards before there is anything to put in them. Each keeps
 * the shape its filled version has, uses the report's own row labels, and shows
 * a dash wherever a number will go. Nothing here is sample data.
 */

const QUESTION_TYPES = [
  'True / False / Not Given',
  'Matching headings',
  'Sentence completion',
  'Multiple choice',
];

const MISTAKE_TYPES = ['Almost Correct', 'Left Blank', 'Rushing', 'Thinking Too Long'];

const CRITERIA = [
  'Task Response / Achievement',
  'Coherence & Cohesion',
  'Lexical Resource',
  'Grammatical Range',
];

const POSITIONS = [1, 2, 3, 4];

const TALL = 'col-span-12 md:col-span-5 xl:col-span-3';
const MIDDLE = 'col-span-12 md:col-span-7 xl:col-span-4';
const WIDE = 'col-span-12 xl:col-span-5';
const HALF = 'col-span-12 lg:col-span-6';

function Dash() {
  return (
    <span aria-hidden="true" className={cn(NUM, FAINT, 'text-[11px] font-bold')}>
      —
    </span>
  );
}

function ProPill() {
  return (
    <Pill tone="neutral">
      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
      Pro
    </Pill>
  );
}

function GhostCard({ title, footnote, isPremium = true, className, children }) {
  return (
    <m.section variants={ITEM_VARIANTS} className={cn(PANEL, 'flex flex-col p-4', className)}>
      <PanelTitle label={title} action={isPremium ? null : <ProPill />} />
      <div className="flex flex-1 flex-col justify-center gap-3">{children}</div>
      <PanelFootnote>{footnote}</PanelFootnote>
    </m.section>
  );
}

function GhostBars({ rows }) {
  return (
    <ul className="flex flex-1 flex-col justify-between gap-3">
      {rows.map((row) => (
        <li key={row}>
          <div className="flex items-center justify-between gap-2">
            <span className={cn(MUTED, 'truncate text-[11px] font-bold')}>{row}</span>
            <Dash />
          </div>
          <div className={cn(WELL, 'mt-1 h-1.5 rounded-full')} />
        </li>
      ))}
    </ul>
  );
}

/** A dashed ring where a score or a split will be drawn. */
function GhostRing({ caption }) {
  return (
    <div className="mx-auto grid h-24 w-24 shrink-0 place-items-center rounded-full border-[6px] border-dashed border-[#e4e2f0] dark:border-white/10">
      <div className="text-center">
        <p aria-hidden="true" className={cn(NUM, FAINT, 'text-xl font-extrabold leading-none')}>
          —
        </p>
        <p className={cn(MICRO, MUTED, 'mt-1')}>{caption}</p>
      </div>
    </div>
  );
}

function ReadinessGhost({ isPremium }) {
  return (
    <GhostCard
      title="Exam readiness"
      footnote="Builds from your scored tests"
      isPremium={isPremium}
      className={TALL}
    >
      <GhostRing caption="of 100" />
      <GhostBars rows={READINESS_FACTORS.map((factor) => factor.label)} />
    </GhostCard>
  );
}

function AnswerAnalysisGhost({ isPremium }) {
  return (
    <GhostCard
      title="Answer analysis"
      footnote="From your missed questions"
      isPremium={isPremium}
      className={MIDDLE}
    >
      <GhostRing caption="mistakes" />
      <ul className="grid grid-cols-2 gap-2">
        {MISTAKE_TYPES.map((type) => (
          <li key={type} className={cn(TILE, 'flex items-center justify-between gap-2 p-2.5')}>
            <span className={cn(MUTED, 'truncate text-[11px] font-bold')}>{type}</span>
            <Dash />
          </li>
        ))}
      </ul>
    </GhostCard>
  );
}

/** Three numbered slots, because the filled card is a ranked list. */
function PractiseNextGhost({ isPremium }) {
  return (
    <GhostCard
      title="Practise next"
      footnote="Weakest areas, ranked"
      isPremium={isPremium}
      className={TALL}
    >
      <ol className="flex flex-1 flex-col gap-2">
        {[1, 2, 3].map((rank) => (
          <li
            key={rank}
            className="flex min-h-14 flex-1 items-center gap-2.5 rounded-lg border border-dashed border-[#d9d6ee] px-2.5 dark:border-white/12"
          >
            <span className={cn(NUM, FAINT, 'text-sm font-bold')}>{rank}</span>
            <span aria-hidden="true" className="flex flex-1 flex-col gap-1.5">
              <span className={cn(WELL, 'h-2 w-3/4 rounded-full')} />
              <span className={cn(WELL, 'h-2 w-1/2 rounded-full')} />
            </span>
          </li>
        ))}
      </ol>
    </GhostCard>
  );
}

function PositionGhost({ isPremium }) {
  return (
    <GhostCard
      title="Accuracy by position"
      footnote="By passage or part, in sitting order"
      isPremium={isPremium}
      className={HALF}
    >
      <div className="flex min-h-32 flex-1 items-stretch gap-3">
        {POSITIONS.map((position) => (
          <div key={position} className="flex flex-1 flex-col items-center gap-1.5">
            <Dash />
            <div className={cn(WELL, 'w-full flex-1 rounded-md')} />
            <span className={cn(MICRO, MUTED)}>Part {position}</span>
          </div>
        ))}
      </div>
    </GhostCard>
  );
}

function PracticeLogGhost() {
  return (
    <GhostCard
      title="Practice log"
      footnote="Every completed test is listed here"
      className="col-span-12"
    >
      <ul aria-hidden="true" className="space-y-2">
        {[0, 1, 2].map((row) => (
          <li key={row} className={cn(TILE, 'flex items-center gap-3 p-2.5')}>
            <span className={cn(WELL, 'h-7 w-7 shrink-0 rounded-lg')} />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className={cn(WELL, 'h-2 w-2/5 rounded-full')} />
              <span className={cn(WELL, 'h-2 w-1/4 rounded-full')} />
            </span>
            <Dash />
          </li>
        ))}
      </ul>
    </GhostCard>
  );
}

/** Everything below the report's first two cards, in the report's own order. */
export default function EmptyReportCards({ isPremium }) {
  return (
    <>
      <ReadinessGhost isPremium={isPremium} />
      <GhostCard
        title="Question types"
        footnote="From Reading and Listening"
        isPremium={isPremium}
        className={WIDE}
      >
        <GhostBars rows={QUESTION_TYPES} />
      </GhostCard>
      <AnswerAnalysisGhost isPremium={isPremium} />
      <PractiseNextGhost isPremium={isPremium} />
      <GhostCard
        title="Examiner criteria"
        footnote="From Writing and Speaking"
        isPremium={isPremium}
        className={HALF}
      >
        <GhostBars rows={CRITERIA} />
      </GhostCard>
      <PositionGhost isPremium={isPremium} />
      <PracticeLogGhost />
    </>
  );
}
