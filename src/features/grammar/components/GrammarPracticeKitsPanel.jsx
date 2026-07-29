import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Layers3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { GRAMMAR_GUIDE_KITS, getGrammarGuide } from '../data/grammarGuideCatalog';

const KIT_TONES = {
  violet: {
    panel: 'border-violet-100 from-violet-50 to-white dark:border-violet-400/15',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
  },
  blue: {
    panel: 'border-blue-100 from-blue-50 to-white dark:border-blue-400/15',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
  },
  emerald: {
    panel: 'border-emerald-100 from-emerald-50 to-white dark:border-emerald-400/15',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  amber: {
    panel: 'border-amber-100 from-amber-50 to-white dark:border-amber-400/15',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
  },
};

export default function GrammarPracticeKitsPanel({ access, isStarting, onStart }) {
  const noAllowance = !access?.isPaid && Number(access?.dailyRemaining || 0) <= 0;

  return (
    <section id="grammar-practice-kits" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5963d9]">
            <Layers3 className="h-3.5 w-3.5" />
            Guided practice
          </div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">
            IELTS grammar practice kits
          </h2>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
            Read the linked units, then launch a five-question set drawn from the same measured
            Grammar Lab skills.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5fb] px-3 py-1.5 text-[10px] font-extrabold text-slate-500 dark:bg-white/5 dark:text-slate-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Results update your Grammar progress
        </div>
      </div>

      <div className="mt-3.5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {GRAMMAR_GUIDE_KITS.map((kit) => {
          const tone = KIT_TONES[kit.tone] || KIT_TONES.violet;
          const firstGuide = getGrammarGuide(kit.guideSlugs[0]);
          return (
            <article
              key={kit.slug}
              className={cn(
                'group relative flex min-h-[175px] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 transition hover:-translate-y-0.5 dark:from-white/[0.035] dark:to-white/[0.015]',
                tone.panel
              )}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border-[18px] border-current opacity-[0.035]" />
              <div className="relative flex items-start justify-between gap-2.5">
                <div
                  className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tone.icon)}
                >
                  <BookOpenCheck className="h-4.5 w-4.5" />
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 shadow-2xs dark:bg-white/10 dark:text-slate-300">
                  {kit.eyebrow}
                </span>
              </div>
              <h3 className="relative mt-2.5 text-sm font-black tracking-tight text-slate-950 dark:text-white">
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
                  to={`/grammar/guides/${firstGuide.slug}`}
                  aria-label={`Start ${kit.title} guide`}
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-white/80 bg-white/80 px-2.5 text-[10px] font-extrabold text-slate-700 transition hover:border-[#cdd2f6] hover:text-[#505bdd] dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  Start guide
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
                  disabled={isStarting || noAllowance}
                  className="inline-flex h-8 items-center justify-center rounded-xl bg-[#5661e9] px-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#4853d6] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isStarting ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Practise
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
