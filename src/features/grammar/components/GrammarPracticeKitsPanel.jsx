import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Layers3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { GRAMMAR_GUIDE_KITS, getGrammarGuide } from '../data/grammarGuideCatalog';
import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import ContentStatusBadge from '@/features/subscription/components/ContentStatusBadge';
import { MUTED, Pill } from '@/features/dashboard/components/primitives';

const KIT_TONES = {
  violet: {
    panel:
      'border-violet-200/80 from-violet-50/70 to-white dark:border-violet-400/15 hover:border-violet-300',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  },
  blue: {
    panel:
      'border-blue-200/80 from-blue-50/70 to-white dark:border-blue-400/15 hover:border-blue-300',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  },
  emerald: {
    panel:
      'border-emerald-200/80 from-emerald-50/70 to-white dark:border-emerald-400/15 hover:border-emerald-300',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  amber: {
    panel:
      'border-amber-200/80 from-amber-50/70 to-white dark:border-amber-400/15 hover:border-amber-300',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  },
};

function hasCompletedPractice(kit, completedPracticeSkillSets) {
  const target = [...kit.skills].sort().join('|');
  return completedPracticeSkillSets.some((skills) => [...skills].sort().join('|') === target);
}

export default function GrammarPracticeKitsPanel({
  access,
  isStarting,
  onStart,
  user,
  completedPracticeSkillSets = [],
}) {
  const noAllowance = !access?.isPaid && Number(access?.dailyRemaining || 0) <= 0;

  return (
    <section id="grammar-practice-kits" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df]">
            <Layers3 className="h-3.5 w-3.5" />
            Guided practice
          </div>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            IELTS grammar practice kits
          </h2>
          <p className={cn('mt-1 max-w-2xl text-xs font-medium leading-5', MUTED)}>
            Read the linked units, then launch a five-question set drawn from the same measured
            Grammar Lab skills.
          </p>
        </div>
        <Pill tone="ok">
          <CheckCircle2 className="h-3 w-3" />
          Results update your Grammar progress
        </Pill>
      </div>

      <div className="mt-3.5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {GRAMMAR_GUIDE_KITS.map((kit) => {
          const tone = KIT_TONES[kit.tone] || KIT_TONES.violet;
          const firstGuide = getGrammarGuide(kit.guideSlugs[0]);
          const isLocked = !hasContentAccess(user, kit.access_tier);
          const isCompleted = hasCompletedPractice(kit, completedPracticeSkillSets);
          return (
            <article
              key={kit.slug}
              className={cn(
                'group relative flex min-h-[175px] flex-col overflow-hidden rounded-xl border bg-linear-to-br/srgb p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:from-white/2.5 dark:to-white/1',
                tone.panel
              )}
            >
              <div className="relative flex items-start justify-between gap-2.5">
                <div
                  className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tone.icon)}
                >
                  <BookOpenCheck className="h-4.5 w-4.5" />
                </div>
                <ContentStatusBadge
                  user={user}
                  requiredTier={kit.access_tier}
                  completed={isCompleted}
                />
              </div>
              <h3 className="relative mt-2.5 text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                {kit.title}
              </h3>
              <p className="relative mt-1 line-clamp-2 text-[11px] font-medium leading-[1.35] text-slate-600 dark:text-slate-300">
                {kit.description}
              </p>
              <div className="relative mt-2 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Layers3 className="h-3.5 w-3.5 text-slate-400" /> {kit.guideCount} units
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" /> {kit.minutes} min reading
                </span>
              </div>
              <div className="relative mt-3 grid grid-cols-2 gap-2 pt-1">
                <Link
                  to={isLocked ? '/pricing' : `/grammar/guides/${firstGuide.slug}`}
                  aria-label={isLocked ? `Unlock ${kit.title}` : `Start ${kit.title} guide`}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e2e5f2] bg-white/90 px-2.5 text-[10px] font-bold text-slate-700 transition hover:border-[#c9cdf3] hover:bg-slate-50 hover:text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {isLocked ? 'Unlock' : 'Start guide'}
                </Link>
                <button
                  type="button"
                  aria-label={`Practise ${kit.title}`}
                  onClick={() =>
                    onStart({
                      mode: 'practice',
                      targetSkills: kit.skills,
                      questionCount: 5,
                    })
                  }
                  disabled={isStarting || noAllowance || isLocked}
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-[#5a63df] px-2.5 text-[10px] font-bold text-white transition hover:bg-[#4a52c9] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isStarting ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isLocked ? 'Unlock' : 'Practise'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
