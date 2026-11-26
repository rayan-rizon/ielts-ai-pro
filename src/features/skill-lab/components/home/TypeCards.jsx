import { Fragment, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Headphones,
  History as HistoryIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Bar,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives.jsx';
import { focusLabel, groupCategory } from '../../practiceLabels';
import { typeStatus } from '../../practiceHomeModel';
import { resultRows } from '../../practiceResultRows';
import ResultList from './ResultList';
import { focusRing, subject } from './SourceSetPicker';

const GROUPS = [
  ['needs_work', 'Needs work'],
  ['getting_there', 'Getting there'],
  ['strong', 'Strong'],
  ['untried', 'Not tried yet'],
];
const INITIAL_CARDS = 6;
const HISTORY_ROWS = 10;
const FILTERS = [
  ['all', 'All'],
  ['reading', 'Reading'],
  ['listening', 'Listening'],
];
const CHIP =
  'relative z-10 rounded-md px-3 py-1.5 text-xs font-bold transition-[transform,color,background-color] duration-150 ease-out active:scale-[0.97] cursor-pointer';
const CHIP_ON = 'text-white';
const CHIP_OFF =
  'text-slate-600 hover:bg-white/75 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white';

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function TypeCard({ type, tip, need, sets, open, onToggle }) {
  const isListening = type.startsWith('listening:');
  const Icon = isListening ? Headphones : BookOpen;
  const questions = sets.reduce((sum, set) => sum + (set.total || 0), 0);
  return (
    <button
      type="button"
      data-type={type}
      aria-expanded={open}
      aria-label={`Choose ${focusLabel(type)}. ${sets.length} source sets available.`}
      onClick={() => onToggle(type)}
      className={cn(
        TILE,
        focusRing,
        'group flex h-full min-w-0 flex-col gap-2.5 p-4 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-[#5a63df]/45 hover:bg-white active:translate-y-0 active:scale-[0.99] dark:hover:border-[#8f97ff]/40 dark:hover:bg-white/[0.07]',
        open &&
          'border-[#5a63df] bg-white ring-1 ring-[#5a63df]/70 dark:border-[#8f97ff] dark:bg-white/[0.08] dark:ring-[#8f97ff]/50'
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <IconChip icon={Icon} tone={isListening ? 'sky' : 'accent'} size="sm" />
          <span className={cn(MICRO, 'text-slate-600 dark:text-slate-300')}>{subject(type)}</span>
        </span>
        <span className={cn(NUM, 'text-[11px] font-semibold', MUTED)}>
          {plural(sets.length, 'set')} · {plural(questions, 'question')}
        </span>
      </span>

      <span className="text-sm font-extrabold tracking-tight text-slate-900 transition-colors duration-150 group-hover:text-[#5a63df] dark:text-slate-50 dark:group-hover:text-[#afb5ff]">
        {focusLabel(type)}
      </span>

      <span className={cn('line-clamp-2 flex-1 text-xs leading-relaxed', MUTED)}>{tip}</span>

      <span className="mt-auto block w-full space-y-2 border-t border-[#e4e2f0]/75 pt-2.5 dark:border-white/[0.06]">
        {need?.total > 0 && <Bar value={(100 * need.correct) / need.total} className="h-1" />}
        <span className="flex items-center justify-between gap-2 text-[11px]">
          <span className={cn(NUM, 'font-medium', MUTED)}>
            {need?.total > 0 ? `${need.correct} of ${need.total} correct` : 'No results yet'}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-[#5a63df] dark:text-[#afb5ff]">
            {open ? 'Close' : 'Practise'}
            <ArrowRight
              size={12}
              aria-hidden="true"
              className={cn(
                'transition-transform duration-150 ease-out',
                open ? 'rotate-90' : 'group-hover:translate-x-0.5'
              )}
            />
          </span>
        </span>
      </span>
    </button>
  );
}

function History({ needs }) {
  const rows = needs
    .flatMap(resultRows)
    .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))
    .slice(0, HISTORY_ROWS);
  if (!rows.length) {
    return (
      <p
        className={cn(
          WELL,
          'mt-3 rounded-lg border border-[#e4e2f0] p-3 text-xs dark:border-white/[0.07]'
        )}
      >
        No recent results yet. Finish a set to see it here.
      </p>
    );
  }
  return <ResultList rows={rows} label="Past results" className="mt-3" />;
}

/** Splits the ordered types into status groups, keeping the open card visible. */
function visibleGroups(types, needByFocus, openFocus, showAll) {
  const ordered = GROUPS.flatMap(([status, label]) =>
    types
      .filter((type) => typeStatus(needByFocus.get(type)) === status)
      .map((type) => ({ type, label }))
  );
  const shown = ordered.filter(
    (entry, index) => showAll || index < INITIAL_CARDS || entry.type === openFocus
  );
  return GROUPS.map(([, label]) => [
    label,
    shown.filter((entry) => entry.label === label).map((entry) => entry.type),
  ]).filter(([, list]) => list.length);
}

function CardGrid({ list, cardProps, openFocus, renderPanel }) {
  // Dense flow lets later cards fill the row, which drops the full-width panel
  // below it while keeping card then panel in reading and tab order.
  return (
    <div className="grid grid-flow-row-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((type) => (
        <Fragment key={type}>
          <TypeCard type={type} open={openFocus === type} {...cardProps(type)} />
          {openFocus === type && <div className="col-span-full">{renderPanel(type)}</div>}
        </Fragment>
      ))}
    </div>
  );
}

