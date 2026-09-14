import { useEffect, useMemo, useRef } from 'react';
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
import { cn } from '@/lib/cn';
import DocumentHead from '@/components/shared/DocumentHead';
import GrammarAttempt from '../components/GrammarAttempt';
import GrammarDashboard from '../components/GrammarDashboard';
import GrammarGuidePage from '../components/GrammarGuidePage';
import GrammarResults from '../components/GrammarResults';
import { getGrammarGuide } from '../data/grammarGuideCatalog';
import { useGrammarLab } from '../hooks/useGrammarLab';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
} from '@/features/dashboard/components/primitives';

function HeaderMetric({ icon: Icon, value, label, tone, href, onClick, disabled = false }) {
  const content = (
    <>
      <IconChip icon={Icon} tone={tone} />
      <span className="min-w-0 text-left">
        <span
          className={cn(
            NUM,
            'block text-sm font-extrabold leading-none text-slate-900 dark:text-white'
          )}
        >
          {value}
        </span>
        <span className={cn(MICRO, MUTED, 'mt-1 block whitespace-nowrap')}>{label}</span>
      </span>
    </>
  );
  const className = cn(
    PANEL,
    'flex min-w-[102px] items-center gap-2 px-2.5 py-2 transition-all duration-200 ease-smooth-out hover:border-[#5a63df]/35 hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] dark:hover:border-[#8f97ff]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0'
  );

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
        tone="accent"
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
        tone="amber"
        onClick={onReview}
        disabled={reviewUnavailable}
      />
    </div>
  );
}

function scrollGrammarPageToTop(pageElement) {
  let scrollParent = pageElement?.parentElement;
  while (scrollParent) {
    const { overflowY } = window.getComputedStyle(scrollParent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      scrollParent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }
    scrollParent = scrollParent.parentElement;
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export default function GrammarLab() {
  const pageTopRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guideSlug } = useParams();
  const grammar = useGrammarLab();
  const rawRequestedMode = searchParams.get('mode');
  const requestedMode = ['diagnostic', 'practice', 'review'].includes(rawRequestedMode)
    ? rawRequestedMode
    : null;
  const requestedSkill = searchParams.get('skill');
  const requestedActivityId = searchParams.get('activityId');
  const screen = guideSlug
    ? 'guide'
    : grammar.result
      ? 'result'
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
    () =>
      getGrammarGuide(guideSlug) ||
      grammar.dashboard?.resources?.find((resource) => resource.slug === guideSlug),
    [grammar.dashboard?.resources, guideSlug]
  );

  useEffect(() => {
    if (rawRequestedMode === 'transfer') {
      navigate('/grammar', { replace: true });
    }
  }, [navigate, rawRequestedMode]);

  useEffect(() => {
    scrollGrammarPageToTop(pageTopRef.current);
    const frame = window.requestAnimationFrame(() => scrollGrammarPageToTop(pageTopRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [guideSlug, screen]);

  const startAttempt = async (options) => {
    const data = await grammar.startAttempt({
      ...options,
      learningPathActivityId: requestedActivityId || undefined,
    });
    const next = new URLSearchParams(searchParams);
    next.set('mode', options.mode);
    if (options.targetSkills?.[0]) next.set('skill', options.targetSkills[0]);
    navigate(`/grammar?${next.toString()}`, { replace: true });
    return data;
  };

  const showDashboard = () => {
    grammar.setActiveAttempt(null);
    grammar.setResult(null);
    navigate('/grammar', { replace: true });
  };

  const showRetest = (target = 'writing') => {
    navigate(target === 'speaking' ? '/speaking?mode=practice' : '/writing?mode=practice');
  };

  return (
    <>
      <DocumentHead
        title="IELTS Grammar Lab | IELTS Ai Pro"
        description="Practice grammar through Academic IELTS Writing and Speaking contexts, then connect measured evidence to your Learning Path."
      />
      <main
        ref={pageTopRef}
        className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 pt-16 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 sm:pt-4 md:px-5 md:py-5"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div className="relative z-10 mx-auto max-w-[1440px]">
          {screen === 'dashboard' && (
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Pill tone="accent">
                  <BookOpenCheck className="h-3 w-3" />
                  Learning tool
                </Pill>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Grammar Lab
                </h1>
                <p className={cn('mt-1 text-sm font-medium', MUTED)}>
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
            <div className="space-y-3" aria-label="Loading Grammar Lab">
              <div className={cn(PANEL, 'h-64 animate-pulse')} />
              <div className="grid gap-3 lg:grid-cols-2">
                <div className={cn(PANEL, 'h-96 animate-pulse')} />
                <div className={cn(PANEL, 'h-96 animate-pulse')} />
              </div>
            </div>
          ) : grammar.error && screen !== 'guide' ? (
            <section
              className={cn(
                PANEL,
                'border-[rgba(var(--signal-warn),0.3)] bg-[rgba(var(--signal-warn),0.04)] p-5 sm:p-6'
              )}
            >
              <div className="flex items-start gap-3">
                <IconChip icon={AlertTriangle} tone="amber" size="lg" />
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Grammar Lab data is unavailable
                  </h2>
                  <p className={cn('mt-1 max-w-2xl text-sm font-medium leading-6', MUTED)}>
                    We could not load your Grammar evidence or practice library. Try again in a
                    moment; your existing test and Learning Path data are unaffected.
                  </p>
                  <Button
                    onClick={() => grammar.refetch()}
                    variant="outline"
                    className="mt-4 rounded-lg font-bold"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
                </div>
              </div>
            </section>
          ) : screen === 'guide' ? (
            <GrammarGuidePage
              resource={selectedGuide}
              user={grammar.user}
              isStarting={grammar.isStarting}
              isCompleted={grammar.dashboard?.completedGuideSlugs?.includes(selectedGuide?.slug)}
              isUpdatingCompletion={grammar.isUpdatingGuideCompletion}
              onSetCompletion={(completed) =>
                grammar.setGuideCompletion({ guideSlug: selectedGuide?.slug, completed })
              }
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
              user={grammar.user}
              recommendedSkill={recommendedSkill}
              resultRecommendations={grammar.resultRecommendations}
              criterionDiagnosticNeeded={grammar.criterionDiagnosticNeeded}
              defaultMode={requestedMode}
              defaultSkill={requestedSkill}
              isStarting={grammar.isStarting}
              isResuming={grammar.isResuming}
              onStart={startAttempt}
              onRetest={showRetest}
              onResume={grammar.resumeAttempt}
            />
          )}
        </div>
      </main>
    </>
  );
}
