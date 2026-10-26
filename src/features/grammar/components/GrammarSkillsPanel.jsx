import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import { MUTED, PILL_BASE, pillTone } from '@/features/dashboard/components/primitives';
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
  const navigate = useNavigate();
  const isPaid = Boolean(access?.isPaid);
  const dailyRemaining = Number(access?.dailyRemaining || 0);
  const noAllowance = !isPaid && dailyRemaining <= 0;

  const subtitleCopy = () => {
    if (shouldDiagnose) {
      if (noAllowance) {
        return 'Start with the 24-question level check above, or unlock unlimited practice with Pro.';
      }
      return 'Take the level check first, or tap any skill below for five practice questions.';
    }
    if (noAllowance) {
      return 'Daily free practice limit reached (5/5). Resets at midnight, or upgrade to Pro for unlimited practice.';
    }
    return 'Tap a skill for five practice questions. The badge shows how many answers the result is based on.';
  };

  return (
    <div id="grammar-skills" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Six grammar skills
            </h2>
            {noAllowance ? (
              <Link
                to="/pricing"
                className={cn(
                  PILL_BASE,
                  pillTone('amber'),
                  'transition-all duration-150 hover:border-amber-500/50 hover:bg-amber-500/[0.12] active:scale-95 cursor-pointer'
                )}
                title="Your 5 free daily questions are used. Unlock unlimited practice with Pro."
              >
                <LockKeyhole className="h-2.5 w-2.5 shrink-0" />
                <span>Daily limit reached</span>
                <span className="opacity-40">·</span>
                <span className="hover:underline">Upgrade</span>
              </Link>
            ) : !isPaid ? (
              <span className={cn(PILL_BASE, pillTone('accent'))}>
                <Sparkles className="h-2.5 w-2.5 shrink-0 text-[#5a63df]" />
                <span>{dailyRemaining} of 5 free today</span>
              </span>
            ) : (
              <span className={cn(PILL_BASE, pillTone('ok'))}>
                <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                <span>Pro unlimited</span>
              </span>
            )}
          </div>
          <p className={cn('mt-1 text-xs font-medium', MUTED)}>{subtitleCopy()}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (noAllowance) {
              navigate('/pricing');
              return;
            }
            onStart({ mode: 'review', targetSkills: null, questionCount: 5 });
          }}
          disabled={isStarting || !dueReviews}
          className="cursor-pointer rounded-lg border border-[#e2e5f2] px-3 py-2 text-[11px] sm:py-1.5 font-bold text-slate-600 transition hover:border-[#c9cdf3] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
        >
          Review missed items
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

          const handleSkillClick = () => {
            if (isStarting) return;
            if (noAllowance) {
              navigate('/pricing');
              return;
            }
            onStart({
              mode: skill.isDue ? 'review' : 'practice',
              targetSkills: [skill.skillCode],
              questionCount: 5,
            });
          };

          return (
            <button
              key={skill.skillCode}
              type="button"
              onClick={handleSkillClick}
              disabled={isStarting}
              aria-label={
                noAllowance
                  ? `${skill.label}: daily practice limit reached. Click to view upgrade plans.`
                  : `Practise ${skill.label} (5 questions)`
              }
              className={cn(
                'group flex min-h-[108px] cursor-pointer items-center gap-3 rounded-xl border bg-linear-to-br/srgb p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] dark:bg-white/2.5',
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
                  {noAllowance ? (
                    <span
                      title="Daily limit reached · Click to upgrade"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors group-hover:text-amber-600 dark:text-slate-500 dark:group-hover:text-amber-400"
                    >
                      <LockKeyhole className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#5a63df]" />
                  )}
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
                  <div className="mt-2 text-[10px] font-semibold leading-4 text-slate-400 dark:text-slate-500">
                    Not practised yet
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
                      {skill.correctCount} of {skill.observations} correct ({accuracy}%)
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
