import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  WELL,
} from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../../practiceLabels';
import SourceSetPicker, { date, focusRing, subject } from './SourceSetPicker';
import { LINK, SetNote, StartButton } from './shared';

function ResultSources({ focus, sources }) {
  return (
    <details className="group mt-1 text-xs">
      <summary className={cn(LINK, focusRing, 'inline-flex cursor-pointer items-center gap-1')}>
        See those results
        <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2 space-y-1.5">
        {sources.map((source, index) => (
          <li key={`${source.sessionId}-${index}`}>
            <Link
              className={cn(LINK, 'inline-flex items-center gap-1')}
              to={
                source.practice
                  ? `/practice-lab/session/${source.sessionId}?library=1`
                  : `/${subject(focus).toLowerCase()}-test/${source.sessionId}?view-results=true`
              }
            >
              {source.title || 'View saved result'} · {date(source.completedAt)}
              <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function NeedSummary({ need }) {
  if (!need?.total) {
    return (
      <p className={`mt-1 text-xs leading-relaxed ${MUTED}`}>
        Start with one original question set. Your answers will help us suggest what to work on
        next.
      </p>
    );
  }
  return (
    <p className={`mt-1 text-xs ${MUTED}`}>
      You got{' '}
      <strong className={`${NUM} text-slate-900 dark:text-slate-100`}>
        {need.correct} of {need.total}
      </strong>{' '}
      correct in recent tests.
    </p>
  );
}

function Steps({ hasMistake }) {
  const steps = [
    hasMistake && ['See your mistake', 'One old answer, explained'],
    ['Try the questions', 'No time limit'],
    ['Check answers', 'See what to do next'],
  ].filter(Boolean);
  return (
    <ol
      aria-label="How practice works"
      className={cn(
        WELL,
        'my-3.5 hidden divide-x divide-[#e4e2f0] overflow-hidden rounded-lg border border-[#e4e2f0] dark:divide-white/[0.07] dark:border-white/[0.07] sm:grid sm:grid-flow-col sm:auto-cols-fr'
      )}
    >
      {steps.map(([title, detail], index) => (
        <li key={title} className="flex items-center gap-2.5 px-3.5 py-2.5">
          <span
            className={cn(
              NUM,
              'grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#5a63df]/10 text-[10px] font-black text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#adb3ff]'
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
            <p className={`truncate text-[11px] ${MUTED}`}>{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ChosenSet({ set, sets, onSetChange, action }) {
  const [changing, setChanging] = useState(false);
  return (
    <div className="mt-3.5 rounded-xl border border-[#e4e2f0] bg-[#faf9ff] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{set.title}</p>
            <span
              className={cn(
                NUM,
                'rounded-md border border-[#e4e2f0] bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300'
              )}
            >
              {set.total} {set.total === 1 ? 'question' : 'questions'}
            </span>
            {sets.length > 1 && (
              <button
                type="button"
                aria-expanded={changing}
                className={cn(
                  focusRing,
                  'rounded-md border border-[#e4e2f0] bg-white px-2 py-0.5 text-[11px] font-bold text-[#5a63df] transition-[transform,border-color] duration-150 ease-out hover:border-[#5a63df]/40 active:scale-[0.97] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#afb5ff]'
                )}
                onClick={() => setChanging((value) => !value)}
              >
                Change
              </button>
            )}
          </div>
        </div>
        <StartButton set={set} {...action} />
      </div>
      {changing && (
        <div className="mt-2.5">
          <SourceSetPicker sets={sets} value={set.id} onChange={onSetChange} />
        </div>
      )}
      <div className="mt-2.5 border-t border-[#e4e2f0]/80 pt-2 dark:border-white/[0.06]">
        <SetNote set={set} />
      </div>
    </div>
  );
}

function NoSets() {
  return (
    <p className={cn(WELL, 'mt-3 rounded-lg p-3 text-xs leading-relaxed')}>
      No suitable sets are available for this selection. Try the{' '}
      <Link className={cn(LINK, 'underline')} to="/reading">
        Reading library
      </Link>{' '}
      or{' '}
      <Link className={cn(LINK, 'underline')} to="/listening">
        Listening library
      </Link>
      .
    </p>
  );
}

function Suggestion({ focus, need, sets, set, onSetChange, ...action }) {
  return (
    <>
      <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {focusLabel(focus)}
      </h3>
      <NeedSummary need={need} />
      {need?.sources?.length > 0 && <ResultSources focus={focus} sources={need.sources} />}
      <Steps hasMistake={Boolean(need?.mistakes?.length)} />
      <ChosenSet set={set} sets={sets} onSetChange={onSetChange} action={action} />
      {action.blockedReason && (
        <p role="status" className={`mt-2 text-[11px] ${MUTED}`}>
          {action.blockedReason}
        </p>
      )}
    </>
  );
}

/** The one thing to do next. */
export default function StartHereCard(props) {
  const { focus, need, set } = props;
  return (
    <section
      aria-label="Your next step"
      className={cn(
        PANEL,
        'relative overflow-hidden border-[#5a63df]/35 p-4 sm:p-5 dark:border-[#8f97ff]/30'
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[#5a63df]" aria-hidden="true" />
      <div className="flex items-center justify-between gap-2">
        <h2 className={cn(MICRO, 'text-[#5a63df] dark:text-[#adb3ff]')}>
          {need?.mistakes?.length ? 'Start here' : 'Find your starting point'}
        </h2>
        {focus && <Pill tone="accent">{subject(focus)}</Pill>}
      </div>
      {set ? <Suggestion {...props} /> : <NoSets />}
    </section>
  );
}
