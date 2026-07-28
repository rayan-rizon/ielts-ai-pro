import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Lightbulb,
  Loader2,
  MessageSquareQuote,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import {
  grammarContextPresentation,
  grammarQuestionPresentation,
  skillLabel,
  skillMeta,
} from '../constants';

function Sentence({ value }) {
  const parts = String(value || '').split('___');
  if (parts.length === 1) return value;
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <span className="mx-1 inline-flex min-w-20 items-end justify-center border-b-2 border-[#6972e8] px-2 text-[#505bdd]">
          <span className="sr-only">missing answer</span>
        </span>
      )}
    </span>
  ));
}

function statusClasses({ current, submitted, isCorrect, diagnostic }) {
  if (current) return 'border-[#5963e8] bg-[#eef0ff] text-[#4049c3] ring-2 ring-[#6972e8]/10';
  if (submitted && !diagnostic && isCorrect)
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (submitted && !diagnostic && isCorrect === false)
    return 'border-orange-200 bg-orange-50 text-orange-700';
  if (submitted) return 'border-[#d6daf8] bg-[#f3f4ff] text-[#5963d9]';
  return 'border-[#e3e6f1] bg-white text-slate-500 hover:border-[#cfd4fa]';
}

export default function GrammarAttempt({
  attemptData,
  isSubmitting,
  isCompleting,
  onSubmit,
  onComplete,
  onExit,
}) {
  const attempt = attemptData?.attempt;
  const items = useMemo(() => attemptData?.items || [], [attemptData?.items]);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [error, setError] = useState('');
  const headingRef = useRef(null);
  const item = items[position];
  const answer = item ? (answers[item.id] ?? '') : '';
  const currentFeedback = item ? feedback[item.id] : null;
  const hasOptions = Array.isArray(item?.options) && item.options.length > 0;
  const answeredCount = Object.values(feedback).filter((value) => value?.submitted).length;
  const diagnostic = attempt?.mode === 'diagnostic';
  const presentation = grammarQuestionPresentation(item);
  const context = grammarContextPresentation(item?.academicContext);
  const skill = skillMeta(item?.skillCode);

  useEffect(() => {
    const savedAnswers = {};
    const savedFeedback = {};
    items.forEach((savedItem) => {
      if (!savedItem.response) return;
      savedAnswers[savedItem.id] = savedItem.response.submittedAnswer ?? '';
      savedFeedback[savedItem.id] = {
        submitted: true,
        isCorrect: savedItem.response.isCorrect,
        feedback: savedItem.feedback,
      };
    });
    const firstUnanswered = items.findIndex((savedItem) => !savedItem.response);
    setPosition(firstUnanswered >= 0 ? firstUnanswered : 0);
    setAnswers(savedAnswers);
    setFeedback(savedFeedback);
    setError('');
  }, [attempt?.id, items]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [position]);

  const familyProgress = useMemo(() => {
    const groups = new Map();
    items.forEach((question) => {
      if (!groups.has(question.skillCode)) {
        groups.set(question.skillCode, { skillCode: question.skillCode, total: 0, answered: 0 });
      }
      const group = groups.get(question.skillCode);
      group.total += 1;
      if (feedback[question.id]?.submitted) group.answered += 1;
    });
    return Array.from(groups.values());
  }, [feedback, items]);

  if (!attempt || !item) return null;

  const goTo = (nextPosition) => {
    if (nextPosition < 0 || nextPosition >= items.length) return;
    setPosition(nextPosition);
    setError('');
  };

  const submitCurrent = async () => {
    if (!String(answer).trim()) {
      setError(
        hasOptions ? 'Choose one answer before continuing.' : 'Enter an answer before continuing.'
      );
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

  const allAnswered = answeredCount === items.length;

  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        type="button"
        onClick={onExit}
        className="group mb-4 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-extrabold text-slate-700 shadow-xs transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] dark:border-white/10 dark:bg-[#10131f] dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-white/10 dark:text-slate-400 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-300">
          <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
        <span>Back to Grammar Lab</span>
      </button>

      <header className="mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          {diagnostic ? (
            <ClipboardCheck className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3 text-indigo-500" />
          )}
          {diagnostic ? 'Grammar level check' : 'Focused practice'}
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {diagnostic ? 'Find your grammar priorities' : skillLabel(item.skillCode)}
        </h1>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-indigo-950/5 dark:border-white/10 dark:bg-[#10131f]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-3.5 sm:px-7 dark:border-white/10 dark:bg-[#10131f]">
            <div className="text-sm font-black text-slate-900 dark:text-white">
              Question {position + 1}
              <span className="font-bold text-slate-400"> / {items.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-[11px] font-extrabold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                {context.shortLabel}
              </span>
              {context.scenario && (
                <span className="hidden rounded-full border border-slate-200/60 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  {context.scenario}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6 bg-white dark:bg-[#10131f]">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  {skillLabel(item.skillCode)}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {presentation.responseHint}
                </span>
              </div>

              <div className="mt-3.5 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 to-orange-50/70 px-4 py-3 text-sm font-semibold leading-6 text-amber-900 shadow-xs dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-200">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <h2 ref={headingRef} tabIndex={-1} className="outline-none">
                  <span className="font-black text-amber-950 dark:text-amber-100">Your task:</span>{' '}
                  {presentation.instruction}
                </h2>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 shadow-sm dark:border-indigo-500/20 dark:from-indigo-950/20 dark:via-[#10131f] dark:to-purple-950/10">
                <div className="flex items-center gap-2 border-b border-indigo-100/70 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:border-indigo-500/20 dark:text-indigo-400">
                  <MessageSquareQuote className="h-4 w-4" />
                  Sentence to check
                </div>
                <blockquote className="px-5 py-4 text-base sm:text-lg font-bold leading-relaxed text-slate-900 sm:px-6 dark:text-white">
                  <Sentence value={presentation.sentence} />
                </blockquote>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                No specialist topic knowledge is needed.
              </p>
            </div>

            <div className="mt-5 max-w-4xl">
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
                          'flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                          selected
                            ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-100'
                            : 'border-slate-200/80 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30 hover:scale-[1.003] active:scale-[0.997] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-white/5',
                          currentFeedback?.submitted &&
                            'cursor-default hover:scale-100 active:scale-100'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-colors duration-200',
                            selected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-white/20 dark:bg-white/10 dark:text-slate-300'
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="leading-snug">{option}</span>
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
                    {presentation.responseHint}
                  </label>
                  <Input
                    id={`grammar-answer-${item.id}`}
                    value={answer}
                    disabled={Boolean(currentFeedback?.submitted)}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder={
                      item.questionFormat === 'error_correction'
                        ? 'Write the complete corrected sentence'
                        : 'Type the missing word or phrase'
                    }
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-900 transition-all focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-white"
                  />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 shadow-xs dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {!diagnostic && currentFeedback?.submitted && (
                <div
                  aria-live="polite"
                  className={cn(
                    'mt-4 rounded-2xl border p-4 shadow-xs transition-all duration-200',
                    currentFeedback.isCorrect
                      ? 'border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                      : 'border-amber-200/90 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {currentFeedback.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {currentFeedback.isCorrect ? 'That works' : 'Let’s repair it'}
                    </div>
                  </div>
                  {!currentFeedback.isCorrect && (
                    <div className="mt-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Correct answer: {currentFeedback.feedback?.correctAnswer}
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {currentFeedback.feedback?.explanation}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-100/80 bg-indigo-50/40 p-3.5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                    Why this matters
                  </div>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                    {skill.transferHint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#10131f] sm:px-7">
            <Button
              onClick={() => goTo(position - 1)}
              disabled={position === 0}
              variant="outline"
              className="rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>
            {!currentFeedback?.submitted ? (
              <Button
                onClick={submitCurrent}
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 font-bold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {diagnostic
                  ? position < items.length - 1
                    ? 'Save & continue'
                    : 'Save answer'
                  : 'Check answer'}
                {!isSubmitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            ) : position < items.length - 1 ? (
              <Button
                onClick={() => goTo(position + 1)}
                className="rounded-xl bg-indigo-600 px-5 font-bold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete(attempt.id)}
                disabled={!allAnswered || isCompleting}
                className="rounded-xl bg-indigo-600 px-5 font-bold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete {diagnostic ? 'level check' : 'practice'}
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="flex items-center justify-around rounded-3xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-indigo-950/5 dark:border-white/10 dark:bg-[#10131f]">
            <div className="text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Questions
              </div>
              <div className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">
                {items.length}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200/80 dark:bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Difficulty
              </div>
              <div className="mt-0.5 text-sm font-black text-slate-900 dark:text-white">
                Level {item.difficulty}
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-indigo-950/5 dark:border-white/10 dark:bg-[#10131f]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Your progress</h2>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                {answeredCount} / {items.length}
              </span>
            </div>
            <Progress
              aria-label={`${answeredCount} of ${items.length} questions saved`}
              value={(answeredCount / items.length) * 100}
              className="mt-3 h-2 bg-slate-100 dark:bg-white/10"
              indicatorClassName="bg-indigo-600 dark:bg-indigo-500"
            />
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>{answeredCount} saved</span>
              <span>{items.length - answeredCount} remaining</span>
            </div>
          </section>

          {familyProgress.length > 1 && (
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-indigo-950/5 dark:border-white/10 dark:bg-[#10131f]">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Grammar skills</h2>
              <div className="mt-3 space-y-2">
                {familyProgress.map((family) => (
                  <div
                    key={family.skillCode}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold dark:bg-white/5"
                  >
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {skillLabel(family.skillCode)}
                    </span>
                    <span
                      className={cn(
                        'ml-2 shrink-0',
                        family.answered === family.total
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      )}
                    >
                      {family.answered}/{family.total}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <nav
            aria-label="Question navigator"
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-indigo-950/5 dark:border-white/10 dark:bg-[#10131f]"
          >
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Questions</h2>
            <div className="mt-4 grid grid-cols-5 gap-2.5 justify-items-center">
              {items.map((question, index) => {
                const state = feedback[question.id];
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Question ${index + 1}${
                      state?.submitted ? ', answer saved' : ''
                    }${index === position ? ', current question' : ''}`}
                    aria-current={index === position ? 'step' : undefined}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:scale-105',
                      statusClasses({
                        current: index === position,
                        submitted: state?.submitted,
                        isCorrect: state?.isCorrect,
                        diagnostic,
                      })
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100/80 pt-3 text-[10px] font-bold text-slate-400 dark:border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border-2 border-indigo-600 bg-indigo-50" />{' '}
                Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700" />{' '}
                Saved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-transparent" />{' '}
                Remaining
              </span>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}
