import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Compass } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MUTED,
  NUM,
  TILE,
  WELL,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/features/dashboard/components/primitives.jsx';
import { focusLabel, groupCategory } from '../practiceLabels';
import SourceSetPicker, { focusRing, subject } from './home/SourceSetPicker';
import StartHereCard from './home/StartHereCard';
import QueuePanels from './home/QueuePanels';
import TypeCards from './home/TypeCards';
import { LINK, SetNote, StartButton } from './home/shared';

const FAMILIARITY_ORDER = { new: 0, familiar: 1, repeated: 2 };

const setsFor = (groups, type) =>
  groups
    .filter((group) => groupCategory(group) === type)
    .sort((a, b) => FAMILIARITY_ORDER[a.familiarity] - FAMILIARITY_ORDER[b.familiarity]);

/** Question types, the ones the learner struggles with first. */
function rankedTypes(groups, needs) {
  const rank = (type) => {
    const index = needs.findIndex((need) => need.focus === type);
    return index < 0 ? needs.length : index;
  };
  return [...new Set(groups.map(groupCategory))].sort((a, b) => rank(a) - rank(b));
}

const inSubject = (groups, filter) =>
  groups.filter((group) => filter === 'all' || group.focus.startsWith(`${filter}:`));

/** The type the main card is about: the requested one if it exists, else the top need. */
function suggestedType(groups, needs, focus, module) {
  const types = rankedTypes(groups, needs);
  if (types.includes(focus)) return focus;
  const requested = groups.find((group) => group.focus === focus);
  if (requested) return groupCategory(requested);
  return rankedTypes(inSubject(groups, module || 'all'), needs)[0] ?? types[0];
}

