import { BookOpenText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { MUTED } from '@/features/dashboard/components/primitives';
import { getGuidesForSkill } from '../data/grammarGuideCatalog';
import { skillLabel } from '../constants';

/**
 * Chips that send a learner from a missed question back to the units that teach
 * that skill. Practice sets are skill-wide, so every unit of the skill is listed.
 */
export default function ReviewLessons({ skillCode, newTab = false, className }) {
  const guides = getGuidesForSkill(skillCode);
  if (!guides.length) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className={cn('inline-flex items-center gap-1 text-[11px] font-extrabold', MUTED)}>
        <BookOpenText className="h-3.5 w-3.5" />
        Review {skillLabel(skillCode).toLowerCase()}:
      </span>
      {guides.map((guide) => (
        <Link
          key={guide.slug}
          to={`/grammar/guides/${guide.slug}`}
          {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="rounded-md border border-[#5a63df]/25 bg-white px-2 py-0.5 text-[11px] font-bold text-[#5a63df] transition hover:bg-[#5a63df]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-indigo-400/25 dark:bg-white/5 dark:text-indigo-300"
        >
          {guide.label}: {guide.title}
          {newTab && <span className="sr-only"> (opens in a new tab)</span>}
        </Link>
      ))}
    </div>
  );
}
