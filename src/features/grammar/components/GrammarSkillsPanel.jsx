import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import { MUTED } from '@/features/dashboard/components/primitives';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';
import SkillVisual from './SkillVisual';

const SKILL_VISUALS = {
  grammar_sentence_boundaries: {
    panelClass: 'from-[#fdfcff] to-[#f3efff] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-violet-200 dark:hover:border-violet-400/30',
  },
  grammar_verb_forms: {
    panelClass: 'from-[#fcfeff] to-[#edf5ff] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-blue-200 dark:hover:border-blue-400/30',
  },
  grammar_agreement_number: {
    panelClass: 'from-[#fcfffd] to-[#edf9f3] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-emerald-200 dark:hover:border-emerald-400/30',
  },
  grammar_articles_determiners: {
    panelClass: 'from-[#fffefd] to-[#fff3e9] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-orange-200 dark:hover:border-orange-400/30',
  },
  grammar_clause_control: {
    panelClass: 'from-[#fcfeff] to-[#eaf8fb] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-cyan-200 dark:hover:border-cyan-400/30',
  },
  grammar_word_forms: {
    panelClass: 'from-[#fffdfd] to-[#fff0f8] dark:from-[#131315] dark:to-[#131315]',
    cardClass: 'hover:border-pink-200 dark:hover:border-pink-400/30',
  },
};

/**
 * The six grammar skills grid with accuracy progress bars.
 * Extracted from GrammarDashboard to reduce its complexity.
 */
export default function GrammarSkillsPanel({
  skills,
  recommended,
  shouldDiagnose,
  access,
  isStarting,
  dueReviews,
  onStart,
}) {
  return (
    <div id="grammar-skills" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Six grammar skills
          </h2>
          <p className={cn('mt-1 text-xs font-medium', MUTED)}>
            Each result shows how much practice it is based on.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onStart({ mode: 'review', targetSkills: null, questionCount: 5 })}
          disabled={
            isStarting || !dueReviews || (!access.isPaid && Number(access.dailyRemaining || 0) <= 0)
          }
          className="rounded-lg border border-[#e2e5f2] px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#c9cdf3] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
        >
          Review due items
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {skills.map((skill) => {
          const visual = SKILL_VISUALS[skill.skillCode] || SKILL_VISUALS.grammar_word_forms;
          const accuracy =
            skill.observations > 0
              ? Math.round((skill.correctCount / skill.observations) * 100)
              : null;
          const isRecommended = skill.skillCode === recommended?.skillCode && !shouldDiagnose;
          return (
            <button
              key={skill.skillCode}
              type="button"
              onClick={() =>
                onStart({
                  mode: skill.isDue ? 'review' : 'practice',
                  targetSkills: [skill.skillCode],
                  questionCount: 5,
                })
              }
              disabled={isStarting || (!access.isPaid && Number(access.dailyRemaining || 0) <= 0)}
              className={cn(
                'group flex min-h-[108px] items-center gap-3 rounded-xl border bg-linear-to-br p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:bg-white/2.5',
                visual.panelClass,
                visual.cardClass,
                isRecommended
                  ? 'border-[#5a63df]/50 ring-2 ring-[#5a63df]/10 dark:border-indigo-400/40'
                  : 'border-[#eaecf6] dark:border-white/10'
              )}
            >
              <SkillVisual skillCode={skill.skillCode} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-extrabold leading-4 text-slate-900 dark:text-white">
                    {skill.label}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#5a63df]" />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <GrammarEvidenceBadge
                    evidenceClass={skill.evidenceClass}
                    observations={skill.observations}
                    compact
                  />
                  {skill.isDue && (
                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                      Due
                    </span>
                  )}
                </div>
                {accuracy === null ? (
                  <div className="mt-2 text-[10px] font-semibold leading-4 text-slate-400">
                    Start with a short baseline
                  </div>
                ) : (
                  <>
                    <Progress
                      aria-label={`${skill.label} practice accuracy`}
                      value={accuracy}
                      className="mt-2 h-1.5 bg-[#eceef8]"
                      indicatorClassName={
                        skill.evidenceClass === 'measured' ? 'bg-emerald-500' : 'bg-[#5a63df]'
                      }
                    />
                    <div className="mt-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {accuracy}% · {skill.correctCount} of {skill.observations} correct
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
