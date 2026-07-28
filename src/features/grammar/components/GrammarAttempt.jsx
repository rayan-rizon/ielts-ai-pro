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
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-extrabold text-slate-500 transition hover:bg-white hover:text-slate-950 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Grammar Lab
      </button>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5963d9]">
            {diagnostic ? <ClipboardCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {diagnostic ? 'Grammar diagnostic' : 'Focused grammar practice'}
          </div>
          <h1 className="mt-1.5 text-3xl font-black tracking-[-0.045em] text-slate-950 dark:text-white">
            {diagnostic ? 'Find your grammar priorities' : skillLabel(item.skillCode)}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {diagnostic
              ? 'Feedback appears after all 24 questions are complete.'
              : 'Check each answer now, then review the explanation.'}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#e2e5f2] bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#10131f]">
          <div>
            <div className="text-[10px] font-bold text-slate-400">Questions</div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{items.length}</div>
          </div>
          <div className="h-8 w-px bg-[#e7e9f2]" />
          <div>
            <div className="text-[10px] font-bold text-slate-400">Practice difficulty</div>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              Level {item.difficulty}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="overflow-hidden rounded-3xl border border-[#e1e4f1] bg-white shadow-[0_24px_70px_-52px_rgba(41,53,130,0.72)] dark:border-white/10 dark:bg-[#10131f]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceef7] px-5 py-4 sm:px-7">
            <div className="text-sm font-black text-slate-900 dark:text-white">
              Question {position + 1}
              <span className="font-bold text-slate-400"> / {items.length}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f1f3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#505bdd]">
                {context.shortLabel}
              </span>
              {context.scenario && (
                <span className="hidden rounded-full bg-[#f7f8fb] px-3 py-1.5 text-[11px] font-bold text-slate-500 sm:inline-flex">
                  {context.scenario}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f7fc] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  {skillLabel(item.skillCode)}
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {presentation.responseHint}
                </span>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff8ed] px-4 py-3.5 text-sm font-bold leading-6 text-[#7b4a22] dark:bg-orange-400/10 dark:text-orange-100">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#ec8a3d]" />
                <h2 ref={headingRef} tabIndex={-1} className="outline-none">
                  <span className="font-black">Your task:</span> {presentation.instruction}
                </h2>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dcdff3] bg-white shadow-[0_14px_35px_-30px_rgba(55,65,145,0.8)] dark:border-indigo-400/20 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 border-b border-[#eceefa] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#626bdb]">
                  <MessageSquareQuote className="h-4 w-4" />
                  Sentence to check
                </div>
                <blockquote className="px-5 py-5 text-lg font-black leading-8 text-slate-950 sm:px-6 sm:text-xl sm:leading-9 dark:text-white">
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
                          'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6972e8] focus-visible:ring-offset-2',
                          selected
                            ? 'border-[#7780ef] bg-[#f1f3ff] text-[#343db3] ring-2 ring-[#6972ee]/10 dark:bg-indigo-400/10 dark:text-indigo-100'
                            : 'border-[#e3e6f1] bg-white text-slate-700 hover:border-[#c9cef5] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200',
                          currentFeedback?.submitted && 'cursor-default'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black',
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
                    className="h-12 rounded-2xl border-[#dfe3f0] bg-[#fcfcff] px-4 font-semibold focus-visible:ring-[#6972e8] dark:border-white/10 dark:bg-white/[0.025]"
                  />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {!diagnostic && currentFeedback?.submitted && (
                <div
                  aria-live="polite"
                  className={cn(
                    'mt-5 rounded-2xl border p-4',
                    currentFeedback.isCorrect
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-400/20 dark:bg-orange-400/10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {currentFeedback.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                    )}
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {currentFeedback.isCorrect ? 'That works' : 'Let’s repair it'}
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

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e5e7f7] bg-[#fbfbff] p-4">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#6872e8]" />
                <div>
                  <div className="text-xs font-extrabold text-[#505bdd]">Why this matters</div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {skill.transferHint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef7] bg-[#fcfcff] px-5 py-4 dark:border-white/10 dark:bg-white/[0.025] sm:px-7">
            <Button
              onClick={() => goTo(position - 1)}
              disabled={position === 0}
              variant="outline"
              className="rounded-xl font-extrabold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
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
                onClick={() => goTo(position + 1)}
                className="rounded-xl bg-[#5661e9] px-5 font-extrabold text-white hover:bg-[#4853d6]"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete(attempt.id)}
                disabled={!allAnswered || isCompleting}
                className="rounded-xl bg-[#5661e9] px-5 font-extrabold text-white hover:bg-[#4853d6]"
              >
                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete {diagnostic ? 'diagnostic' : 'practice'}
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-3xl border border-[#e1e4f1] bg-white p-5 shadow-[0_18px_55px_-44px_rgba(48,58,128,0.68)] dark:border-white/10 dark:bg-[#10131f]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Your progress</h2>
              <span className="text-xs font-extrabold text-[#5963d9]">
                {answeredCount} / {items.length}
              </span>
            </div>
            <Progress
              aria-label={`${answeredCount} of ${items.length} questions saved`}
              value={(answeredCount / items.length) * 100}
              className="mt-3 h-2 bg-[#eceef8]"
              indicatorClassName="bg-[#5963e8]"
            />
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>{answeredCount} saved</span>
              <span>{items.length - answeredCount} remaining</span>
            </div>
          </section>

          {familyProgress.length > 1 && (
            <section className="rounded-3xl border border-[#e1e4f1] bg-white p-5 shadow-[0_18px_55px_-44px_rgba(48,58,128,0.68)] dark:border-white/10 dark:bg-[#10131f]">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Grammar skills</h2>
              <div className="mt-3 space-y-2">
                {familyProgress.map((family) => (
                  <div
                    key={family.skillCode}
                    className="flex items-center justify-between rounded-xl bg-[#f8f9fc] px-3 py-2 text-[11px] font-bold"
                  >
                    <span className="truncate text-slate-600">{skillLabel(family.skillCode)}</span>
                    <span
                      className={cn(
                        'ml-2 shrink-0',
                        family.answered === family.total ? 'text-emerald-600' : 'text-slate-400'
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
            className="rounded-3xl border border-[#e1e4f1] bg-white p-5 shadow-[0_18px_55px_-44px_rgba(48,58,128,0.68)] dark:border-white/10 dark:bg-[#10131f]"
          >
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Questions</h2>
            <div className="mt-4 grid grid-cols-6 gap-2">
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
                      'flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6972e8] focus-visible:ring-offset-2',
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
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-slate-400">
              <span>Outlined: current</span>
              <span>Purple: saved</span>
              <span>White: remaining</span>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
}
