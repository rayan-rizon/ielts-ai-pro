import { useMemo } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Target,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';
import GrammarAttempt from '../components/GrammarAttempt';
import GrammarDashboard from '../components/GrammarDashboard';
import GrammarGuidePage from '../components/GrammarGuidePage';
import GrammarResults from '../components/GrammarResults';
import GrammarTransfer from '../components/GrammarTransfer';
import { useGrammarLab } from '../hooks/useGrammarLab';

function HeaderMetric({ icon: Icon, value, label, tone, href, onClick, disabled = false }) {
  const tones = {
    indigo: 'bg-[#efedff] text-[#5a63df]',
    emerald: 'bg-[#eaf9f1] text-[#159669]',
    orange: 'bg-[#fff1e7] text-[#df7437]',
  };
  const content = (
    <>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-black leading-none text-slate-950 dark:text-white">
          {value}
        </span>
        <span className="mt-1 block whitespace-nowrap text-[10px] font-bold text-slate-500">
          {label}
        </span>
      </span>
    </>
  );
  const className =
    'flex min-w-[102px] items-center gap-2 rounded-2xl border border-[#e2e5f2] bg-white px-2.5 py-2 shadow-[0_14px_30px_-26px_rgba(43,53,128,0.9)] transition hover:-translate-y-0.5 hover:border-[#cfd4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6972e8] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-[#10131f] dark:hover:bg-white/5';

  return href ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

function GrammarHeaderStats({ dashboard, isStarting, onReview }) {
  const skills = dashboard?.skills || [];
  const observations = skills.reduce((total, skill) => total + Number(skill.observations || 0), 0);
  const correct = skills.reduce((total, skill) => total + Number(skill.correctCount || 0), 0);
  const accuracy = observations ? `${Math.round((correct / observations) * 100)}%` : '—';
  const reviews = Number(dashboard?.dueReviews || 0);
  const reviewUnavailable =
    !reviews ||
    isStarting ||
    (!dashboard?.access?.isPaid && Number(dashboard?.access?.dailyRemaining || 0) <= 0);

  return (
    <div
      aria-label="Grammar practice summary"
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <HeaderMetric
        icon={Target}
        value={observations}
        label="Practised"
        tone="indigo"
        href="#grammar-skills"
      />
      <HeaderMetric
        icon={CheckCircle2}
        value={accuracy}
        label="Accuracy"
        tone="emerald"
        href="#grammar-evidence"
      />
      <HeaderMetric
        icon={RotateCcw}
        value={reviews}
        label="Reviews due"
        tone="orange"
        onClick={onReview}
        disabled={reviewUnavailable}
      />
    </div>
  );
}

export default function GrammarLab() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guideSlug } = useParams();
  const grammar = useGrammarLab();
  const requestedMode = searchParams.get('mode');
  const requestedSkill = searchParams.get('skill');
  const requestedActivityId = searchParams.get('activityId');
  const requestedTransfer = searchParams.get('transfer');
  const screen = guideSlug
    ? 'guide'
    : grammar.result
      ? 'result'
      : requestedMode === 'transfer'
        ? 'transfer'
        : grammar.activeAttempt
          ? 'attempt'
          : 'dashboard';

  const recommendedSkill = useMemo(() => {
    return (
      grammar.dashboard?.skills?.find((skill) => skill.skillCode === requestedSkill) ||
      grammar.recommendedSkill
    );
  }, [grammar.dashboard?.skills, grammar.recommendedSkill, requestedSkill]);
  const selectedGuide = useMemo(
    () => grammar.dashboard?.resources?.find((resource) => resource.slug === guideSlug) || null,
    [grammar.dashboard?.resources, guideSlug]
  );

  const startAttempt = async (options) => {
    const data = await grammar.startAttempt({
      ...options,
      learningPathActivityId: requestedActivityId || undefined,
    });
    if (options.mode !== 'transfer') {
      const next = new URLSearchParams(searchParams);
      next.set('mode', options.mode);
      if (options.targetSkills?.[0]) next.set('skill', options.targetSkills[0]);
      navigate(`/grammar?${next.toString()}`, { replace: true });
    }
    return data;
  };

  const showDashboard = () => {
    grammar.setActiveAttempt(null);
    grammar.setResult(null);
    navigate('/grammar', { replace: true });
  };

  const showTransfer = () => {
    grammar.setActiveAttempt(null);
    grammar.setResult(null);
    const next = new URLSearchParams();
    next.set('mode', 'transfer');
    if (recommendedSkill?.skillCode) next.set('skill', recommendedSkill.skillCode);
    navigate(`/grammar?${next.toString()}`);
  };

  return (
    <>
      <DocumentHead
        title="IELTS Grammar Lab | IELTS Ai Pro"
        description="Practice grammar through Academic IELTS Writing and Speaking contexts, then connect measured evidence to your Learning Path."
      />
      <main className="min-h-full bg-[radial-gradient(circle_at_78%_0%,rgba(226,222,255,0.36),transparent_32%),#f8f9fc] px-3 py-4 pt-16 text-slate-950 dark:bg-[#070913] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5">
        <div className="mx-auto max-w-[1440px]">
          {screen === 'dashboard' && (
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#5963d9]">
                  <BookOpenCheck className="h-4 w-4" />
                  Learning tool
                </div>
                <h1 className="text-3xl font-black leading-none tracking-tight text-slate-900 dark:text-white sm:text-4xl sm:leading-tight">
                  Grammar Lab
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Build accurate grammar for Academic IELTS Writing and Speaking
                </p>
              </div>
              <GrammarHeaderStats
                dashboard={grammar.dashboard}
                isStarting={grammar.isStarting}
                onReview={() =>
                  startAttempt({ mode: 'review', targetSkills: null, questionCount: 5 })
                }
              />
            </header>
          )}

          {grammar.isLoading ? (
            <div className="space-y-4" aria-label="Loading Grammar Lab">
              <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-white/5" />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-white/5" />
                <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-white/5" />
              </div>
            </div>
          ) : grammar.error ? (
            <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-400/20 dark:bg-[#10131f]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold">Grammar Lab data is unavailable</h2>
                  <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                    We could not load your Grammar evidence or practice library. Try again in a
                    moment; your existing test and Learning Path data are unaffected.
                  </p>
                  <Button
                    onClick={() => grammar.refetch()}
                    variant="outline"
                    className="mt-4 rounded-xl font-extrabold"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
                </div>
              </div>
            </section>
          ) : screen === 'guide' ? (
            <GrammarGuidePage
              resource={selectedGuide}
              isStarting={grammar.isStarting}
              onBack={showDashboard}
              onPractice={(skillCode) =>
                startAttempt({
                  mode: 'practice',
                  targetSkills: [skillCode],
                  questionCount: 5,
                })
              }
            />
          ) : screen === 'result' ? (
            <GrammarResults
              result={grammar.result}
              onDashboard={showDashboard}
              onPracticeAgain={() =>
                startAttempt({
                  mode: 'practice',
                  targetSkills: recommendedSkill?.skillCode ? [recommendedSkill.skillCode] : null,
                  questionCount: 5,
                })
              }
              onTransfer={showTransfer}
            />
          ) : screen === 'transfer' ? (
            <GrammarTransfer
              isPaid={grammar.isPaid}
              recommendedSkill={recommendedSkill}
              requestedTarget={requestedTransfer}
              recentSpeakingSessions={grammar.recentSpeakingSessions}
              isStarting={grammar.isStarting}
              isEvaluating={grammar.isEvaluating}
              onStart={startAttempt}
              onEvaluate={grammar.evaluateTransfer}
              onExit={showDashboard}
            />
          ) : screen === 'attempt' ? (
            <GrammarAttempt
              attemptData={grammar.activeAttempt}
              isSubmitting={grammar.isSubmitting}
              isCompleting={grammar.isCompleting}
              onSubmit={grammar.submitResponse}
              onComplete={grammar.completeAttempt}
              onExit={showDashboard}
            />
          ) : (
            <GrammarDashboard
              dashboard={grammar.dashboard}
              recommendedSkill={recommendedSkill}
              criterionDiagnosticNeeded={grammar.criterionDiagnosticNeeded}
              defaultMode={requestedMode}
              defaultSkill={requestedSkill}
              isStarting={grammar.isStarting}
              isResuming={grammar.isResuming}
              onStart={(options) =>
                options.mode === 'transfer' ? showTransfer() : startAttempt(options)
              }
              onResume={grammar.resumeAttempt}
            />
          )}
        </div>
      </main>
    </>
  );
}
