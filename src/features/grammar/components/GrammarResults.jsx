import { ArrowRight, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { skillLabel } from '../constants';

export default function GrammarResults({ result, onDashboard, onPracticeAgain, onTransfer }) {
  if (!result) return null;

  if (result.type === 'transfer') {
    const evaluation = result.evaluation || {};
    const needsRepair = evaluation.outcome === 'needs_repair';
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-2xl border border-[#e4e7f4] bg-white p-6 shadow-[0_20px_60px_-42px_rgba(41,53,130,0.65)] dark:border-white/10 dark:bg-[#10131f]">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold',
              needsRepair
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
            )}
          >
            {needsRepair ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {needsRepair ? 'Needs repair' : 'Target demonstrated'}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            IELTS grammar transfer feedback
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {evaluation.explanation}
          </p>
          {evaluation.transcriptCaveat && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold leading-5 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
              {evaluation.transcriptCaveat}
            </div>
          )}
        </section>

        {evaluation.groundedExamples?.length > 0 && (
          <section className="rounded-2xl border border-[#e4e7f4] bg-white p-5 dark:border-white/10 dark:bg-[#10131f]">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
              Exact grounded examples
            </h2>
            <div className="mt-4 space-y-3">
              {evaluation.groundedExamples.map((example, index) => (
                <div
                  key={`${example.quote}-${index}`}
                  className="rounded-xl border border-[#eceefa] bg-[#fcfcff] p-4 dark:border-white/10 dark:bg-white/[0.025]"
                >
                  <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#5963d9]">
                    {skillLabel(example.targetSkill)}
                  </div>
                  <blockquote className="mt-2 border-l-2 border-amber-400 pl-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                    “{example.quote}”
                  </blockquote>
                  <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {example.issue}
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    {example.correction}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#e4e7f4] bg-white p-5 dark:border-white/10 dark:bg-[#10131f]">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
            Corrected version
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 dark:text-slate-200">
            {evaluation.correctedVersion}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onDashboard} variant="outline" className="rounded-xl font-extrabold">
            Back to Grammar Lab
          </Button>
          <Button
            onClick={onTransfer}
            className="rounded-xl bg-[#5661e9] font-extrabold text-white hover:bg-[#4853d6]"
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
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-2xl border border-[#e4e7f4] bg-white p-6 shadow-[0_20px_60px_-42px_rgba(41,53,130,0.65)] dark:border-white/10 dark:bg-[#10131f]">
        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div className="rounded-2xl border border-[#e4e7f6] bg-[#f7f8ff] p-5 text-center dark:border-white/10 dark:bg-white/[0.025]">
            <div className="text-4xl font-black tracking-[-0.05em] text-[#505bdd]">{accuracy}%</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
              Practice accuracy
            </div>
            <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {result.correctCount} of {result.totalQuestions} correct
            </div>
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5963d9]">
              Grammar Lab result
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {incorrect.length ? 'Review the evidence, then repair' : 'Accurate across this set'}
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              This accuracy updates only your granular Grammar Lab evidence. It is not an IELTS band
              and does not change your four-module readiness score.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4e7f4] bg-white p-5 dark:border-white/10 dark:bg-[#10131f]">
        <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
          Evidence by grammar family
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bySkill.map((skill) => (
            <div
              key={skill.skillCode}
              className="rounded-xl border border-[#eceefa] bg-[#fcfcff] p-3.5 dark:border-white/10 dark:bg-white/[0.025]"
            >
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {skillLabel(skill.skillCode)}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {skill.correct} correct · {skill.total} observations
              </div>
            </div>
          ))}
        </div>
      </section>

      {incorrect.length > 0 && (
        <section className="rounded-2xl border border-[#e4e7f4] bg-white p-5 dark:border-white/10 dark:bg-[#10131f]">
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
            Answers to repair
          </h2>
          <div className="mt-4 space-y-3">
            {incorrect.map((item) => (
              <div
                key={item.itemId}
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/10"
              >
                <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
                  {skillLabel(item.skillCode)}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Your answer: {String(item.submittedAnswer)}
                </div>
                <div className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                  Correct answer: {item.correctAnswer}
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onDashboard} variant="outline" className="rounded-xl font-extrabold">
          Back to Grammar Lab
        </Button>
        <Button
          onClick={onPracticeAgain}
          className="rounded-xl bg-[#5661e9] font-extrabold text-white hover:bg-[#4853d6]"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Practice again
        </Button>
        <Button onClick={onTransfer} variant="outline" className="rounded-xl font-extrabold">
          Apply in Writing or Speaking <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
