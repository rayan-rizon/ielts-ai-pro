import { ArrowRight, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { grammarContextPresentation, grammarQuestionPresentation, skillLabel } from '../constants';
import { MUTED, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';

export default function GrammarResults({ result, onDashboard, onPracticeAgain, onTransfer }) {
  if (!result) return null;

  if (result.type === 'transfer') {
    const evaluation = result.evaluation || {};
    const needsRepair = evaluation.outcome === 'needs_repair';
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <section className={cn(PANEL, 'p-6')}>
          <Pill tone={needsRepair ? 'amber' : 'ok'}>
            {needsRepair ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {needsRepair ? 'Needs repair' : 'Target demonstrated'}
          </Pill>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            IELTS grammar transfer feedback
          </h1>
          <p className={cn('mt-2 max-w-3xl text-sm font-medium leading-6', MUTED)}>
            {evaluation.explanation}
          </p>
          {evaluation.transcriptCaveat && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold leading-5 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
              {evaluation.transcriptCaveat}
            </div>
          )}
        </section>

        {evaluation.groundedExamples?.length > 0 && (
          <section className={cn(PANEL, 'p-5')}>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Exact grounded examples
            </h2>
            <div className="mt-4 space-y-3">
              {evaluation.groundedExamples.map((example, index) => (
                <div key={`${example.quote}-${index}`} className={cn(TILE, 'p-4')}>
                  <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#5a63df]">
                    {skillLabel(example.targetSkill)}
                  </div>
                  <blockquote className="mt-2 border-l-2 border-amber-400 pl-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                    Your wording: “{example.quote}”
                  </blockquote>
                  <p className={cn('mt-2 text-xs font-medium', MUTED)}>{example.issue}</p>
                  <p className="mt-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    Better version: {example.correction}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={cn(PANEL, 'p-5')}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Corrected version
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 dark:text-slate-200">
            {evaluation.correctedVersion}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onDashboard} variant="outline" className="rounded-lg font-bold">
            Back to Grammar Lab
          </Button>
          <Button
            onClick={onTransfer}
            className="rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
          >
            Try another transfer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const accuracy = Number(result.accuracy || 0);
  const incorrect = (result.results || []).filter((item) => !item.isCorrect);
  const bySkill = Object.values(
    (result.results || []).reduce((map, item) => {
      if (!map[item.skillCode]) {
        map[item.skillCode] = { skillCode: item.skillCode, total: 0, correct: 0 };
      }
      map[item.skillCode].total += 1;
      if (item.isCorrect) map[item.skillCode].correct += 1;
      return map;
    }, {})
  );

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <section className={cn(PANEL, 'p-6')}>
        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div className={cn(TILE, 'p-5 text-center')}>
            <div className="text-4xl font-black tracking-[-0.05em] text-[#5a63df]">{accuracy}%</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Practice accuracy
            </div>
            <div className={cn('mt-3 text-xs font-semibold', MUTED)}>
              {result.correctCount} of {result.totalQuestions} correct
            </div>
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5a63df]">
              Grammar Lab result
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {incorrect.length ? 'Review the evidence, then repair' : 'Accurate across this set'}
            </h1>
            <p className={cn('mt-2 text-sm font-medium leading-6', MUTED)}>
              Use the repairs below in your next Writing or Speaking response.
            </p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">
              Practice accuracy is evidence for your study plan, not an IELTS Grammar band.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(PANEL, 'p-5')}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          Evidence by grammar family
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bySkill.map((skill) => (
            <div key={skill.skillCode} className={cn(TILE, 'p-3.5')}>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {skillLabel(skill.skillCode)}
              </div>
              <div className={cn('mt-1 text-xs font-semibold', MUTED)}>
                {skill.correct} correct · {skill.total} observations
              </div>
            </div>
          ))}
        </div>
      </section>

      {incorrect.length > 0 && (
        <section className={cn(PANEL, 'p-5')}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Answers to repair
          </h2>
          <div className="mt-4 space-y-3">
            {incorrect.map((item) => {
              const question = grammarQuestionPresentation(item);
              const context = grammarContextPresentation(item.academicContext);
              return (
                <div
                  key={item.itemId}
                  className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-400/20 dark:bg-amber-400/10"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                      {skillLabel(item.skillCode)}
                    </span>
                    {item.academicContext && (
                      <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                        {context.shortLabel}
                      </span>
                    )}
                  </div>
                  {item.prompt && (
                    <div className="mt-3 rounded-lg border border-amber-100 bg-white/80 px-3 py-2.5 text-sm font-bold leading-6 text-slate-800 dark:border-amber-400/10 dark:bg-white/5 dark:text-slate-100">
                      {question.sentence}
                    </div>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-white/65 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                        Your answer
                      </span>
                      {String(item.submittedAnswer)}
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                      <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-300">
                        Better answer
                      </span>
                      {item.correctAnswer}
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                    {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onDashboard} variant="outline" className="rounded-lg font-bold">
          Back to Grammar Lab
        </Button>
        <Button
          onClick={onPracticeAgain}
          className="rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Practice again
        </Button>
        <Button onClick={onTransfer} variant="outline" className="rounded-lg font-bold">
          Apply in Writing or Speaking <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