// One gate for every "start a set" button. A missing requested focus must not be
// part of it: the page falls back to an available type, which has to stay startable.
function startGate(data, hasSet) {
  const exhausted = !data.unlimited && !data.remaining;
  const reset = data.reset_at
    ? new Date(data.reset_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '00:00 UTC';
  let blockedReason = '';
  if (!data.enabled) {
    blockedReason = 'New practice sets are paused right now, so this cannot be started.';
  } else if (exhausted) {
    blockedReason = `You have used all ${data.limit} sets for today. Your allowance resets at ${reset}.`;
  } else if (!hasSet) {
    blockedReason = 'No library set is available for this question type yet.';
  }
  return { canStart: !blockedReason, blockedReason };
}

function PageHeader({ data }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
          Practice Lab
        </h1>
        <p className={`mt-0.5 text-sm ${MUTED}`}>
          Work on the question types you get wrong, one short set at a time.
        </p>
        {!data.unlimited && (
          <p className={`mt-0.5 text-xs ${MUTED}`}>
            Sets left today:{' '}
            <strong className={NUM}>
              {data.remaining} / {data.limit}
            </strong>
          </p>
        )}
      </div>
      <Link
        to="/learning-path"
        className={cn(
          TILE,
          focusRing,
          'hidden items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-bold sm:inline-flex'
        )}
      >
        <Compass className="h-3.5 w-3.5" aria-hidden="true" />
        Your study plan
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}

function PausedNotice() {
  return (
    <div
      role="status"
      className={`${WELL} rounded-lg border border-amber-500/20 p-3 text-xs leading-relaxed`}
    >
      <strong>New practice sets are currently unavailable.</strong> Your saved work is still
      accessible. In the meantime, practise in the{' '}
      <Link className={cn(LINK, 'underline')} to="/reading">
        Reading library
      </Link>{' '}
      or{' '}
      <Link className={cn(LINK, 'underline')} to="/listening">
        Listening library
      </Link>
      .
    </div>
  );
}

function SubstitutedNotice({ focus, selected, activityId }) {
  return (
    <p role="status" className={`${WELL} rounded-lg border border-amber-500/20 p-3 text-xs`}>
      There is no separate set for {focusLabel(focus)} yet, so we have selected{' '}
      <strong className="font-semibold">{focusLabel(selected)}</strong> instead. Pick a different
      question type below if you would rather practise something else.
      {activityId && ' This other set will not complete your Learning Path task.'}
    </p>
  );
}

function TypePanel({ type, sets, data, busy, start }) {
  const [setId, setSetId] = useState('');
  const set = sets.find((item) => item.id === setId) || sets[0];
  const gate = startGate(data, Boolean(set));
  return (
    <section
      aria-label="Selected question type"
      aria-live="polite"
      className={`${WELL} rounded-xl border border-[#5a63df]/40 p-3.5`}
    >
      <p className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100">
        {focusLabel(type)}, {subject(type)}. Choose a test
      </p>
      {set && (
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SourceSetPicker sets={sets} value={set.id} onChange={setSetId} />
          </div>
          <StartButton set={set} busy={busy} canStart={gate.canStart} onStart={start} />
        </div>
      )}
      {set && (
        <div className="mt-2">
          <SetNote set={set} />
        </div>
      )}
      {gate.blockedReason && <p className={`mt-2 text-[11px] ${MUTED}`}>{gate.blockedReason}</p>}
    </section>
  );
}

function ToolLinks() {
  return (
    <p className={`text-xs ${MUTED}`}>
      Writing and speaking have their own practice:{' '}
      <Link className={LINK} to="/writing">
        Writing practice
      </Link>{' '}
      and{' '}
      <Link className={LINK} to="/speaking">
        Speaking practice
      </Link>
    </p>
  );
}

/** Which type card is open, and the subject filter around it. */
function useTypeBrowser(module, reducedMotion) {
  const [subjectFilter, setSubjectFilter] = useState(module || 'all');
  const [openFocus, setOpenFocus] = useState(null);
  const [reviewRequest, setReviewRequest] = useState(null);

  // Only a Review press moves the page. A card click keeps focus where it is.
  useEffect(() => {
    if (!reviewRequest) return;
    const card = document.querySelector(`[data-type="${reviewRequest.focus}"]`);
    card?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    card?.focus({ preventScroll: true });
  }, [reviewRequest, reducedMotion]);

  return {
    subjectFilter,
    openFocus,
    review: (type) => {
      setSubjectFilter('all');
      setOpenFocus(type);
      setReviewRequest({ focus: type });
    },
    changeSubject: (value) => {
      setSubjectFilter(value);
      setOpenFocus(null);
    },
    toggle: (type) => setOpenFocus((open) => (open === type ? null : type)),
  };
}

const hasType = (groups, type) =>
  groups.some((group) => group.focus === type || groupCategory(group) === type);

/** What the main card suggests, with the sets it can start. */
function useSuggestion(groups, needs, focus, module) {
  const [setId, setSetId] = useState('');
  const selected = suggestedType(groups, needs, focus, module);
  const sets = setsFor(groups, selected);
  return {
    selected,
    sets,
    set: sets.find((item) => item.id === setId) || sets[0],
    setSetId,
    substituted: Boolean(focus) && !hasType(groups, focus),
  };
}

export default function PracticeHome({ data, focus, module, activityId, busy, error, start }) {
  const reducedMotion = useReducedMotion();
  const browser = useTypeBrowser(module, reducedMotion);
  const groups = data.groups || [];
  const needs = data.recommendations || [];
  const { selected, sets, set, setSetId, substituted } = useSuggestion(
    groups,
    needs,
    focus,
    module
  );
  const visibleGroups = inSubject(groups, browser.subjectFilter);
  const types = rankedTypes(visibleGroups, needs);
  const due = needs.filter((need) => need.due && hasType(groups, need.focus));

  return (
    <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.08] dark:opacity-[0.12]"
      />
      <motion.div
        variants={reducedMotion ? undefined : STAGGER_CONTAINER}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-6xl space-y-3.5"
      >
        {[
          <PageHeader key="header" data={data} />,
          error,
          !data.enabled && <PausedNotice key="paused" />,
          substituted && (
            <SubstitutedNotice
              key="substituted"
              focus={focus}
              selected={selected}
              activityId={activityId}
            />
          ),
          <StartHereCard
            key="start"
            focus={selected}
            need={needs.find((need) => need.focus === selected)}
            sets={sets}
            set={set}
            onSetChange={setSetId}
            busy={busy}
            onStart={start}
            {...startGate(data, Boolean(set))}
          />,
          <QueuePanels
            key="queue"
            sessions={(data.sessions || []).filter((session) => !session.completed_at)}
            groupsById={new Map(groups.map((group) => [group.id, group]))}
            due={due}
            onReview={browser.review}
          />,
          <TypeCards
            key="types"
            types={types}
            groups={visibleGroups}
            needs={needs}
            tips={data.categoryTips}
            subjectFilter={browser.subjectFilter}
            onSubjectChange={browser.changeSubject}
            openFocus={browser.openFocus}
            onToggle={browser.toggle}
            renderPanel={(type) => (
              <TypePanel
                key={type}
                type={type}
                sets={setsFor(visibleGroups, type)}
                data={data}
                busy={busy}
                start={start}
              />
            )}
          />,
          <ToolLinks key="tools" />,
        ].map((node, index) =>
          node ? (
            <motion.div key={index} variants={reducedMotion ? undefined : FADE_UP}>
              {node}
            </motion.div>
          ) : null
        )}
      </motion.div>
    </main>
  );
}
