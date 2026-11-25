import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { MUTED, PANEL, Pill, TITLE } from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../../practiceLabels';
import { sessionSummary } from '../../practiceHomeModel';
import { focusRing, subject } from './SourceSetPicker';
import { LINK } from './shared';

const ROW =
  'group flex w-full cursor-pointer select-none items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-[background-color] duration-150 ease-out hover:bg-[#f4f3fb]/90 active:scale-[0.995] dark:hover:bg-white/[0.05]';
const ACTION =
  'shrink-0 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-[transform,border-color,background-color,color] duration-150 ease-out group-hover:border-[#5a63df]/55 group-hover:bg-[#5a63df]/[0.06] group-hover:text-[#5a63df] group-active:scale-[0.97] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:group-hover:border-[#8f97ff]/55 dark:group-hover:bg-[#8f97ff]/12 dark:group-hover:text-[#afb5ff]';
const RESUME_VISIBLE = 2;
const DUE_VISIBLE = 3;

function Queue({ title, badge, items, limit, moreLabel, renderItem }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, limit);
  return (
    <section
      className={cn(
        PANEL,
        'flex h-full min-w-0 flex-col p-4 transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#5a63df]/30 dark:hover:border-white/[0.14]'
      )}
    >
      <div className="mb-2.5 flex min-h-6 items-center justify-between gap-2">
        <h2 className={TITLE}>{title}</h2>
        {badge}
      </div>
      <ul className="-mx-2 flex-1 divide-y divide-[#e4e2f0]/75 border-t border-[#e4e2f0] pt-1 dark:divide-white/[0.06] dark:border-white/[0.07]">
        {visible.map(renderItem)}
      </ul>
      {items.length > limit && (
        <div className="mt-2 border-t border-[#e4e2f0]/70 pt-2 dark:border-white/[0.06]">
          <button
            type="button"
            aria-expanded={showAll}
            className={cn(LINK, focusRing, 'cursor-pointer rounded text-xs')}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Show fewer' : moreLabel}
          </button>
        </div>
      )}
    </section>
  );
}

function RowText({ title, detail }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-bold text-slate-800 transition-colors duration-150 group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]">
        {title}
      </span>
      <span className={`block text-[11px] ${MUTED}`}>{detail}</span>
    </span>
  );
}

const newestFirst = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''));

/** Unfinished work and due reviews, each capped so a backlog never buries the page. */
export default function QueuePanels({ sessions, groupsById, due, onReview }) {
  if (!sessions.length && !due.length) return null;
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-flow-col md:auto-cols-fr">
      {sessions.length > 0 && (
        <Queue
          title="Pick up where you stopped"
          items={[...sessions].sort(newestFirst)}
          limit={RESUME_VISIBLE}
          moreLabel={`All unfinished (${sessions.length})`}
          renderItem={(session) => (
            <li key={session.id} className="py-0.5 first:pt-0">
              <Link
                to={`/practice-lab/session/${session.id}?library=1`}
                aria-label={`Resume ${subject(session.focus)} ${focusLabel(session.focus)}`}
                className={cn(ROW, focusRing)}
              >
                <RowText
                  title={focusLabel(session.focus)}
                  detail={sessionSummary(session, groupsById.get(session.group_id))}
                />
                <span className={ACTION}>Resume</span>
              </Link>
            </li>
          )}
        />
      )}
      {due.length > 0 && (
        <Queue
          title="Due for review today"
          badge={<Pill tone="warn">{due.length} due</Pill>}
          items={due}
          limit={DUE_VISIBLE}
          moreLabel={`Show all ${due.length}`}
          renderItem={(need) => (
            <li key={need.focus} className="py-0.5 first:pt-0">
              <button
                type="button"
                aria-label={`Review ${subject(need.focus)} ${focusLabel(need.focus)}`}
                className={cn(ROW, focusRing)}
                onClick={() => onReview(need.focus)}
              >
                <RowText title={focusLabel(need.focus)} detail={subject(need.focus)} />
                <span className={ACTION}>Review</span>
              </button>
            </li>
          )}
        />
      )}
    </div>
  );
}
