import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Target,
  CheckCircle2,
  RotateCcw,
  Layers,
  ChevronDown,
  History,
  PenTool,
  Mic,
  Check,
  Compass,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReiconTarget } from '@/components/icons/ReiconTarget';
import {
  PANEL,
  WELL,
  TILE,
  MICRO,
  TITLE,
  MUTED,
  NUM,
  Pill,
  Stat,
  Bar,
  PanelTitle,
  IconChip,
  Empty,
  TierBadge,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../practiceLabels';

const subject = (focus = '') => (focus.startsWith('listening:') ? 'Listening' : 'Reading');
const date = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const familiarity = (value) =>
  ({ new: 'New questions', familiar: 'Familiar passage or audio', repeated: 'Practise again' })[
    value
  ] || 'Library questions';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315]';

function SourceSetPicker({ sets, value, onChange }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = sets.find((set) => set.id === value) || sets[0];

  useEffect(() => {
    const close = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape' && pickerRef.current?.contains(event.target)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  return (
    <div ref={pickerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label="Choose a source set"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="practice-source-options"
        aria-activedescendant={
          open && sets[activeIndex] ? `practice-source-option-${sets[activeIndex].id}` : undefined
        }
        onClick={() => {
          setActiveIndex(
            Math.max(
              0,
              sets.findIndex((set) => set.id === selected?.id)
            )
          );
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            setActiveIndex(
              Math.max(
                0,
                sets.findIndex((set) => set.id === selected?.id)
              )
            );
            setOpen(true);
          }
        }}
        className={`${focusRing} flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg border border-[#cfcddf] bg-white px-3 py-2 text-left text-xs shadow-xs transition-all duration-150 hover:border-[#5a63df] hover:shadow-sm dark:border-white/20 dark:bg-[#15141c] dark:hover:border-[#8f97ff] ${
          open
            ? 'border-[#5a63df] ring-2 ring-[#5a63df]/20 dark:border-[#8f97ff] dark:ring-[#8f97ff]/25'
            : ''
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {selected ? selected.title : 'Choose a source set'}
          </span>
          {selected && (
            <span className="shrink-0 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
              {familiarity(selected.familiarity)}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
            open ? 'rotate-180 text-[#5a63df] dark:text-[#afb5ff]' : ''
          }`}
        />
      </button>
      {open && (
        <div
          id="practice-source-options"
          role="listbox"
          aria-label="Available source sets"
          onKeyDown={(event) => {
            const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            setActiveIndex((index) =>
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? sets.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + sets.length) % sets.length
            );
          }}
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 max-h-60 overflow-y-auto rounded-xl border border-[#cfcddf] bg-white p-1.5 shadow-xl dark:border-white/15 dark:bg-[#15141c]"
        >
          {sets.map((set, index) => {
            const optionLabel = `${set.title} · ${focusLabel(set.focus)} · ${familiarity(set.familiarity)}`;
            const isSelected = set.id === selected?.id;
            return (
              <button
                key={set.id}
                id={`practice-source-option-${set.id}`}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                tabIndex={index === activeIndex ? 0 : -1}
                type="button"
                role="option"
                aria-label={optionLabel}
                aria-selected={isSelected}
                onClick={() => {
                  onChange(set.id);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`${focusRing} flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#5a63df]/10 font-bold text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">
                    {set.title}
                  </span>
                  <span className={`mt-0.5 block text-[11px] ${MUTED}`}>
                    {focusLabel(set.focus)} ·{' '}
                    <span
                      className={
                        set.familiarity === 'new'
                          ? 'font-medium text-emerald-600 dark:text-emerald-400'
                          : set.familiarity === 'familiar'
                            ? 'font-medium text-amber-600 dark:text-amber-400'
                            : 'font-normal text-slate-400 dark:text-slate-500'
                      }
                    >
                      {familiarity(set.familiarity)}
                    </span>
                  </span>
                </span>
                {isSelected && (
                  <Check size={14} className="shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PracticeHome({ data, focus, setFocus, module, busy, error, start }) {
  const [groupId, setGroupId] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(module || 'all');
  const [exploreFocus, setExploreFocus] = useState(null);
  const exploreActionRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const allGroups = data.groups || [];
  const groups = allGroups.filter(
    (g) => subjectFilter === 'all' || g.focus.startsWith(`${subjectFilter}:`)
  );
  const needs = data.recommendations || [];
  const availableFocus = [...new Set(groups.map((g) => g.focus))].sort((a, b) => {
    const rank = (f) => needs.findIndex((n) => n.focus === f);
    return (rank(a) < 0 ? 999 : rank(a)) - (rank(b) < 0 ? 999 : rank(b));
  });
  const requestedUnavailable = focus && !allGroups.some((g) => g.focus === focus);
  const selected = availableFocus.includes(focus) ? focus : availableFocus[0];
  const need = needs.find((n) => n.focus === selected);
  const sets = groups
    .filter((g) => g.focus === selected)
    .sort(
      (a, b) =>
        ({ new: 0, familiar: 1, repeated: 2 })[a.familiarity] -
        { new: 0, familiar: 1, repeated: 2 }[b.familiarity]
    );
  const next = sets.find((g) => g.id === groupId) || sets[0];
  const sessions = data.sessions || [];
  const continuing = sessions.filter((s) => !s.completed_at);
  const due = needs.filter((n) => n.due);
  const [asideTab, setAsideTab] = useState(() => (due.length > 0 ? 'review' : 'history'));

  const choose = (value) => {
    setFocus(value);
    setGroupId('');
    setExploreFocus(value);
  };

  useEffect(() => {
    if (!exploreFocus) return;
    // Keep keyboard users with the action that appeared beside the card they chose.
    // Do not move the page to the top source picker on a card click.
    window.requestAnimationFrame?.(() => {
      exploreActionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      exploreActionRef.current?.focus({ preventScroll: true });
    });
  }, [exploreFocus, next?.id]);

  const reset = data.reset_at
    ? new Date(data.reset_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '00:00 UTC';

  const containerVariants = shouldReduceMotion ? undefined : STAGGER_CONTAINER;
  const itemVariants = shouldReduceMotion ? undefined : FADE_UP;

  return (
    <TooltipProvider delayDuration={150}>
      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-7xl space-y-3.5"
        >
          <motion.header
            variants={itemVariants}
            className="flex flex-col gap-3 pb-3 border-b border-[#eeedf7] dark:border-white/[0.07] sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
                  Practice Lab
                </h1>
                {['pro', 'premium'].includes(data.tier) ? <TierBadge tier={data.tier} /> : null}
              </div>
              <p className={`mt-1 text-xs sm:text-[13px] font-medium leading-relaxed ${MUTED}`}>
                Understand your mistakes. Practise one question type with real library questions.
              </p>
            </div>

            <Link
              to="/learning-path"
              className={`group inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#cfcddf] bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#5a63df]/50 hover:bg-[#faf9ff] hover:text-[#5a63df] hover:shadow-sm active:scale-[0.99] dark:border-white/15 dark:bg-[#15141c] dark:text-slate-200 dark:hover:border-[#8f97ff]/50 dark:hover:bg-white/[0.06] dark:hover:text-[#afb5ff] ${focusRing}`}
            >
              <Compass
                size={13}
                className="text-[#5a63df] dark:text-[#afb5ff] transition-transform duration-300 group-hover:rotate-45"
                aria-hidden="true"
              />
              <span>Your learning path</span>
              <ArrowRight
                size={12}
                className="text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-500 dark:group-hover:text-[#afb5ff]"
                aria-hidden="true"
              />
            </Link>
          </motion.header>

          <motion.div
            variants={itemVariants}
            aria-label="Practice metrics"
            className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4"
          >
            <Stat
              size="sm"
              tone="accent"
              icon={Layers}
              label="Sets left today"
              value={`${data.remaining ?? 0} / ${data.limit ?? 0}`}
              sub={`Resets ${reset}`}
              tip="Daily allowance of targeted question sets with AI diagnostic feedback"
            />
            <Stat
              size="sm"
              tone="sky"
              icon={ReiconTarget}
              label="Question types"
              value={new Set(allGroups.map((g) => g.focus)).size}
              sub={`${allGroups.length} available library sets`}
              tip="Targeted Reading and Listening question formats from Cambridge tests"
            />
            <Stat
              size="sm"
              tone="emerald"
              icon={CheckCircle2}
              label="Sets completed"
              value={sessions.filter((s) => s.completed_at).length}
              sub="Saved diagnostic sessions"
              tip="Completed practice sets with recorded diagnostic answers"
              onClick={() => setAsideTab('history')}
              className="cursor-pointer"
            />
            <Stat
              size="sm"
              tone={due.length > 0 ? 'amber' : 'emerald'}
              icon={RotateCcw}
              label="Ready to review"
              value={due.length}
              sub={
                due.length === 1
                  ? '1 question type due'
                  : due.length > 0
                    ? `${due.length} question types due`
                    : 'All caught up'
              }
              tip="Question types due for spaced repetition review"
              onClick={() => setAsideTab('review')}
              className="cursor-pointer"
            />
          </motion.div>

          {error}

          {!data.enabled && (
            <motion.div
              variants={itemVariants}
              role="status"
              className={`${WELL} rounded-lg border border-amber-500/20 p-3 text-xs leading-relaxed`}
            >
              <strong>New practice sets are currently unavailable.</strong> Your saved work is still
              accessible. In the meantime, practise in the{' '}
              <Link
                className="font-semibold text-[#5a63df] underline dark:text-[#afb5ff]"
                to="/reading"
              >
                Reading library
              </Link>{' '}
              or{' '}
              <Link
                className="font-semibold text-[#5a63df] underline dark:text-[#afb5ff]"
                to="/listening"
              >
                Listening library
              </Link>
              .
            </motion.div>
          )}

          {continuing.length > 0 && (
            <motion.section variants={itemVariants} className={`${PANEL} p-4`}>
              <PanelTitle
                label="Continue practising"
                accent
                action={
                  <span className={`${MICRO} ${MUTED}`}>{continuing.length} in progress</span>
                }
              />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {continuing.map((s) => (
                  <Link
                    key={s.id}
                    to={`/practice-lab/session/${s.id}?library=1`}
                    className={`${TILE} ${focusRing} flex items-center justify-between gap-3 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-xs active:scale-[0.99]`}
                  >
                    <div className="min-w-0">
                      <p className={`${MICRO} ${MUTED}`}>
                        {subject(s.focus)} · Step {Math.min(4, (s.stage || 0) + 1)} of 4
                      </p>
                      <p className={`${TITLE} mt-1 truncate`}>{focusLabel(s.focus)}</p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {requestedUnavailable && (
            <motion.p
              variants={itemVariants}
              role="status"
              className={`${WELL} rounded-lg border border-amber-500/20 p-3 text-xs`}
            >
              A separate set for {focusLabel(focus)} is not available. Select an available type
              below to continue.
            </motion.p>
          )}

          <motion.div variants={itemVariants} className="grid grid-cols-12 gap-3.5 items-stretch">
            <section
              className={`${PANEL} col-span-12 min-w-0 flex flex-col justify-between p-4 sm:p-5 lg:col-span-8`}
              aria-label="Your next step"
            >
              <div>
                <PanelTitle
                  label={need?.mistakes?.length ? 'Your next step' : 'Find your starting point'}
                  accent
                  tip={
                    need?.mistakes?.length
                      ? 'Targeted drill based on questions you missed in past tests'
                      : 'Select an IELTS question format to establish your diagnostic baseline'
                  }
                  action={selected ? <Pill tone="accent">{subject(selected)}</Pill> : null}
                />
                <div className="grid gap-3.5 sm:grid-cols-2 items-stretch">
                  <div className="flex flex-col justify-between min-w-0 rounded-xl border border-[#e4e2f0] bg-linear-to-b from-white to-[#faf9ff] p-3.5 sm:p-4 shadow-3xs dark:border-white/[0.08] dark:from-[#15141c] dark:to-[#100f15]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`${MICRO} ${MUTED}`}>Recommended Drill</p>
                        {need?.mistakes?.length ? (
                          <Pill tone="warn">{need.label}</Pill>
                        ) : (
                          <Pill tone="ok">Diagnostic</Pill>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-slate-100">
                          {selected ? focusLabel(selected) : 'Choose a library test'}
                        </h3>
                        {need?.total > 0 ? (
                          <p className="mt-1 text-xs text-slate-700 sm:text-sm dark:text-slate-200">
                            You missed{' '}
                            <strong className={`${NUM} font-bold text-rose-600 dark:text-rose-400`}>
                              {need.total - need.correct} of {need.total}
                            </strong>{' '}
                            questions in your recent results.
                          </p>
                        ) : (
                          <p className={`mt-1 text-xs leading-relaxed ${MUTED}`}>
                            Start with one original question set. Your answers will help us suggest
                            what to work on next.
                          </p>
                        )}
                      </div>
                      {need?.sources?.length > 0 && (
                        <details
                          className={`group rounded-lg border border-[#e4e2f0] bg-white/90 p-2.5 text-xs ${MUTED} shadow-3xs dark:border-white/[0.08] dark:bg-white/[0.03]`}
                        >
                          <summary
                            className={`flex cursor-pointer items-center justify-between font-medium text-slate-700 dark:text-slate-200 ${focusRing}`}
                          >
                            <span>See the results behind this suggestion</span>
                            <ChevronDown
                              size={14}
                              className="transition-transform group-open:rotate-180"
                            />
                          </summary>
                          <ul className="mt-2 space-y-1.5 border-t border-[#e4e2f0] pt-2 dark:border-white/[0.08]">
                            {need.sources?.map((s, i) => (
                              <li key={`${s.sessionId}-${i}`}>
                                <Link
                                  className="inline-flex items-center gap-1 text-[#5a63df] hover:underline dark:text-[#afb5ff]"
                                  to={
                                    s.practice
                                      ? `/practice-lab/session/${s.sessionId}?library=1`
                                      : `/${subject(selected).toLowerCase()}-test/${s.sessionId}?view-results=true`
                                  }
                                >
                                  {s.title || 'View saved result'} · {date(s.completedAt)}
                                  <ArrowRight size={11} aria-hidden="true" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                    <div className="mt-3.5 pt-2.5 border-t border-[#eeedf7] dark:border-white/[0.08]">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className={`${MICRO} ${MUTED}`}>Practice Workflow</p>
                        <span className="rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.08] px-2 py-0.5 text-[9.5px] font-bold text-[#5a63df] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]">
                          3-stage loop
                        </span>
                      </div>
                      <ol aria-label="How practice works" className="grid grid-cols-3 gap-2">
                        {[
                          need?.mistakes?.length
                            ? { num: '01', title: 'Review', sub: 'mistake', icon: History }
                            : { num: '01', title: 'Start', sub: 'baseline', icon: ReiconTarget },
                          { num: '02', title: 'Learn', sub: 'approach', icon: Lightbulb },
                          { num: '03', title: 'Practise', sub: 'questions', icon: Check },
                        ].map((step) => {
                          const StepIcon = step.icon;
                          return (
                            <li
                              key={step.title}
                              className="group relative flex flex-col items-center justify-center rounded-lg border border-[#e4e2f0] bg-white/95 px-1.5 py-1.5 text-center shadow-3xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#5a63df]/35 dark:border-white/[0.08] dark:bg-white/[0.04]"
                            >
                              <div className="flex items-center justify-center gap-1.5 leading-none">
                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
                                  <StepIcon size={9.5} strokeWidth={2.2} aria-hidden="true" />
                                </span>
                                <span
                                  className={`${NUM} text-[10px] font-extrabold text-[#5a63df] dark:text-[#afb5ff] leading-none`}
                                >
                                  {step.num}
                                </span>
                              </div>
                              <span className="mt-1 text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                                {step.title}
                              </span>
                              <span className={`text-[9.5px] font-medium leading-tight ${MUTED}`}>
                                {step.sub}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>

                  {next ? (
                    <div className="flex flex-col justify-between min-w-0 rounded-xl border border-[#e4e2f0] bg-linear-to-b from-white to-[#faf9ff] p-3.5 sm:p-4 shadow-3xs dark:border-white/[0.08] dark:from-[#15141c] dark:to-[#100f15]">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={`${MICRO} ${MUTED}`}>Your practice set</p>
                          <Pill tone={next.familiarity === 'new' ? 'ok' : 'neutral'}>
                            {familiarity(next.familiarity)}
                          </Pill>
                        </div>
                        <div>
                          <p className={`${TITLE} text-sm leading-snug sm:text-base`}>
                            {next.title}
                          </p>
                          <p className={`mt-1 text-xs ${MUTED}`}>
                            {focusLabel(next.focus)} ·{' '}
                            <span className={`${NUM} font-bold text-slate-800 dark:text-slate-100`}>
                              {next.total}
                            </span>{' '}
                            questions
                          </p>
                        </div>
                        {sets.length > 1 && (
                          <div className="block text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Choose a source set
                            </span>
                            <div className="mt-1.5">
                              <SourceSetPicker sets={sets} value={next.id} onChange={setGroupId} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#eeedf7] space-y-2.5 dark:border-white/[0.08]">
                        <p className={`text-[11px] leading-relaxed ${MUTED}`}>
                          {next.familiarity === 'new'
                            ? 'This source test will be marked partly practised.'
                            : next.familiarity === 'familiar'
                              ? 'You have seen this passage or audio before.'
                              : 'You have answered these questions before. Use them for revision.'}{' '}
                          Your full-test result stays separate.
                        </p>
                        <Button
                          size="sm"
                          className="group w-full bg-linear-to-r from-[#5a63df] to-[#6d75ed] font-bold text-white shadow-xs transition-all duration-150 hover:from-[#4f58d4] hover:to-[#5e66e0] hover:shadow-sm active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#5a63df]"
                          disabled={
                            busy ||
                            !data.enabled ||
                            !data.remaining ||
                            Boolean(requestedUnavailable)
                          }
                          onClick={() => start(next)}
                        >
                          {busy
                            ? 'Opening your set…'
                            : next.familiarity === 'repeated'
                              ? 'Practise again'
                              : 'Review and practise'}
                          <ArrowRight
                            size={14}
                            className="ml-1.5 transition-transform duration-150 group-hover:translate-x-0.5"
                          />
                        </Button>
                        {!data.remaining && (
                          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            Today’s allowance is used. Resets at {reset}; resuming saved work is
                            free.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`${WELL} rounded-lg p-3 text-xs leading-relaxed`}>
                      No suitable sets are available for this selection. Try the{' '}
                      <Link
                        className="font-semibold text-[#5a63df] underline dark:text-[#afb5ff]"
                        to="/reading"
                      >
                        Reading library
                      </Link>{' '}
                      or{' '}
                      <Link
                        className="font-semibold text-[#5a63df] underline dark:text-[#afb5ff]"
                        to="/listening"
                      >
                        Listening library
                      </Link>
                      .
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="col-span-12 min-w-0 lg:col-span-4">
              <section
                className={`${PANEL} flex h-full flex-col justify-between p-4 sm:p-5`}
                aria-label="Performance and review"
              >
                <div>
                  <PanelTitle
                    label={asideTab === 'history' ? 'How you’re doing' : 'Ready to review'}
                    accent
                    tip={
                      asideTab === 'history'
                        ? 'Recent accuracy records for this question format'
                        : 'Spaced repetition: question formats due for review'
                    }
                    action={
                      <div
                        role="tablist"
                        aria-label="Performance and review switcher"
                        className="relative flex items-center rounded-lg border border-[#e4e2f0] bg-[#f4f3fb] p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={asideTab === 'history'}
                          onClick={() => setAsideTab('history')}
                          className={`${focusRing} relative inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
                            asideTab === 'history'
                              ? 'text-[#5a63df] dark:text-[#afb5ff]'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          {asideTab === 'history' && (
                            <motion.span
                              layoutId="active-aside-tab-pill"
                              className="absolute inset-0 rounded-md bg-white shadow-xs dark:bg-white/10 dark:shadow-none"
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : {
                                      type: 'spring',
                                      stiffness: 480,
                                      damping: 32,
                                    }
                              }
                            />
                          )}
                          <span className="relative z-10">History</span>
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={asideTab === 'review'}
                          onClick={() => setAsideTab('review')}
                          className={`${focusRing} relative inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
                            asideTab === 'review'
                              ? 'text-[#5a63df] dark:text-[#afb5ff]'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          {asideTab === 'review' && (
                            <motion.span
                              layoutId="active-aside-tab-pill"
                              className="absolute inset-0 rounded-md bg-white shadow-xs dark:bg-white/10 dark:shadow-none"
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : {
                                      type: 'spring',
                                      stiffness: 480,
                                      damping: 32,
                                    }
                              }
                            />
                          )}
                          <span className="relative z-10">Review</span>
                          {due.length > 0 && (
                            <span
                              className={`relative z-10 rounded-full px-1.5 text-[9.5px] font-bold transition-colors ${
                                asideTab === 'review'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {due.length}
                            </span>
                          )}
                        </button>
                      </div>
                    }
                  />
                  <p className={`-mt-1 mb-3 text-xs ${MUTED} transition-opacity duration-150`}>
                    {asideTab === 'history'
                      ? selected
                        ? focusLabel(selected)
                        : 'Your recent results'
                      : due.length > 0
                        ? `${due.length} question type${due.length === 1 ? '' : 's'} due for spaced repetition`
                        : 'Spaced repetition schedule'}
                  </p>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={asideTab}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                      transition={
                        shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }
                      }
                      className="min-h-[210px] flex flex-col justify-start"
                    >
                      {asideTab === 'history' ? (
                        <div className="space-y-2">
                          {need?.history?.length ? (
                            need.history.map((h, i) => {
                              const pct = h.total > 0 ? Math.round((h.correct / h.total) * 100) : 0;
                              const tone = pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'fault';
                              return (
                                <div
                                  key={i}
                                  className={`${WELL} flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 transition-all duration-150 hover:border-[#e4e2f0] dark:border-white/[0.04] dark:hover:border-white/[0.09]`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                      {need.sources?.[i]?.title || h.kind}
                                    </p>
                                    <p className={`text-[11px] ${MUTED}`}>
                                      {h.kind} · {date(h.completedAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Pill tone={tone} size="sm">
                                      {pct}%
                                    </Pill>
                                    <strong
                                      className={`${NUM} text-xs font-bold text-slate-900 dark:text-slate-100`}
                                    >
                                      {h.correct} / {h.total}
                                    </strong>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <Empty
                              icon={History}
                              title="No recent results"
                              message="Complete your first set to see your accuracy trend and diagnostic history here."
                              className="py-6"
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          {due.length ? (
                            <div className="space-y-2">
                              {due.map((n) => (
                                <button
                                  key={n.focus}
                                  type="button"
                                  className={`${TILE} ${focusRing} group flex w-full items-center justify-between gap-2 p-2.5 text-left text-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-xs active:scale-[0.99]`}
                                  onClick={() => {
                                    setSubjectFilter('all');
                                    choose(n.focus);
                                  }}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse"
                                      aria-hidden="true"
                                    />
                                    <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                      {focusLabel(n.focus)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`${MICRO} font-bold text-amber-600 dark:text-amber-400`}
                                    >
                                      Due
                                    </span>
                                    <ArrowRight
                                      size={13}
                                      className="shrink-0 text-[#5a63df] transition-transform duration-150 group-hover:translate-x-0.5 dark:text-[#afb5ff]"
                                    />
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <Empty
                              icon={RotateCcw}
                              title="Up to date"
                              message="Nothing due today. After completing a set, we'll schedule spaced repetition for you."
                              className="py-6"
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-4 pt-3 border-t border-[#eeedf7] dark:border-white/[0.08]">
                  <p
                    className={`text-[11px] leading-tight ${MUTED} transition-opacity duration-150`}
                  >
                    {asideTab === 'history'
                      ? 'Correct answers for this question type. Full tests and Practice Lab results are labelled separately.'
                      : 'Spaced repetition reviews reinforce question strategies before memory decays.'}
                  </p>
                </div>
              </section>
            </aside>
          </motion.div>

          <motion.section
            layout
            variants={itemVariants}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { layout: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }
            }
            className={`${PANEL} p-4 sm:p-5`}
            aria-label="Choose something else"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PanelTitle
                  label="Question Type Library"
                  accent
                  tip="Select any IELTS Reading or Listening question type to practise with authentic test material"
                />
                <p className={`-mt-1 text-xs ${MUTED}`}>
                  Select one question type to see its results and available sets.
                </p>
              </div>
              <div
                className={`${WELL} relative flex items-center gap-1 rounded-lg p-1`}
                role="tablist"
                aria-label="Filter by subject"
              >
                {[
                  { value: 'all', label: 'All' },
                  { value: 'reading', label: 'Reading' },
                  { value: 'listening', label: 'Listening' },
                ].map(({ value, label }) => {
                  const isActive = subjectFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-pressed={isActive}
                      onClick={() => {
                        setSubjectFilter(value);
                        setGroupId('');
                        setExploreFocus(null);
                      }}
                      className={`${focusRing} relative inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                        isActive
                          ? 'text-[#5a63df] dark:text-[#afb5ff]'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="active-subject-filter-pill"
                          className="absolute inset-0 rounded-md bg-white shadow-xs dark:bg-white/10 dark:shadow-none"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : {
                                  type: 'spring',
                                  stiffness: 480,
                                  damping: 32,
                                }
                          }
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div
              layout
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { layout: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }
              }
              className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence initial={false}>
                {availableFocus.map((f) => {
                  const result = needs.find((n) => n.focus === f);
                  const available = groups.filter((g) => g.focus === f);
                  const fresh = available.filter((g) => g.familiarity === 'new').length;
                  const Icon = f.startsWith('listening:') ? Headphones : BookOpen;
                  const isSelected = selected === f;
                  return (
                    <motion.button
                      layout
                      key={f}
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
                      }
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Choose ${focusLabel(f)}. ${available.length} source sets available.`}
                      onClick={() => choose(f)}
                      className={`${TILE} ${focusRing} group relative min-w-0 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] ${
                        isSelected
                          ? 'border-[#5a63df] bg-linear-to-b from-[#5a63df]/[0.05] to-transparent ring-1 ring-[#5a63df]/35 dark:border-[#8f97ff] dark:from-[#8f97ff]/[0.08] dark:to-transparent'
                          : 'hover:border-[#5a63df]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`${MICRO} ${MUTED} flex items-center gap-1.5`}>
                          <IconChip
                            icon={Icon}
                            tone={f.startsWith('listening:') ? 'sky' : 'accent'}
                            size="sm"
                          />
                          {subject(f)}
                        </span>
                        {result?.mistakes?.length > 0 ? (
                          <Pill tone="warn">
                            {result.repeatedDifficulty ? 'Worth another look' : 'Worth practising'}
                          </Pill>
                        ) : isSelected ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5a63df] text-white shadow-3xs dark:bg-[#8f97ff] dark:text-slate-950">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>
                      <h3 className={`${TITLE} mt-2 text-sm`}>{focusLabel(f)}</h3>
                      <div
                        className={`mt-2 flex flex-wrap justify-between items-center gap-1 text-[11px] ${MUTED}`}
                      >
                        <span>
                          <span className={`${NUM} font-bold text-slate-800 dark:text-slate-200`}>
                            {available.length}
                          </span>{' '}
                          sets ·{' '}
                          <span className={`${NUM} font-medium text-slate-700 dark:text-slate-300`}>
                            {fresh}
                          </span>{' '}
                          new
                        </span>
                        {result?.total > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`${NUM} font-bold text-slate-800 dark:text-slate-200`}>
                              {result.correct}/{result.total}
                            </span>
                            <Pill
                              size="sm"
                              tone={
                                result.correct / result.total >= 0.8
                                  ? 'ok'
                                  : result.correct / result.total >= 0.5
                                    ? 'warn'
                                    : 'fault'
                              }
                            >
                              {Math.round((result.correct / result.total) * 100)}%
                            </Pill>
                          </div>
                        ) : (
                          <span className={`${NUM} text-[10.5px]`}>No recent result</span>
                        )}
                      </div>
                      {result?.total > 0 && (
                        <div className="mt-2.5">
                          <Bar value={(100 * result.correct) / result.total} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {!availableFocus.length && (
              <p className={`mt-3 text-xs ${MUTED}`}>
                No available sets for this subject. Choose another subject or browse the library.
              </p>
            )}

            <AnimatePresence>
              {exploreFocus && selected === exploreFocus && next && (
                <motion.section
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
                  }
                  className={`${WELL} mt-3.5 grid gap-3 rounded-xl border border-[#5a63df]/30 p-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,1.2fr)] sm:items-end dark:border-[#8f97ff]/25`}
                  aria-label="Selected question type"
                  aria-live="polite"
                >
                  <div className="min-w-0">
                    <p className={`${MICRO} font-bold text-[#5a63df] dark:text-[#afb5ff]`}>
                      Selected question type
                    </p>
                    <p className={`${TITLE} mt-1 text-sm sm:text-base`}>
                      {focusLabel(exploreFocus)}
                    </p>
                    <p className={`mt-1 text-xs ${MUTED}`}>
                      Choose a real library set, then review your mistake and practise.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    {sets.length > 1 ? (
                      <label className="min-w-0 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        Source set
                        <span className="mt-1 block">
                          <SourceSetPicker sets={sets} value={next.id} onChange={setGroupId} />
                        </span>
                      </label>
                    ) : (
                      <p className={`text-[11px] ${MUTED}`}>
                        {next.title} · <span className={NUM}>{next.total}</span> questions
                      </p>
                    )}
                    <Button
                      ref={exploreActionRef}
                      size="sm"
                      disabled={
                        busy || !data.enabled || !data.remaining || Boolean(requestedUnavailable)
                      }
                      onClick={() => start(next)}
                      className="whitespace-nowrap bg-linear-to-r from-[#5a63df] to-[#6d75ed] font-bold text-white shadow-xs transition-all duration-150 hover:from-[#4f58d4] hover:to-[#5e66e0] active:scale-[0.99]"
                    >
                      {next.familiarity === 'repeated' ? 'Practise again' : 'Review and practise'}
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.section>

          <motion.div variants={itemVariants} className="grid gap-2.5 sm:grid-cols-2">
            {[
              {
                label: 'Writing',
                path: '/writing',
                description: 'Work on essays, task response, structure, and clear explanations.',
                badge: 'Essay Lab',
                icon: PenTool,
                tone: 'amber',
              },
              {
                label: 'Speaking',
                path: '/speaking',
                description: 'Practise your spoken answers, fluency, and review AI feedback.',
                badge: 'Speech AI',
                icon: Mic,
                tone: 'rose',
              },
            ].map(({ label, path, description, badge, icon: Icon, tone }) => (
              <Link
                key={path}
                to={path}
                className={`${TILE} ${focusRing} group flex items-center justify-between gap-3 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:shadow-xs active:scale-[0.99]`}
              >
                <div className="flex items-center gap-3">
                  <IconChip icon={Icon} tone={tone} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className={`${TITLE} text-sm`}>{label} practice</p>
                      <span
                        className={`${MICRO} rounded-full border border-[#e4e2f0] px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:border-white/10 dark:text-slate-400`}
                      >
                        {badge}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-xs ${MUTED}`}>{description}</p>
                  </div>
                </div>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-slate-400 transition-colors group-hover:text-[#5a63df] dark:text-slate-500 dark:group-hover:text-[#afb5ff]"
                />
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </TooltipProvider>
  );
}
