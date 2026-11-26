import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, CircleX, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  Ring,
  TILE,
  WELL,
} from '@/features/dashboard/components/primitives.jsx';

const OK = 'rgb(var(--signal-ok))';
const WARN = 'rgb(var(--signal-warn))';
const FAULT = 'rgb(var(--signal-fault))';

function scoreTone(percent) {
  if (percent >= 80) return { color: OK, pill: 'ok', headline: 'Strong set' };
  if (percent >= 50) return { color: WARN, pill: 'warn', headline: 'Getting there' };
  return { color: FAULT, pill: 'fault', headline: 'Worth another look' };
}

function rowStatus(row) {
  if (row.isCorrect) return { label: 'Correct', tone: 'ok', Icon: Check };
  if (!row.answered) return { label: 'Not answered', tone: 'warn', Icon: Minus };
  return { label: 'Incorrect', tone: 'fault', Icon: CircleX };
}

const STRIPE = {
  ok: 'before:bg-[rgb(var(--signal-ok))]',
  warn: 'before:bg-[rgb(var(--signal-warn))]',
  fault: 'before:bg-[rgb(var(--signal-fault))]',
};

const CHIP = {
  ok: 'border-[rgb(var(--signal-ok)/0.4)] bg-[rgb(var(--signal-ok)/0.1)] text-[rgb(var(--signal-ok))]',
  warn: 'border-[rgb(var(--signal-warn)/0.4)] bg-[rgb(var(--signal-warn)/0.1)] text-[rgb(var(--signal-warn))]',
  fault:
    'border-[rgb(var(--signal-fault)/0.4)] bg-[rgb(var(--signal-fault)/0.1)] text-[rgb(var(--signal-fault))]',
};

function familiarityLabel(familiarity) {
  if (familiarity === 'new') return 'New questions';
  if (familiarity === 'familiar') return 'Familiar source';
  return 'Repeated questions';
}

