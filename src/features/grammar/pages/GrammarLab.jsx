import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpenCheck, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';
import GrammarAttempt from '../components/GrammarAttempt';
import GrammarDashboard from '../components/GrammarDashboard';
import GrammarResourceDialog from '../components/GrammarResourceDialog';
import GrammarResults from '../components/GrammarResults';
import GrammarTransfer from '../components/GrammarTransfer';
import { useGrammarLab } from '../hooks/useGrammarLab';

export default function GrammarLab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resource, setResource] = useState(null);
  const grammar = useGrammarLab();
  const requestedMode = searchParams.get('mode');
  const requestedSkill = searchParams.get('skill');
  const requestedActivityId = searchParams.get('activityId');
  const requestedTransfer = searchParams.get('transfer');
  const screen = grammar.result
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

  const startAttempt = async (options) => {
    const data = await grammar.startAttempt({
      ...options,
      learningPathActivityId: requestedActivityId || undefined,
    });
    if (options.mode !== 'transfer') {
      const next = new URLSearchParams(searchParams);
      next.set('mode', options.mode);
      if (options.targetSkills?.[0]) next.set('skill', options.targetSkills[0]);
      setSearchParams(next, { replace: true });
    }
    return data;
  };

  const showDashboard = () => {
    grammar.setActiveAttempt(null);
    grammar.setResult(null);
    setSearchParams({}, { replace: true });
  };

  const showTransfer = () => {
    grammar.setActiveAttempt(null);
    grammar.setResult(null);
    const next = new URLSearchParams();
    next.set('mode', 'transfer');
    if (recommendedSkill?.skillCode) next.set('skill', recommendedSkill.skillCode);
    setSearchParams(next);
  };

  return (
    <>
      <DocumentHead
        title="IELTS Grammar Lab | IELTS Ai Pro"
        description="Practice grammar through Academic IELTS Writing and Speaking contexts, then connect measured evidence to your Learning Path."
      />
      <main className="min-h-full bg-[#f5f7fc] px-3 py-5 text-slate-950 dark:bg-[#070913] dark:text-white sm:px-5 md:px-7 md:py-7">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#5963d9]">
                <BookOpenCheck className="h-4 w-4" />
                Learning tool
              </div>
              <h1 className="mt-1.5 text-3xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                Grammar Lab
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                Academic IELTS Writing & Speaking support · Bands 5–7 practice
              </p>
            </div>
            {!grammar.isLoading && !grammar.error && screen !== 'dashboard' && (
              <div className="rounded-full border border-[#e1e4f2] bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#10131f] dark:text-slate-300">
                No separate Grammar band is calculated
              </div>
            )}
          </header>

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
              onStart={(options) =>
                options.mode === 'transfer' ? showTransfer() : startAttempt(options)
              }
              onOpenResource={setResource}
            />
          )}
        </div>
      </main>
      <GrammarResourceDialog
        resource={resource}
        onOpenChange={(open) => !open && setResource(null)}
      />
    </>
  );
}