export default function TypeCards({
  types,
  groups,
  needs,
  tips,
  subjectFilter,
  onSubjectChange,
  openFocus,
  onToggle,
  renderPanel,
}) {
  const [showAll, setShowAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const reducedMotion = useReducedMotion();
  const needByFocus = new Map(needs.map((need) => [need.focus, need]));
  const cardProps = (type) => ({
    tip: tips?.[type],
    need: needByFocus.get(type),
    sets: groups.filter((group) => groupCategory(group) === type),
    onToggle,
  });
  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className={TITLE}>Choose a question type yourself</h2>
          <p className={`mt-0.5 text-xs ${MUTED}`}>
            Weakest first. Select a card to start from there.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            {FILTERS.map(([value, label]) => {
              const active = subjectFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  className={cn(CHIP, focusRing, active ? CHIP_ON : CHIP_OFF)}
                  onClick={() => onSubjectChange(value)}
                >
                  {active && (
                    <motion.span
                      layoutId="practice-lab-subject-tab"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 520, damping: 36, mass: 0.7 }
                      }
                      className="absolute inset-0 -z-10 rounded-md bg-[#5a63df]"
                      aria-hidden="true"
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-expanded={showHistory}
            className={cn(
              focusRing,
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-[transform,border-color,background-color,color] duration-150 ease-out active:scale-[0.97]',
              showHistory
                ? 'border-[#5a63df]/45 bg-[#5a63df]/[0.08] text-[#5a63df] dark:border-[#8f97ff]/45 dark:bg-[#8f97ff]/14 dark:text-[#afb5ff]'
                : 'border-[#e4e2f0] bg-white text-slate-700 hover:border-[#5a63df]/45 hover:bg-[#5a63df]/[0.05] hover:text-[#5a63df] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-[#8f97ff]/45 dark:hover:bg-[#8f97ff]/10 dark:hover:text-[#afb5ff]'
            )}
            onClick={() => setShowHistory((value) => !value)}
          >
            <HistoryIcon size={13} aria-hidden="true" />
            History
          </button>
        </div>
      </div>

      {showHistory && <History needs={needs} />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={subjectFilter}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, transition: { duration: 0.1 } }}
          transition={
            reducedMotion ? { duration: 0 } : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
          }
        >
          {visibleGroups(types, needByFocus, openFocus, showAll).map(([label, list]) => (
            <div key={label} className="mt-4">
              <div className="mb-2.5 flex items-center gap-2">
                <h3 className={cn(MICRO, 'text-slate-700 dark:text-slate-200')}>{label}</h3>
                <span
                  className={cn(
                    NUM,
                    'rounded bg-[#f4f3fb] px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
                  )}
                >
                  {list.length}
                </span>
                <span
                  className="h-px flex-1 bg-[#e4e2f0] dark:bg-white/[0.07]"
                  aria-hidden="true"
                />
              </div>
              <CardGrid
                list={list}
                cardProps={cardProps}
                openFocus={openFocus}
                renderPanel={renderPanel}
              />
            </div>
          ))}

          {!types.length && (
            <p className={`mt-3 text-xs ${MUTED}`}>
              No available sets for this subject. Choose another subject or browse the library.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {types.length > INITIAL_CARDS && (
        <div className="mt-4 flex justify-center border-t border-[#e4e2f0]/80 pt-3.5 dark:border-white/[0.06]">
          <button
            type="button"
            aria-expanded={showAll}
            className={cn(
              focusRing,
              'inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-[transform,border-color,background-color,color] duration-150 ease-out hover:border-[#5a63df]/45 hover:text-[#5a63df] active:scale-[0.97] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-[#8f97ff]/45'
            )}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Show fewer' : `Show all ${types.length} question types`}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn('transition-transform duration-150 ease-out', showAll && 'rotate-180')}
            />
          </button>
        </div>
      )}
    </section>
  );
}
