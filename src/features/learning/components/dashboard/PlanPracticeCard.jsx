import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, PANEL, PanelTitle, WELL } from '@/features/dashboard/components/primitives';
import { useAuth } from '@/features/auth/context/AuthContext';
import { drillText } from '@/features/testing/writing/report/drillText';
import {
  DRILL_MINUTES,
  planItemLink,
  removePlanItem,
  setPlanItemDone,
} from '@/features/testing/writing/report/planAdditions';
import { reportT } from '@/features/testing/writing/report/reportStrings';
import { usePlanPractice } from '@/features/testing/writing/report/usePlanPractice';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';

function PracticeRow({ item, text, onToggle, onRemove }) {
  const done = Boolean(item.doneAt);
  return (
    <li className={cn('flex items-start gap-2.5 rounded-lg p-2.5', WELL)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Done: ${text.title}`}
        onClick={onToggle}
        className={cn(
          'relative grid h-6 w-6 shrink-0 place-items-center rounded-md border cursor-pointer transition-colors before:absolute before:-inset-2.5 active:scale-95',
          done
            ? 'border-transparent bg-[rgb(var(--signal-ok))] text-white'
            : 'border-[#c9c7dc] bg-white dark:border-white/25 dark:bg-transparent',
          FOCUS
        )}
      >
        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] font-bold leading-5', done && 'line-through opacity-60')}>
          {text.title}
        </p>
        <p className={cn('text-xs leading-5', MUTED)}>{text.why}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3">
          <span className={cn('text-[11px]', NUM, MUTED)}>
            About {DRILL_MINUTES[item.drill.id]} min
          </span>
          <Link
            to={planItemLink(item)}
            aria-label={`Start: ${text.title}`}
            className={cn(
              'inline-flex min-h-8 items-center gap-1 rounded text-xs font-bold text-[#4b53c9] hover:underline dark:text-[#afb5ff]',
              FOCUS
            )}
          >
            Start
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <button
        type="button"
        aria-label={`Remove: ${text.title}`}
        onClick={onRemove}
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-md cursor-pointer hover:bg-black/5 dark:hover:bg-white/10',
          MUTED,
          FOCUS
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** The report links here, but the list arrives after the page does. */
function useScrollWhenLinked(ready) {
  const ref = useRef(null);
  const { hash } = useLocation();
  useEffect(() => {
    if (ready && hash === '#writing-practice') ref.current?.scrollIntoView?.({ block: 'start' });
  }, [ready, hash]);
  return ref;
}

/** Practice added from Writing reports. It stays when the plan is rebuilt. */
export default function PlanPracticeCard() {
  const { userProfile } = useAuth();
  const plan = usePlanPractice(userProfile?.id);
  const ref = useScrollWhenLinked(Boolean(plan.items?.length));
  if (!plan.items?.length && !plan.failed) return null;
  const t = reportT('en');
  const items = plan.items || [];
  const left = items.filter((item) => !item.doneAt).length;

  return (
    <section
      ref={ref}
      id="writing-practice"
      aria-label="From your Writing reports"
      className={cn(PANEL, 'scroll-mt-3 p-3.5 sm:p-4')}
    >
      <PanelTitle
        label="From your Writing reports"
        accent
        action={<span className={cn('text-[11px]', NUM, MUTED)}>{left} to do</span>}
      />
      {plan.failed && (
        <p role="alert" className="mb-2 text-xs font-semibold text-[rgb(var(--signal-fault))]">
          That change was not saved. Please try again.
        </p>
      )}
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <PracticeRow
            key={item.id}
            item={item}
            text={drillText(t, item.drill)}
            onToggle={() =>
              plan.change((list) =>
                setPlanItemDone(list, item.id, item.doneAt ? null : new Date().toISOString())
              )
            }
            onRemove={() => plan.change((list) => removePlanItem(list, item.id))}
          />
        ))}
      </ul>
    </section>
  );
}
