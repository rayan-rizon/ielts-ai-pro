import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Target,
  CheckCircle2,
  RotateCcw,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../practiceLabels';

const subject = (focus = '') => (focus.startsWith('listening:') ? 'Listening' : 'Reading');
const date = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const familiarity = (value) =>
  ({ new: 'New questions', familiar: 'Familiar passage or audio', repeated: 'Practise again' })[
    value
  ] || 'Library questions';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';

function SourceSetPicker({ sets, value, onChange }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = sets.find((set) => set.id === value) || sets[0];
  const label = selected
    ? `${selected.title} · ${focusLabel(selected.focus)} · ${familiarity(selected.familiarity)}`
    : 'Choose a source set';

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
        aria-expanded={open}
        aria-controls="practice-source-options"
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
        className={`${TILE} ${focusRing} flex min-h-10 w-full items-center justify-between gap-3 border-[#c9c8df] bg-white p-2.5 text-left text-xs hover:border-[#5a63df]/60 dark:border-white/20 dark:bg-white/[0.06]`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
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
          className={`${PANEL} absolute inset-x-0 top-[calc(100%+0.35rem)] z-20 max-h-60 overflow-y-auto p-1`}
        >
          {sets.map((set, index) => {
            const optionLabel = `${set.title} · ${focusLabel(set.focus)} · ${familiarity(set.familiarity)}`;
            return (
              <button
                key={set.id}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                tabIndex={index === activeIndex ? 0 : -1}
                type="button"
                role="option"
                aria-label={optionLabel}
                aria-selected={set.id === selected?.id}
                onClick={() => {
                  onChange(set.id);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`${focusRing} flex w-full items-start rounded-md px-2.5 py-2 text-left text-xs leading-relaxed hover:bg-[#5a63df]/10 ${set.id === selected?.id ? 'bg-[#5a63df]/10 font-semibold text-[#4c55cd] dark:text-[#afb5ff]' : ''}`}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{set.title}</span>
                  <span className={`mt-0.5 block text-[11px] ${MUTED}`}>
                    {focusLabel(set.focus)} · {familiarity(set.familiarity)}
                  </span>
                </span>
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

  return (
    <main className="mx-auto max-w-7xl space-y-3 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">Practice Lab</h1>
            {['pro', 'premium'].includes(data.tier) && <Pill tone="accent">{data.tier}</Pill>}
          </div>
          <p className={`mt-1 text-xs ${MUTED}`}>
            Understand your mistakes. Practise one question type with real library questions.
          </p>
        </div>
        <Link
          to="/learning-path"
          className={`inline-flex items-center gap-2 rounded-md text-xs font-semibold text-[#5a63df] dark:text-[#afb5ff] ${focusRing}`}
        >
          Your learning path <ArrowRight size={14} />
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat
          size="sm"
          icon={Layers}
          label="Sets left today"
          value={`${data.remaining ?? 0} / ${data.limit ?? 0}`}
          sub={`Resets ${reset}`}
        />
        <Stat
          size="sm"
          icon={Target}
          label="Question types"
          value={new Set(allGroups.map((g) => g.focus)).size}
          sub={`${allGroups.length} available library sets`}
        />
        <Stat
          size="sm"
          icon={CheckCircle2}
          label="Sets completed"
          value={sessions.filter((s) => s.completed_at).length}
          sub="Your saved Practice Lab results"
        />
        <Stat
          size="sm"
          icon={RotateCcw}
          label="Ready to review"
          value={due.length}
          sub="Question types to try again"
        />
      </div>
      {error}
      {!data.enabled && (
        <div role="status" className={`${WELL} rounded-lg p-3 text-xs leading-relaxed`}>
          <strong>New practice sets are currently unavailable.</strong> Your saved work is still
          accessible. In the meantime, practise in the{' '}
          <Link className="underline" to="/reading">
            Reading library
          </Link>{' '}
          or{' '}
          <Link className="underline" to="/listening">
            Listening library
          </Link>
          .
        </div>
      )}
      {continuing.length > 0 && (
        <section className={`${PANEL} p-3`}>
          <h2 className={`${TITLE} mb-2`}>Continue practising</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {continuing.map((s) => (
              <Link
                key={s.id}
                to={`/practice-lab/session/${s.id}?library=1`}
                className={`${TILE} ${focusRing} flex items-center justify-between gap-2 p-3`}
              >
                <div>
                  <p className={`${MICRO} ${MUTED}`}>
                    {subject(s.focus)} · Step {Math.min(4, (s.stage || 0) + 1)} of 4
                  </p>
                  <p className={`${TITLE} mt-1`}>{focusLabel(s.focus)}</p>
                </div>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </section>
      )}
      {requestedUnavailable && (
        <p role="status" className={`${WELL} rounded-lg p-3 text-xs`}>
          A separate set for {focusLabel(focus)} is not available. Select an available type below to
          continue.
        </p>
      )}
      <div className="grid grid-cols-12 gap-3">
        <section
          className={`${PANEL} min-w-0 p-4 col-span-12 lg:col-span-8`}
          aria-label="Your next step"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className={TITLE}>
              {need?.mistakes?.length ? 'Your next step' : 'Find your starting point'}
            </h2>
            {selected && <Pill tone="accent">{subject(selected)}</Pill>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <h3 className="text-lg font-bold tracking-tight">
                {selected ? focusLabel(selected) : 'Choose a library test'}
              </h3>
              {need?.total > 0 ? (
                <>
                  <p className="text-sm">
                    You missed{' '}
                    <strong className={NUM}>
                      {need.total - need.correct} of {need.total}
                    </strong>{' '}
                    questions in your recent results.
                  </p>
                  <Pill tone={need.mistakes?.length ? 'warn' : 'ok'}>{need.label}</Pill>
                  <details className={`text-xs ${MUTED}`}>
                    <summary className={`cursor-pointer py-1 ${focusRing}`}>
                      See the results behind this suggestion
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {need.sources?.map((s, i) => (
                        <li key={`${s.sessionId}-${i}`}>
                          <Link
                            className="underline"
                            to={
                              s.practice
                                ? `/practice-lab/session/${s.sessionId}?library=1`
                                : `/${subject(selected).toLowerCase()}-test/${s.sessionId}?view-results=true`
                            }
                          >
                            {s.title || 'View saved result'} · {date(s.completedAt)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : (
                <p className={`text-xs leading-relaxed ${MUTED}`}>
                  Start with one original question set. Your answers will help us suggest what to
                  work on next.
                </p>
              )}
              <ol aria-label="How practice works" className={`space-y-2 rounded-lg p-3 ${WELL}`}>
                {[
                  need?.mistakes?.length ? 'Review a previous mistake' : 'Find your starting point',
                  'Learn an approach',
                  'Try another question set',
                ].map((label, i) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    <span className={`${NUM} text-[#5a63df] dark:text-[#afb5ff]`}>0{i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
            {next ? (
              <div className={`${TILE} min-w-0 space-y-3 p-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`${MICRO} ${MUTED}`}>Your practice set</p>
                  <Pill tone={next.familiarity === 'new' ? 'ok' : 'neutral'}>
                    {familiarity(next.familiarity)}
                  </Pill>
                </div>
                <p className={TITLE}>{next.title}</p>
                <p className={`text-xs ${MUTED}`}>
                  {focusLabel(next.focus)} · <span className={NUM}>{next.total}</span> questions
                </p>
                {sets.length > 1 && (
                  <div className={`block text-xs ${MUTED}`}>
                    Choose a source set
                    <div className="mt-1">
                      <SourceSetPicker sets={sets} value={next.id} onChange={setGroupId} />
                    </div>
                  </div>
                )}
                <p className={`text-xs leading-relaxed ${MUTED}`}>
                  {next.familiarity === 'new'
                    ? 'This source test will be marked partly practised.'
                    : next.familiarity === 'familiar'
                      ? 'You have seen this passage or audio before.'
                      : 'You have answered these questions before. Use them for revision.'}{' '}
                  Your full-test result stays separate.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={
                    busy || !data.enabled || !data.remaining || Boolean(requestedUnavailable)
                  }
                  onClick={() => start(next)}
                >
                  {busy
                    ? 'Opening your set…'
                    : next.familiarity === 'repeated'
                      ? 'Practise again'
                      : 'Review and practise'}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
                {!data.remaining && (
                  <p className="text-xs">
                    Today’s allowance is used. Resets at {reset}; resuming saved work is free.
                  </p>
                )}
              </div>
            ) : (
              <div className={`${WELL} rounded-lg p-3 text-xs leading-relaxed`}>
                No suitable sets are available for this selection. Try the{' '}
                <Link className="underline" to="/reading">
                  Reading library
                </Link>{' '}
                or{' '}
                <Link className="underline" to="/listening">
                  Listening library
                </Link>
                .
              </div>
            )}
          </div>
        </section>
        <aside className="col-span-12 grid gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
          <section className={`${PANEL} p-4`}>
            <h2 className={TITLE}>How you’re doing</h2>
            <p className={`mt-1 text-xs ${MUTED}`}>
              {selected ? focusLabel(selected) : 'Your recent results'}
            </p>
            <div className="mt-3 space-y-2">
              {need?.history?.length ? (
                need.history.map((h, i) => (
                  <div
                    key={i}
                    className={`${WELL} flex items-center justify-between gap-2 rounded-md px-3 py-2`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{need.sources?.[i]?.title || h.kind}</p>
                      <p className={`text-[11px] ${MUTED}`}>
                        {h.kind} · {date(h.completedAt)}
                      </p>
                    </div>
                    <strong className={`${NUM} text-sm`}>
                      {h.correct} / {h.total}
                    </strong>
                  </div>
                ))
              ) : (
                <p className={`text-xs leading-relaxed ${MUTED}`}>
                  Complete your first set to see your results here. Answers completed with help and
                  repeated questions are shown separately.
                </p>
              )}
            </div>
            <p className={`mt-3 text-[11px] ${MUTED}`}>
              Correct answers for this question type. Full tests and Practice Lab results are
              labelled separately.
            </p>
          </section>
          <section className={`${PANEL} p-4`}>
            <h2 className={`${TITLE} mb-2`}>Try again</h2>
            {due.length ? (
              <div className="space-y-2">
                {due.map((n) => (
                  <button
                    key={n.focus}
                    className={`${TILE} ${focusRing} flex w-full items-center justify-between gap-2 p-2 text-left text-xs`}
                    onClick={() => {
                      setSubjectFilter('all');
                      choose(n.focus);
                    }}
                  >
                    {focusLabel(n.focus)}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-xs leading-relaxed ${MUTED}`}>
                Nothing due today. After a completed set, we’ll suggest when to return.
              </p>
            )}
          </section>
        </aside>
      </div>
      <section className={`${PANEL} p-4`} aria-label="Choose something else">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={TITLE}>Choose something else</h2>
            <p className={`mt-1 text-xs ${MUTED}`}>
              Select one question type to see its results and available sets.
            </p>
          </div>
          <div className={`${WELL} flex gap-1 rounded-lg p-1`} aria-label="Filter by subject">
            {['all', 'reading', 'listening'].map((value) => (
              <button
                key={value}
                aria-pressed={subjectFilter === value}
                onClick={() => {
                  setSubjectFilter(value);
                  setGroupId('');
                  setExploreFocus(null);
                }}
                className={`${focusRing} rounded-md px-3 py-1.5 text-xs ${subjectFilter === value ? `${TILE} font-semibold text-[#5a63df] dark:text-[#afb5ff]` : MUTED}`}
              >
                {value === 'all' ? 'All' : subject(`${value}:`)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {availableFocus.map((f) => {
            const result = needs.find((n) => n.focus === f);
            const available = groups.filter((g) => g.focus === f);
            const fresh = available.filter((g) => g.familiarity === 'new').length;
            const Icon = f.startsWith('listening:') ? Headphones : BookOpen;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={selected === f}
                aria-label={`Choose ${focusLabel(f)}. ${available.length} source sets available.`}
                onClick={() => choose(f)}
                className={`${TILE} ${focusRing} min-w-0 p-3 text-left ${selected === f ? 'ring-1 ring-[#5a63df]' : 'hover:border-[#5a63df]/40'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`${MICRO} ${MUTED} flex items-center gap-1.5`}>
                    <Icon size={12} />
                    {subject(f)}
                  </span>
                  {result?.mistakes?.length > 0 && (
                    <Pill tone="warn">
                      {result.repeatedDifficulty ? 'Worth another look' : 'Worth practising'}
                    </Pill>
                  )}
                </div>
                <h3 className={`${TITLE} mt-2`}>{focusLabel(f)}</h3>
                <div className={`mt-2 flex flex-wrap justify-between gap-1 text-[11px] ${MUTED}`}>
                  <span>
                    <span className={NUM}>{available.length}</span> sets ·{' '}
                    <span className={NUM}>{fresh}</span> new
                  </span>
                  <span>
                    {result?.total
                      ? `${result.correct}/${result.total} correct`
                      : 'No recent result'}
                  </span>
                </div>
                {result?.total > 0 && (
                  <div className="mt-2">
                    <Bar value={(100 * result.correct) / result.total} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {!availableFocus.length && (
          <p className={`mt-3 text-xs ${MUTED}`}>
            No available sets for this subject. Choose another subject or browse the library.
          </p>
        )}
        {exploreFocus && selected === exploreFocus && next && (
          <section
            className={`${WELL} mt-3 grid gap-3 rounded-lg p-3 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,1.2fr)] sm:items-end`}
            aria-label="Selected question type"
            aria-live="polite"
          >
            <div className="min-w-0">
              <p className={`${MICRO} text-[#5a63df] dark:text-[#afb5ff]`}>
                Selected question type
              </p>
              <p className={`${TITLE} mt-1`}>{focusLabel(exploreFocus)}</p>
              <p className={`mt-1 text-xs ${MUTED}`}>
                Choose a real library set, then review your mistake and practise.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              {sets.length > 1 ? (
                <label className={`min-w-0 text-[11px] ${MUTED}`}>
                  Source set
                  <span className="mt-1 block">
                    <SourceSetPicker sets={sets} value={next.id} onChange={setGroupId} />
                  </span>
                </label>
              ) : (
                <p className={`text-[11px] ${MUTED}`}>
                  {next.title} · {next.total} questions
                </p>
              )}
              <Button
                ref={exploreActionRef}
                size="sm"
                disabled={busy || !data.enabled || !data.remaining || Boolean(requestedUnavailable)}
                onClick={() => start(next)}
                className="whitespace-nowrap"
              >
                {next.familiarity === 'repeated' ? 'Practise again' : 'Review and practise'}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </section>
        )}
      </section>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          ['Writing', '/writing', 'Work on essays, structure and clear explanations.'],
          ['Speaking', '/speaking', 'Practise your spoken answers and review feedback.'],
        ].map(([label, path, description]) => (
          <Link
            key={path}
            to={path}
            className={`${TILE} ${focusRing} flex items-center justify-between gap-3 p-3`}
          >
            <div>
              <p className={TITLE}>{label} practice</p>
              <p className={`mt-1 text-xs ${MUTED}`}>{description}</p>
            </div>
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>
    </main>
  );
}
