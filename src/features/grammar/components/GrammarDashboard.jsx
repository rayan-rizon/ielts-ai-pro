import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  Headphones,
  Languages,
  Link2,
  ListChecks,
  LockKeyhole,
  Mic2,
  RefreshCw,
  Sparkles,
  SpellCheck2,
  TextCursorInput,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';
import { skillLabel } from '../constants';

const surface =
  'rounded-3xl border border-[#e2e5f2] bg-white shadow-[0_18px_55px_-44px_rgba(48,58,128,0.68)] dark:border-white/10 dark:bg-[#10131f]';

const SKILL_VISUALS = {
  grammar_sentence_boundaries: {
    icon: TextCursorInput,
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-200',
    panelClass: 'from-[#fdfcff] to-[#f3efff]',
    cardClass: 'hover:border-violet-200',
  },
  grammar_verb_forms: {
    icon: SpellCheck2,
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-200',
    panelClass: 'from-[#fcfeff] to-[#edf5ff]',
    cardClass: 'hover:border-blue-200',
  },
  grammar_agreement_number: {
    icon: ListChecks,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200',
    panelClass: 'from-[#fcfffd] to-[#edf9f3]',
    cardClass: 'hover:border-emerald-200',
  },
  grammar_articles_determiners: {
    icon: Languages,
    iconClass: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-200',
    panelClass: 'from-[#fffefd] to-[#fff3e9]',
    cardClass: 'hover:border-orange-200',
  },
  grammar_clause_control: {
    icon: Link2,
    iconClass: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-200',
    panelClass: 'from-[#fcfeff] to-[#eaf8fb]',
    cardClass: 'hover:border-cyan-200',
  },
  grammar_word_forms: {
    icon: SpellCheck2,
    iconClass: 'bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-200',
    panelClass: 'from-[#fffdfd] to-[#fff0f8]',
    cardClass: 'hover:border-pink-200',
  },
};

function allowanceCopy(access) {
  if (access?.isPaid) return 'Unlimited practice';
  return `${access?.dailyRemaining ?? 0} of 5 free questions left today`;
}

function criterionIcon(source) {
  return source === 'speaking' ? Mic2 : FilePenLine;
}

