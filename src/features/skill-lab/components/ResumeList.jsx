import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Headphones } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, Pill } from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../practiceLabels';

const VISIBLE = 4;
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315]';

const SUBJECT = {
  listening: {
    Icon: Headphones,
    chip: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
  },
  reading: {
    Icon: BookOpen,
    chip: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
};

function ResumeRow({ session, title }) {
  const subject = session.focus?.startsWith('listening:') ? 'listening' : 'reading';
  const { Icon, chip } = SUBJECT[subject];
  return (
    <Link
      to={`/practice-lab/session/${session.id}?library=1`}
      className={cn(
        FOCUS_RING,
        'group flex items-center gap-3 rounded-xl border border-[#e4e2f0] bg-white p-2.5 pr-3 transition-[transform,border-color,background-color] duration-150 ease-out hover:border-[#5a63df]/40 hover:bg-[#fbfbfe] active:scale-[0.99] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
      )}
    >
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', chip)}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-50">
          {focusLabel(session.focus)}
        </span>
        <span className={cn('mt-0.5 block truncate text-[11px] leading-tight', MUTED)}>
          {title || (subject === 'listening' ? 'Listening' : 'Reading')}
        </span>
      </span>
      <Pill tone={session.stage ? 'accent' : 'neutral'} className="hidden sm:inline-flex">
        {session.stage ? 'Practising' : 'Review first'}
      </Pill>
      <ArrowRight
        size={14}
        aria-hidden="true"
        className="shrink-0 text-slate-400 transition-[transform,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:group-hover:text-[#afb5ff]"
      />
    </Link>
  );
}

/** Unfinished sessions. Capped so a long backlog does not keep growing the page. */
export default function ResumeList({ sessions, titles }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? sessions : sessions.slice(0, VISIBLE);
  return (
    <>
      <ul className="grid gap-2 lg:grid-cols-2">
        {visible.map((session) => (
          <li key={session.id}>
            <ResumeRow session={session} title={titles.get(session.group_id)} />
          </li>
        ))}
      </ul>
      {sessions.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className={cn(
            FOCUS_RING,
            'mt-3 rounded-md text-xs font-semibold text-[#5a63df] hover:underline dark:text-[#afb5ff]'
          )}
        >
          {showAll ? 'Show fewer' : `Show all ${sessions.length}`}
        </button>
      )}
    </>
  );
}
