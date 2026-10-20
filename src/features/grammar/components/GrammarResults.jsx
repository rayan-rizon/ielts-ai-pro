import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { grammarContextPresentation, grammarQuestionPresentation, skillLabel } from '../constants';
import { MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';
import ReviewLessons from './ReviewLessons';

function headline(accuracy, missed) {
  if (!missed) return 'Every answer correct';
  if (accuracy >= 80) return 'Strong set. Check the few you missed';
  if (accuracy >= 50) return 'Good progress. Fix these next';
  return 'A useful start. Here is what to fix';
}

export default function GrammarResults({ result, onDashboard, onPracticeAgain }) {
  if (!result) return null;

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
  const skillsToReview = bySkill.filter((skill) => skill.correct < skill.total);

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <section className={cn(PANEL, 'p-6')}>
        <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div className={cn(TILE, 'p-5 text-center')}>
            <div className="text-4xl font-black tracking-tighter text-[#5a63df]">{accuracy}%</div>
            <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Your score
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
              {headline(accuracy, incorrect.length)}
            </h1>
            <p className={cn('mt-2 text-sm font-medium leading-6', MUTED)}>
              {incorrect.length
                ? 'Read each correct answer below, review the lesson, then use the pattern in your next Writing or Speaking answer.'
                : 'Use these patterns in your next Writing or Speaking answer, or try another set.'}
            </p>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">
              This score is for practice. It is not your IELTS Grammar band.
            </p>
          </div>
        </div>
      </section>

      <section className={cn(PANEL, 'p-5')}>
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          How you did by skill
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bySkill.map((skill) => (
            <div key={skill.skillCode} className={cn(TILE, 'p-3.5')}>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {skillLabel(skill.skillCode)}
              </div>
              <div className={cn('mt-1 text-xs font-semibold', MUTED)}>
                {skill.correct} of {skill.total} correct
              </div>
            </div>
          ))}
        </div>
      </section>

      {incorrect.length > 0 && (
        <section className={cn(PANEL, 'p-5')}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Questions to review
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
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Your answer
                      </span>
                      {String(item.submittedAnswer)}
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                        Correct answer
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

      {skillsToReview.length > 0 && (
        <section className={cn(PANEL, 'p-5')}>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Review the lesson
          </h2>
          <p className={cn('mt-1 text-xs font-medium', MUTED)}>
            Each unit teaches the rule behind the questions you missed.
          </p>
          <div className="mt-3 space-y-3">
            {skillsToReview.map((skill) => (
              <ReviewLessons key={skill.skillCode} skillCode={skill.skillCode} />
            ))}
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
          <RefreshCw className="mr-2 h-4 w-4" /> Practise again
        </Button>
      </div>
    </div>
  );
}