export default function GrammarDashboard({
  dashboard,
  recommendedSkill,
  criterionDiagnosticNeeded,
  defaultMode,
  defaultSkill,
  isStarting,
  isResuming,
  onStart,
  onResume,
}) {
  const access = dashboard?.access || {};
  const skills = dashboard?.skills || [];
  const criterionEvidence = dashboard?.criterionEvidence || [];
  const recommended = skills.find((skill) => skill.skillCode === defaultSkill) || recommendedSkill;
  const inProgressAttempt = (dashboard?.recentAttempts || []).find(
    (attempt) => attempt.completionState === 'in_progress' && attempt.mode !== 'transfer'
  );
  const shouldDiagnose =
    defaultMode === 'diagnostic' ||
    criterionDiagnosticNeeded ||
    !skills.some((skill) => skill.observations > 0);
  const primaryMode = defaultMode || (shouldDiagnose ? 'diagnostic' : 'practice');
  const dailyLimitReached =
    !access.isPaid &&
    Number(access.dailyRemaining || 0) <= 0 &&
    ['practice', 'review'].includes(primaryMode);
  const primaryTitle = inProgressAttempt
    ? `Continue your ${String(inProgressAttempt.mode).toLowerCase()}`
    : primaryMode === 'review'
      ? 'Review what needs another look'
      : primaryMode === 'transfer'
        ? 'Apply grammar in IELTS production'
        : shouldDiagnose
          ? 'Build your six-skill baseline'
          : `Strengthen ${String(
              recommended?.label || skillLabel(recommended?.skillCode)
            ).toLowerCase()}`;
  const primaryDescription = inProgressAttempt
    ? `${inProgressAttempt.totalQuestions} IELTS-focused questions are already saved in this attempt. Pick up where you stopped without using another allowance.`
    : primaryMode === 'transfer'
      ? 'Use a short Academic Writing paragraph or an existing Speaking transcript.'
      : shouldDiagnose
        ? 'Answer 24 short questions across six grammar skills. Each one uses a realistic Writing or Speaking sentence.'
        : `Practise one useful pattern from ${
            recommended?.observations || 0
          } saved observations, then apply it in Writing or Speaking.`;

  const startPrimary = () => {
    if (inProgressAttempt) {
      onResume(inProgressAttempt.id);
      return;
    }
    onStart({
      mode: primaryMode,
      targetSkills:
        primaryMode === 'diagnostic' || !recommended?.skillCode ? null : [recommended.skillCode],
      questionCount: primaryMode === 'diagnostic' ? 24 : 5,
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <div
          className={cn(
            surface,
            'relative min-h-[286px] overflow-hidden bg-[#f4f1fb] px-6 py-7 sm:px-8 sm:py-9'
          )}
        >
          <img
            src="/images/grammar/grammar-lab-study-hero.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 hidden h-full w-full object-cover object-center md:block"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8f7fd_0%,rgba(248,247,253,0.98)_42%,rgba(248,247,253,0.18)_70%)] dark:bg-[linear-gradient(90deg,#11131f_0%,rgba(17,19,31,0.96)_44%,rgba(17,19,31,0.25)_76%)]" />
          <div className="relative max-w-[570px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#dfe3ff] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5058d9] backdrop-blur">
                Today’s grammar plan
              </span>
              {dashboard?.dueReviews > 0 && (
                <span className="text-xs font-extrabold text-orange-700">
                  {dashboard.dueReviews} review{dashboard.dueReviews === 1 ? '' : 's'} due
                </span>
              )}
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-[36px] sm:leading-[1.08] dark:text-white">
              {primaryTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              {primaryDescription}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={startPrimary}
                disabled={
                  isStarting ||
                  isResuming ||
                  (!inProgressAttempt &&
                    (dailyLimitReached ||
                      (primaryMode === 'diagnostic' && !access.diagnosticAvailable)))
                }
                className="h-11 rounded-xl bg-[#5661e9] px-5 font-extrabold text-white shadow-[0_12px_24px_-14px_rgba(76,87,225,0.9)] hover:bg-[#4853d6]"
              >
                {isStarting || isResuming ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : inProgressAttempt ? (
                  <ArrowRight className="mr-2 h-4 w-4" />
                ) : primaryMode === 'diagnostic' ? (
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {inProgressAttempt
                  ? 'Resume attempt'
                  : primaryMode === 'diagnostic'
                    ? access.diagnosticAvailable
                      ? 'Start diagnostic'
                      : 'Diagnostic used this month'
                    : dailyLimitReached
                      ? 'Daily practice used'
                      : primaryMode === 'review'
                        ? 'Start review'
                        : 'Start 5-question practice'}
              </Button>
              <div className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-bold text-slate-600 backdrop-blur dark:bg-white/5 dark:text-slate-300">
                {access.isPaid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <LockKeyhole className="h-4 w-4 text-[#6670e8]" />
                )}
                {allowanceCopy(access)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
        <div id="grammar-skills" className={cn(surface, 'scroll-mt-6 p-5 sm:p-6')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Six grammar skills
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Each result shows how much evidence it is based on.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStart({ mode: 'review', targetSkills: null, questionCount: 5 })}
              disabled={
                isStarting ||
                !dashboard?.dueReviews ||
                (!access.isPaid && Number(access.dailyRemaining || 0) <= 0)
              }
              className="rounded-xl border border-[#e1e4f3] px-3 py-2 text-xs font-extrabold text-slate-600 transition hover:border-[#cdd2f6] hover:text-[#505bdd] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
            >
              Review due items
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => {
              const visual = SKILL_VISUALS[skill.skillCode] || SKILL_VISUALS.grammar_word_forms;
              const Icon = visual.icon;
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
                  disabled={
                    isStarting || (!access.isPaid && Number(access.dailyRemaining || 0) <= 0)
                  }
                  className={cn(
                    'group rounded-2xl border bg-gradient-to-br p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] dark:bg-white/[0.025]',
                    visual.panelClass,
                    visual.cardClass,
                    isRecommended
                      ? 'border-[#aeb5ff] ring-2 ring-[#6972ee]/10 dark:border-indigo-400/40'
                      : 'border-[#eaecf6] dark:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl',
                        visual.iconClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="mt-2 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                    {skill.label}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <GrammarEvidenceBadge
                      evidenceClass={skill.evidenceClass}
                      observations={skill.observations}
                      compact
                    />
                    {skill.isDue && (
                      <span className="text-[10px] font-extrabold text-orange-700 dark:text-orange-200">
                        Due
                      </span>
                    )}
                  </div>
                  {accuracy === null ? (
                    <div className="mt-4 text-[11px] font-semibold leading-4 text-slate-400">
                      Start with a short baseline
                    </div>
                  ) : (
                    <>
                      <Progress
                        aria-label={`${skill.label} practice accuracy`}
                        value={accuracy}
                        className="mt-4 h-1.5 bg-[#eceef8]"
                        indicatorClassName={
                          skill.evidenceClass === 'measured' ? 'bg-emerald-500' : 'bg-[#6972e8]'
                        }
                      />
                      <div className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {accuracy}% · {skill.correctCount} of {skill.observations} correct
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="grammar-evidence"
          className={cn(
            surface,
            'scroll-mt-6 bg-[linear-gradient(160deg,#ffffff_55%,#f7f5ff_100%)] p-5 sm:p-6'
          )}
        >
          <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
            Writing & Speaking evidence
          </h2>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
            A criterion result can recommend a diagnostic, but it cannot guess a specific grammar
            skill.
          </p>
          <div className="mt-4 space-y-3">
            {criterionEvidence.length ? (
              criterionEvidence.map((signal) => {
                const Icon = criterionIcon(signal.source);
                return (
                  <div
                    key={signal.skillCode}
                    className="rounded-2xl border border-[#e8e8f7] bg-white/90 p-4 shadow-[0_12px_26px_-25px_rgba(63,70,151,0.75)] dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                          signal.source === 'speaking'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-[#edf0ff] text-[#5661e9]'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-extrabold capitalize text-slate-900 dark:text-white">
                            {signal.source} grammar
                          </div>
                          <GrammarEvidenceBadge
                            evidenceClass={signal.evidenceClass}
                            observations={signal.observations}
                            compact
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
                          {signal.provenance}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#dfe2f1] p-4 text-xs font-medium leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                Complete scored Writing or Speaking practice to add criterion evidence here.
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/writing"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#e3e6f5] bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-[#cfd4fa] hover:text-[#505bdd] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200"
            >
              <FilePenLine className="h-4 w-4" /> Writing
            </Link>
            <Link
              to="/speaking"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#e3e6f5] bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-[#cfd4fa] hover:text-[#505bdd] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200"
            >
              <Headphones className="h-4 w-4" /> Speaking
            </Link>
          </div>
        </div>
      </section>

      <section id="grammar-guides" className={cn(surface, 'scroll-mt-6 p-5 sm:p-6')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
              IELTS grammar guides
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Learn one rule, see it in IELTS, then try a short practice set.
            </p>
          </div>
          <BookOpenText className="h-5 w-5 text-[#6670e8]" />
        </div>

        {dashboard?.resourcesUnavailable ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#dfe2f1] p-4 text-xs font-medium text-slate-500">
            Guides are temporarily unavailable. Your practice and evidence are still ready.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {(dashboard?.resources || []).map((resource) => {
              const visual = SKILL_VISUALS[resource.skill_code] || SKILL_VISUALS.grammar_word_forms;
              const Icon = visual.icon;
              return (
                <Link
                  key={resource.id}
                  to={`/grammar/guides/${resource.slug}`}
                  className={cn(
                    'group flex min-h-36 flex-col justify-between rounded-2xl border border-[#eceafa] bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] dark:border-white/10 dark:bg-white/[0.025]',
                    visual.panelClass,
                    visual.cardClass
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl',
                        visual.iconClass
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#5c66dc]">
                      {skillLabel(resource.skill_code)}
                    </div>
                    <div className="mt-1 text-sm font-extrabold leading-5 text-slate-900 dark:text-white">
                      {resource.title}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{resource.estimated_minutes} min</span>
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
