import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, NUM, WELL } from '@/features/dashboard/components/primitives.jsx';
import { focusLabel } from '../../practiceLabels';
import { resultLink, resultNotes } from '../../practiceResultRows';
import { date, focusRing, subject } from './SourceSetPicker';

function ResultRow({ row }) {
  const notes = resultNotes(row);
  return (
    <li>
      <Link
        to={resultLink(row)}
        className={cn(
          WELL,
          focusRing,
          'group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#ecebf8] dark:hover:bg-white/[0.07]'
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold">
            {row.title || 'Untitled test'}
          </span>
          <span className={`block text-[11px] ${MUTED}`}>
            {subject(row.focus)} · {focusLabel(row.focus)} ·{' '}
            {row.practice ? 'Practice set' : 'Full test'} · {date(row.completedAt)}
          </span>
          {notes.length > 0 && (
            <span className={`block text-[11px] font-semibold ${MUTED}`}>{notes.join('. ')}</span>
          )}
        </span>
        <strong className={cn(NUM, 'shrink-0 text-xs')}>
          {row.correct} of {row.total} correct
        </strong>
        <ArrowRight size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
      </Link>
    </li>
  );
}

/** Past results, each opening the saved answers. */
export default function ResultList({ rows, label, className }) {
  return (
    <ul aria-label={label} className={cn('space-y-1.5', className)}>
      {rows.map((row, index) => (
        <ResultRow key={`${row.focus}-${row.sessionId}-${index}`} row={row} />
      ))}
    </ul>
  );
}
