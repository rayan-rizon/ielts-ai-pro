import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import { skillLabel } from '../constants';

export default function GrammarAttempt({
  attemptData,
  isSubmitting,
  isCompleting,
  onSubmit,
  onComplete,
  onExit,
}) {
  const attempt = attemptData?.attempt;
  const items = attemptData?.items || [];
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [error, setError] = useState('');
  const item = items[position];
  const answer = item ? answers[item.id] || '' : '';
  const currentFeedback = item ? feedback[item.id] : null;
  const hasOptions = Array.isArray(item?.options) && item.options.length > 0;
  const answeredCount = Object.keys(answers).filter((id) => feedback[id]?.submitted).length;
  const diagnostic = attempt?.mode === 'diagnostic';

  useEffect(() => {
    setPosition(0);
    setAnswers({});
    setFeedback({});
    setError('');
  }, [attempt?.id]);

  const contextLabel = useMemo(() => {
    const context = item?.academicContext || {};
    const module = String(context.module || '').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const task = String(context.task || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    return [module, task].filter(Boolean).join(' · ');
  }, [item?.academicContext]);

  if (!attempt || !item) return null;

  const submitCurrent = async () => {
    if (!String(answer).trim()) {
      setError('Choose or enter an answer before continuing.');
      return;
    }
    setError('');
    try {
      const response = await onSubmit({
        attemptId: attempt.id,
        itemId: item.id,
        answer,
      });
      setFeedback((current) => ({
        ...current,
        [item.id]: { ...response, submitted: true },
      }));
      if (diagnostic && position < items.length - 1) setPosition((value) => value + 1);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const next = () => {
    if (position < items.length - 1) {
      setPosition((value) => value + 1);
      setError('');
    }
  };

  const allAnswered = answeredCount === items.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Grammar Lab
        </button>
        <div className="rounded-full border border-[#dfe3f4] bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#10131f] dark:text-slate-300">
          {diagnostic
            ? 'Diagnostic · feedback after completion'
            : `${skillLabel(item.skillCode)} practice`}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e4e7f4] bg-white shadow-[0_20px_60px_-42px_rgba(41,53,130,0.65)] dark:border-white/10 dark:bg-[#10131f]">
        <div className="border-b border-[#eceef7] bg-[#fafbff] px-5 py-4 dark:border-white/10 dark:bg-white/[0.025] sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5963d9]">
                {contextLabel}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                Question {position + 1} of {items.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                Band {item.difficulty} focus
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                Practice level, not a score
              </div>
            </div>
          </div>
          <Progress
            aria-label={`Question ${position + 1} of ${items.length}`}
            value={((position + 1) / items.length) * 100}
            className="mt-3 h-1.5 bg-[#e9ebf7]"
            indicatorClassName="bg-[#5963e8]"
          />
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="max-w-3xl">
            <div className="mb-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              {skillLabel(item.skillCode)} · {item.questionFormat.replaceAll('_', ' ')}
            </div>
            <h1 className="text-lg font-extrabold leading-8 tracking-[-0.015em] text-slate-950 dark:text-white sm:text-xl">
              {item.prompt}
            </h1>
          </div>

          <div className="mt-6 max-w-3xl">
            {hasOptions ? (
              <div className="space-y-2.5" role="radiogroup" aria-label="Answer choices">
                {(item.options || []).map((option, optionIndex) => {
                  const selected = answer === option;
                  return (
                    <button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={Boolean(currentFeedback?.submitted)}
                      onClick={() => setAnswers((current) => ({ ...current, [item.id]: option }))}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition',
                        selected
                          ? 'border-[#7780ef] bg-[#f1f3ff] text-[#343db3] ring-2 ring-[#6972ee]/10 dark:bg-indigo-400/10 dark:text-indigo-100'
                          : 'border-[#e5e8f3] bg-white text-slate-700 hover:border-[#cfd4fa] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200',
                        currentFeedback?.submitted && 'cursor-default'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold',
                          selected
                            ? 'border-[#6972e8] bg-[#6972e8] text-white'
                            : 'border-slate-300 text-slate-500 dark:border-white/20'
                        )}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label
                  htmlFor={`grammar-answer-${item.id}`}
                  className="mb-2 block text-xs font-extrabold text-slate-600 dark:text-slate-300"
                >
                  Your answer
                </label>
                <Input
                  id={`grammar-answer-${item.id}`}
                  value={answer}
                  disabled={Boolean(currentFeedback?.submitted)}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  placeholder={
                    item.questionFormat === 'sentence_completion'
                      ? 'Enter only the missing form'
                      : 'Write the corrected sentence'
                  }
                  className="h-12 rounded-xl border-[#dfe3f0] bg-[#fcfcff] px-4 font-semibold focus-visible:ring-[#6972e8] dark:border-white/10 dark:bg-white/[0.025]"
                />
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  Grading ignores capitalization, final punctuation, and repeated spaces; it does
                  not accept an unrelated paraphrase.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {!diagnostic && currentFeedback?.submitted && (
              <div
                className={cn(
                  'mt-5 rounded-xl border p-4',
                  currentFeedback.isCorrect
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10'
                )}
              >
                <div className="flex items-center gap-2">
                  {currentFeedback.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  )}
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {currentFeedback.isCorrect ? 'Accurate' : 'Needs repair'}
                  </div>
                </div>
                {!currentFeedback.isCorrect && (
                  <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                    Correct answer: {currentFeedback.feedback?.correctAnswer}
                  </div>
                )}
                <p className="mt-2 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                  {currentFeedback.feedback?.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef7] bg-[#fafbff] px-5 py-4 dark:border-white/10 dark:bg-white/[0.025] sm:px-7">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {answeredCount} of {items.length} answers saved
          </div>
          {!currentFeedback?.submitted ? (
            <Button
              onClick={submitCurrent}
              disabled={isSubmitting}
              className="rounded-xl bg-[#5661e9] px-5 font-extrabold text-white hover:bg-[#4853d6]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {diagnostic
                ? position < items.length - 1
                  ? 'Save & continue'
                  : 'Save answer'
                : 'Check answer'}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          ) : position < items.length - 1 ? (
            <Button
              onClick={next}
              className="rounded-xl bg-[#5661e9] px-5 font-extrabold text-white hover:bg-[#4853d6]"
            >
              Next question <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => onComplete(attempt.id)}
              disabled={!allAnswered || isCompleting}
              className="rounded-xl bg-[#5661e9] px-5 font-extrabold text-white hover:bg-[#4853d6]"
            >
              {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete practice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
