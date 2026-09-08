import { ArrowRight, BookOpen, Check, Clock3, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  PANEL,
  WELL,
  MICRO,
  MUTED,
  NUM,
  Pill,
  IconChip,
} from '@/features/dashboard/components/primitives';

export default function RecommendedLesson({ lessons, busy, remaining, onStart }) {
  const [first, ...next] = lessons;
  if (!first) return null;
  return (
    <section aria-labelledby="recommendation-title" className={`${PANEL} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e2f0] px-5 py-4 dark:border-white/[0.07]">
        <div className="flex items-center gap-3">
          <IconChip icon={Target} tone="accent" />
          <div>
            <p className={`${MICRO} text-[#5a63df]`}>One useful next step</p>
            <h2 id="recommendation-title" className="mt-0.5 text-base font-semibold">
              Recommended for you
            </h2>
          </div>
        </div>
        <Link
          to="/learning-path"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5a63df] hover:underline"
        >
          View your learning path <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid lg:grid-cols-[1.6fr_1fr]">
        <article className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Pill tone="accent">{first.module}</Pill>
            <span className={`inline-flex items-center gap-1 text-xs ${MUTED}`}>
              <Clock3 size={13} />
              {first.estimated_minutes} min
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{first.title}</h3>
            <p className={`mt-2 max-w-xl text-sm leading-relaxed ${MUTED}`}>{first.outcome}</p>
          </div>
          <div className={`${WELL} rounded-lg border-l-2 border-[#5a63df] p-3`}>
            <p className={`${MICRO} mb-1`}>Why start here?</p>
            <p className="text-sm leading-relaxed">
              {first.reason ||
                'A useful starting point. Your answers will help us suggest what to practise next.'}
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-2" aria-label="Your lesson">
            {[
              [BookOpen, 'Learn the idea'],
              [Target, 'Try with help'],
              [Check, 'Try on your own'],
            ].map(([Icon, label], index) => (
              <li
                key={label}
                className="space-y-2 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]"
              >
                <span className={`flex items-center gap-2 text-xs ${MUTED}`}>
                  <Icon size={14} />
                  <span className={NUM}>0{index + 1}</span>
                </span>
                <p className="text-xs font-medium">{label}</p>
              </li>
            ))}
          </ol>
          <Button
            className="h-10 w-full bg-[#5a63df] text-white hover:bg-[#4c55cb] sm:w-auto"
            disabled={busy || remaining <= 0}
            onClick={() => onStart(first.skill)}
          >
            Start this lesson <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </article>
        <aside className="border-t border-[#e4e2f0] bg-[#f4f3fb]/50 p-5 lg:border-l lg:border-t-0 dark:border-white/[0.07] dark:bg-white/[0.02]">
          <p className={`${MICRO} mb-4`}>Other useful lessons</p>
          <div className="space-y-4">
            {next.map((lesson) => (
              <article
                key={lesson.skill}
                className="border-b border-[#e4e2f0] pb-4 last:border-0 dark:border-white/[0.07]"
              >
                <p className={`${MICRO} text-[#5a63df]`}>
                  {lesson.module} · {lesson.estimated_minutes} min
                </p>
                <h3 className="mt-2 text-sm font-semibold">{lesson.title}</h3>
                <p className={`mt-1 text-xs leading-relaxed ${MUTED}`}>
                  {lesson.reason || lesson.outcome}
                </p>
                <button
                  type="button"
                  disabled={busy || remaining <= 0}
                  onClick={() => onStart(lesson.skill)}
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded text-xs font-semibold text-[#5a63df] hover:underline disabled:opacity-50"
                >
                  Start learning <ArrowRight size={13} />
                </button>
              </article>
            ))}
          </div>
          <p className={`mt-4 text-xs leading-relaxed ${MUTED}`}>
            Recommendations use your saved results. A short practice result shows what to work on;
            it does not change your IELTS band.
          </p>
        </aside>
      </div>
    </section>
  );
}