/** Score banner shown once a practice set has been checked. */
export function ResultSummary({ result, rows, familiarity, showLearningPath, onJump }) {
  const total = result.total || rows.length || 0;
  const correct = result.correct ?? rows.filter((row) => row.isCorrect).length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const tone = scoreTone(percent);
  const missed = total - correct;
  return (
    <section className={cn(PANEL, 'space-y-3.5 p-4 sm:p-5')} aria-label="Practice result">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5">
        <div className="flex items-center gap-4">
          <Ring value={percent} size={72} stroke={7} tone={tone.color} label={`${percent}%`} />
          <div className="min-w-0">
            <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>Practice result</p>
            <h2
              className={cn(
                NUM,
                'text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50'
              )}
            >
              {correct} of {total} correct
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Pill tone={tone.pill}>{missed === 0 ? 'All correct' : `${missed} to review`}</Pill>
              <span className={cn('text-xs', MUTED)}>{familiarityLabel(familiarity)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          {showLearningPath && (
            <Link
              to="/learning-path"
              className="inline-flex items-center gap-1 text-[#5a63df] hover:underline dark:text-[#afb5ff]"
            >
              Learning path <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
          <Link
            to="/practice-lab"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5a63df] px-3.5 py-2 font-bold text-white transition-colors hover:bg-[#4c55cd] active:scale-[0.99]"
          >
            <span>Practise another set</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="border-t border-[#eeedf7] pt-3 dark:border-white/[0.08]">
          <p className={cn(MICRO, MUTED, 'mb-2')}>
            {tone.headline} · tap a number to jump to that answer
          </p>
          <ol className="flex flex-wrap gap-1.5" aria-label="Answers by question">
            {rows.map((row) => {
              const status = rowStatus(row);
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => onJump(row.number)}
                    aria-label={`Question ${row.number}: ${status.label}`}
                    className={cn(
                      NUM,
                      'grid h-7 min-w-7 place-items-center rounded-md border px-1.5 text-[11px] font-bold transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                      CHIP[status.tone]
                    )}
                  >
                    {row.number}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function AnswerWell({ label, text, tone }) {
  return (
    <div className={cn(WELL, 'min-w-0 rounded-md px-2.5 py-2')}>
      <p className={cn(MICRO, MUTED)}>{label}</p>
      <p
        className={cn(
          'mt-1 break-words text-[13px] font-semibold leading-snug',
          tone === 'ok' && 'text-[rgb(var(--signal-ok))]',
          tone === 'fault' && 'text-[rgb(var(--signal-fault))]',
          tone === 'muted' && cn(MUTED, 'font-medium italic')
        )}
      >
        {text}
      </p>
    </div>
  );
}

function ReviewRow({ row }) {
  const status = rowStatus(row);
  const StatusIcon = status.Icon;
  return (
    <article
      id={`review-q-${row.number}`}
      className={cn(
        TILE,
        'relative scroll-mt-20 space-y-2.5 overflow-hidden p-3 pl-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px]',
        STRIPE[status.tone]
      )}
      aria-label={`Question ${row.number} feedback`}
    >
      <header className="flex items-center justify-between gap-2">
        <span className={cn(MICRO, MUTED)}>
          Question <span className={NUM}>{row.number}</span>
        </span>
        <Pill tone={status.tone}>
          <StatusIcon size={10} strokeWidth={3} aria-hidden="true" />
          {status.label}
        </Pill>
      </header>
      {row.prompt && <p className="text-[13px] font-semibold leading-relaxed">{row.prompt}</p>}
      <div className={cn('grid gap-2', row.isCorrect ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        <AnswerWell
          label={row.isCorrect ? 'Your answer · matches' : 'Your answer'}
          text={row.userText}
          tone={row.isCorrect ? 'ok' : row.answered ? 'fault' : 'muted'}
        />
        {!row.isCorrect && <AnswerWell label="Correct answer" text={row.correctText} tone="ok" />}
      </div>
      {row.why && <Explanation text={row.why} defaultOpen={!row.isCorrect} />}
    </article>
  );
}

function Explanation({ text, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#e4e2f0] pt-2 dark:border-white/[0.07]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          MICRO,
          'flex w-full items-center justify-between gap-2 text-left text-[#5a63df] dark:text-[#afb5ff]'
        )}
      >
        Why this answer
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={cn('transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      {open && <p className="mt-1.5 text-xs leading-relaxed">{text}</p>}
    </div>
  );
}

function FilterTab({ active, onClick, count, badgeTone, reducedMotion, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97]',
        active
          ? 'text-white'
          : 'text-slate-600 hover:bg-white/75 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white'
      )}
    >
      {active && (
        <motion.span
          layoutId="practice-results-filter-tab"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }
          }
          className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
      <span
        className={cn(
          NUM,
          'rounded px-1.5 py-0.5 text-[10px] font-extrabold leading-none',
          active
            ? 'bg-white/20 text-white'
            : badgeTone === 'fault'
              ? 'bg-[rgb(var(--signal-fault)/0.1)] text-[rgb(var(--signal-fault))] dark:bg-[rgb(var(--signal-fault)/0.16)]'
              : 'border border-[#e4e2f0] bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300'
        )}
      >
        {count}
      </span>
    </button>
  );
}

/** Answer-by-answer feedback. `filter` and `onFilterChange` are owned by the page so the summary can jump. */
export function ReviewList({ rows, filter, onFilterChange }) {
  const reducedMotion = useReducedMotion();
  const wrong = rows.filter((row) => !row.isCorrect);
  const visible = filter === 'wrong' && wrong.length > 0 ? wrong : rows;
  if (rows.length === 0) {
    return (
      <p className={cn(WELL, 'rounded-lg p-3 text-xs leading-relaxed', MUTED)}>
        No saved answers are available for this set.
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {wrong.length > 0 && wrong.length < rows.length && (
        <div
          className="inline-flex items-center gap-0.5 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]"
          role="group"
          aria-label="Filter answers"
        >
          <FilterTab
            active={filter === 'all'}
            count={rows.length}
            reducedMotion={reducedMotion}
            onClick={() => onFilterChange('all')}
          >
            All
          </FilterTab>
          <FilterTab
            active={filter === 'wrong'}
            count={wrong.length}
            badgeTone="fault"
            reducedMotion={reducedMotion}
            onClick={() => onFilterChange('wrong')}
          >
            To review
          </FilterTab>
        </div>
      )}
      <div className="space-y-2">
        {visible.map((row) => (
          <ReviewRow key={row.key} row={row} />
        ))}
      </div>
    </div>
  );
}
