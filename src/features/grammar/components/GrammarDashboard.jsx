import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  Headphones,
  LockKeyhole,
  Mic2,
  RefreshCw,
  Route,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import GrammarEvidenceBadge from './GrammarEvidenceBadge';
import { skillLabel } from '../constants';

const surface =
  'rounded-2xl border border-[#e7e9f5] bg-white shadow-[0_12px_35px_-28px_rgba(54,65,130,0.45)] dark:border-white/10 dark:bg-[#10131f]';

function allowanceCopy(access) {
  if (access?.isPaid) return 'Unlimited deterministic practice';
  return `${access?.dailyRemaining ?? 0} of 5 questions remaining today`;
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
  onStart,
  onOpenResource,
}) {
  const access = dashboard?.access || {};
  const skills = dashboard?.skills || [];
  const criterionEvidence = dashboard?.criterionEvidence || [];
  const recommended = skills.find((skill) => skill.skillCode === defaultSkill) || recommendedSkill;
  const shouldDiagnose =
    defaultMode === 'diagnostic' ||
    criterionDiagnosticNeeded ||
    !skills.some((skill) => skill.observations > 0);
  const primaryMode = defaultMode || (shouldDiagnose ? 'diagnostic' : 'practice');
  const dailyLimitReached =
    !access.isPaid &&
    Number(access.dailyRemaining || 0) <= 0 &&
    ['practice', 'review'].includes(primaryMode);
  const primaryTitle =
    primaryMode === 'review'
      ? 'Review grammar that is due'
      : primaryMode === 'transfer'
        ? 'Apply grammar in IELTS production'
        : shouldDiagnose
          ? 'Build your six-skill baseline'
          : `Repair ${String(recommended?.label || skillLabel(recommended?.skillCode)).toLowerCase()}`;
  const primaryDescription =
    primaryMode === 'transfer'
      ? 'Use a short Academic Writing paragraph or an existing Speaking transcript.'
      : shouldDiagnose
        ? 'Complete 24 IELTS-context questions—four from each grammar family. Feedback appears after completion.'
        : `Use ${recommended?.observations || 0} observations to target one measured or tentative practice priority.`;

  return (
    <div className="space-y-5">
      <section
        className={cn(
          surface,
          'overflow-hidden bg-[linear-gradient(110deg,#ffffff_0%,#ffffff_62%,#f0f2ff_100%)] p-5 dark:bg-[linear-gradient(110deg,#10131f_0%,#10131f_60%,#171a35_100%)] sm:p-6'
        )}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#dfe3ff] bg-[#f1f3ff] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5058d9] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
                Today’s grammar plan
              </span>
              {dashboard?.dueReviews > 0 && (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {dashboard.dueReviews} review{dashboard.dueReviews === 1 ? '' : 's'} due
                </span>
              )}
            </div>
            <h2 className="max-w-3xl text-2xl font-extrabold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
              {primaryTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              {primaryDescription}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  onStart({
                    mode: primaryMode,
                    targetSkills:
                      primaryMode === 'diagnostic' || !recommended?.skillCode
                        ? null
                        : [recommended.skillCode],
                    questionCount: primaryMode === 'diagnostic' ? 24 : 5,
                  })
                }
                disabled={
                  isStarting ||
                  dailyLimitReached ||
                  (primaryMode === 'diagnostic' && !access.diagnosticAvailable)
                }
                className="h-11 rounded-xl bg-[#5661e9] px-5 font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(76,87,225,0.8)] hover:bg-[#4853d6]"
              >
                {isStarting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : primaryMode === 'diagnostic' ? (
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {primaryMode === 'diagnostic'
                  ? access.diagnosticAvailable
                    ? 'Start diagnostic'
                    : 'Diagnostic used this month'
                  : dailyLimitReached
                    ? 'Daily practice used'
                    : primaryMode === 'transfer'
                      ? 'Open transfer task'
                      : primaryMode === 'review'
                        ? 'Start due review'
                        : 'Start 5-question repair'}
              </Button>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                {access.isPaid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <LockKeyhole className="h-4 w-4 text-[#6670e8]" />
                )}
                {allowanceCopy(access)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe3fa] bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf0ff] text-[#5661e9] dark:bg-indigo-400/10 dark:text-indigo-200">
                <Route className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5963d9]">
                  Learning Path
                </div>
                <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  Repair, then transfer
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
              Grammar stays a supporting skill. After focused repair, apply it in Writing or
              Speaking before adding more drills.
            </p>
            <Link
              to="/learning-path"
              className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#505bdd] hover:text-[#3f49c7]"
            >
              View Learning Path <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className={cn(surface, 'p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
                Six grammar families
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Evidence classes use the same thresholds as Analytics and Learning Path.
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
              className="rounded-lg border border-[#e1e4f3] px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[#cdd2f6] hover:text-[#505bdd] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
            >
              Review due items
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => {
              const accuracy =
                skill.observations > 0
                  ? Math.round((skill.correctCount / skill.observations) * 100)
                  : 0;
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
                    'group rounded-xl border bg-[#fcfcff] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#cfd4fa] hover:shadow-[0_12px_24px_-20px_rgba(59,70,150,0.7)] dark:bg-white/[0.025]',
                    isRecommended
                      ? 'border-[#aeb5ff] ring-2 ring-[#6972ee]/10 dark:border-indigo-400/40'
                      : 'border-[#eceefa] dark:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                        {skill.label}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <GrammarEvidenceBadge
                          evidenceClass={skill.evidenceClass}
                          observations={skill.observations}
                          compact
                        />
                        {skill.isDue && (
                          <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-200">
                            Due
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
                  </div>
                  <Progress
                    aria-label={`${skill.label} practice accuracy`}
                    value={skill.observations ? accuracy : 0}
                    className="mt-3 h-1.5 bg-[#eceef8]"
                    indicatorClassName={cn(
                      skill.evidenceClass === 'measured'
                        ? 'bg-emerald-500'
                        : skill.evidenceClass === 'early'
                          ? 'bg-amber-400'
                          : 'bg-slate-300'
                    )}
                  />
                  <div className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {skill.observations
                      ? `${skill.correctCount} correct from ${skill.observations}`
                      : 'Complete the diagnostic to establish evidence'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn(surface, 'p-5')}>
          <h2 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
            Writing & Speaking evidence
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Criterion evidence can request a diagnostic, but cannot name a grammar family.
          </p>
          <div className="mt-4 space-y-3">
            {criterionEvidence.length ? (
              criterionEvidence.map((signal) => {
                const Icon = criterionIcon(signal.source);
                return (
                  <div
                    key={signal.skillCode}
                    className="rounded-xl border border-[#eceefa] bg-[#fcfcff] p-3.5 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          signal.source === 'speaking'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300'
                            : 'bg-[#edf0ff] text-[#5661e9] dark:bg-indigo-400/10 dark:text-indigo-200'
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
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
              <div className="rounded-xl border border-dashed border-[#dfe2f1] p-4 text-xs font-medium leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                No criterion evidence is available yet. Complete scored Writing or Speaking practice
                to add provenance-backed signals.
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

      <section className={cn(surface, 'p-5')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white">
              IELTS grammar guides
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Short rules, Task 1 and Task 2 patterns, Speaking transfer, and a final check.
            </p>
          </div>
          <BookOpen className="h-5 w-5 text-[#6670e8]" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(dashboard?.resources || []).map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => onOpenResource(resource)}
              className="group flex min-h-28 flex-col justify-between rounded-xl border border-[#eceefa] bg-[#fcfcff] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#cfd4fa] dark:border-white/10 dark:bg-white/[0.025]"
            >
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#5c66dc]">
                  {skillLabel(resource.skill_code)}
                </div>
                <div className="mt-1.5 text-sm font-extrabold leading-5 text-slate-900 dark:text-white">
                  {resource.title}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>{resource.estimated_minutes} min guide</span>
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
