import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Copy,
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
import { MUTED, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';
import ReviewLessons from './ReviewLessons';

function cleanPunctuation(str) {
  return String(str || '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
}

function Sentence({ value }) {
  const normalized = cleanPunctuation(value);
  const parts = normalized.split('___');
  if (parts.length === 1) return normalized;
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <span className="mx-1 inline-flex min-w-20 items-end justify-center border-b-2 border-[#5a63df] px-2 text-[#5a63df]">
          <span className="sr-only">missing answer</span>
        </span>
      )}
    </span>
  ));
}

function getQuestionGuidance(format, hasOptions) {
  if (hasOptions) return 'Read the whole sentence first, then pick the option that fits.';
  if (format === 'error_correction') {
    return 'The sentence is already in the box. Edit it, then check the whole corrected sentence.';
  }
  if (format === 'sentence_completion') {
    return 'Read the whole sentence first. The missing word must fit the grammar around it.';
  }
  return 'Read the sentence carefully, then write the accurate form.';
}

function statusClasses({ current, submitted, isCorrect, diagnostic }) {
  if (current)
    return 'border-[#5a63df] bg-[#5a63df]/10 text-[#5a63df] ring-2 ring-[#5a63df]/15 dark:bg-indigo-500/20 dark:text-indigo-200';
  if (submitted && !diagnostic && isCorrect)
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300';
  if (submitted && !diagnostic && isCorrect === false)
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300';
  if (submitted)
    return 'border-[#e2e5f2] bg-[#f4f3fb] text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300';
  return 'border-[#e2e5f2] bg-white text-slate-500 hover:border-[#c9cdf3] dark:border-white/10 dark:bg-white/3 dark:text-slate-400';
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
  const [copied, setCopied] = useState(false);
  const headingRef = useRef(null);
  const inputRef = useRef(null);
  const item = items[position];
  const answer = item ? (answers[item.id] ?? '') : '';
  const currentFeedback = item ? feedback[item.id] : null;
  const hasOptions = Array.isArray(item?.options) && item.options.length > 0;
  const answeredCount = Object.values(feedback).filter((value) => value?.submitted).length;
  const diagnostic = attempt?.mode === 'diagnostic';
  const presentation = grammarQuestionPresentation(item);
  const context = grammarContextPresentation(item?.academicContext);
  const skill = skillMeta(item?.skillCode);

  const cleanSentence = useMemo(() => {
    return cleanPunctuation(presentation.sentence);
  }, [presentation.sentence]);

  const handleCopySentence = () => {
    if (!cleanSentence) return;
    setAnswers((current) => ({ ...current, [item.id]: cleanSentence }));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    inputRef.current?.focus();
  };

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

  useEffect(() => {
    if (!item || hasOptions) return;
    if (item.questionFormat !== 'error_correction') return;
    if (currentFeedback?.submitted) return;
    if (!cleanSentence) return;
    setAnswers((current) =>
      current[item.id] === undefined ? { ...current, [item.id]: cleanSentence } : current
    );
  }, [item, hasOptions, cleanSentence, currentFeedback?.submitted]);

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
        className="group mb-4 inline-flex items-center gap-2.5 rounded-full border border-[#e2e5f2] bg-white px-3.5 py-1.5 text-xs font-extrabold text-slate-700 transition-all duration-200 hover:border-[#c9cdf3] hover:text-[#5a63df] dark:border-white/10 dark:bg-[#131315] dark:text-slate-300 dark:hover:border-indigo-500/30 dark:hover:text-indigo-300"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-[#5a63df]/10 group-hover:text-[#5a63df] dark:bg-white/10 dark:text-slate-400 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-300">
          <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
        <span>Back to Grammar Lab</span>
      </button>

      <header className="mb-5">
        <Pill tone="accent">
          {diagnostic ? <ClipboardCheck className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {diagnostic ? 'Grammar level check' : 'Focused practice'}
        </Pill>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {diagnostic
            ? 'Find your grammar priorities'
            : familyProgress.length === 1
              ? skillLabel(familyProgress[0].skillCode)
              : 'Mixed grammar practice'}
        </h1>
        {diagnostic && (
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Answer as you would in a real IELTS response. Right and wrong answers are shown at the
            end, so you can move through quickly.
          </p>
        )}
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className={cn(PANEL, 'overflow-hidden')}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeedf7] px-5 py-3.5 dark:border-white/[0.07] sm:px-7">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <span>Question {position + 1}</span>
              <span className="font-bold text-slate-400">/ {items.length}</span>
              <span className="mx-1 hidden h-3.5 w-px bg-[#eeedf7] dark:bg-white/10 sm:inline-block" />
              <span className="hidden text-xs font-bold text-slate-500 dark:text-slate-400 sm:inline-block">
                {skillLabel(item.skillCode)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">{context.shortLabel}</Pill>
              {context.scenario && (
                <span className="hidden rounded-full border border-[#e2e5f2] bg-[#f4f3fb] px-3 py-1 text-[11px] font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:inline-flex">
                  {context.scenario}
                </span>
              )}
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="max-w-4xl space-y-4">
              {/* Task Directive Card */}
              <div className="rounded-xl border border-[#5a63df]/20 bg-linear-to-r from-[#5a63df]/[0.05] to-transparent p-4 dark:border-white/10 dark:from-white/[0.04]">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-300">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      ref={headingRef}
                      tabIndex={-1}
                      className="text-sm font-extrabold text-slate-900 outline-none dark:text-white sm:text-base"
                    >
                      {presentation.instruction}
                    </h2>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                      {getQuestionGuidance(item.questionFormat, hasOptions)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sentence Card with interactive 'Copy to edit' */}
              <div className={cn(TILE, 'overflow-hidden border-[#e4e2f0] dark:border-white/10')}>
                <div className="flex items-center justify-between border-b border-[#ebeaf7] bg-white/60 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#5a63df] dark:text-indigo-400">
                    <MessageSquareQuote className="h-4 w-4" />
                    <span>Sentence to check</span>
                  </div>
                  {!hasOptions && item.questionFormat === 'error_correction' && (
                    <button
                      type="button"
                      onClick={handleCopySentence}
                      disabled={Boolean(currentFeedback?.submitted)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#5a63df]/25 bg-white px-2.5 py-1 text-xs font-bold text-[#5a63df] transition-all hover:bg-[#5a63df]/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-[#1a1924] dark:text-indigo-300 dark:hover:bg-white/10"
                      title="Put the original sentence back in your answer field"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Reset!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Reset to original</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <blockquote className="px-5 py-4 text-base font-bold leading-relaxed text-slate-900 dark:text-white sm:px-6 sm:text-lg">
                  <Sentence value={cleanSentence} />
                </blockquote>

                <div className="flex items-center justify-between border-t border-[#ebeaf7] bg-[#fbfbfe]/70 px-4 py-2 text-[11px] font-semibold text-slate-400 dark:border-white/5 dark:bg-white/2">
                  <span>No specialist topic knowledge is needed.</span>
                  {item.questionFormat === 'error_correction' && (
                    <span className="hidden sm:inline">Change only what is necessary</span>
                  )}
                </div>
              </div>
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
                          'flex w-full items-center gap-3.5 rounded-lg border px-4 py-3 text-left text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#10131f]',
                          selected
                            ? 'border-[#5a63df] bg-[#5a63df]/8 text-slate-900 ring-2 ring-[#5a63df]/15 dark:border-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-100'
                            : 'border-[#e2e5f2] bg-white text-slate-700 hover:border-[#c9cdf3] hover:bg-[#f4f3fb] dark:border-white/10 dark:bg-white/2.5 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-white/5',
                          currentFeedback?.submitted && 'cursor-default'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-colors duration-200',
                            selected
                              ? 'border-[#5a63df] bg-[#5a63df] text-white'
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
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor={`grammar-answer-${item.id}`}
                      className="text-xs font-extrabold text-slate-700 dark:text-slate-200"
                    >
                      {item.questionFormat === 'error_correction'
                        ? 'Your corrected sentence:'
                        : item.questionFormat === 'sentence_completion'
                          ? 'Your answer:'
                          : presentation.responseHint}
                    </label>
                    <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
                      Press{' '}
                      <kbd className="rounded border border-[#e2e5f2] bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        Enter ↵
                      </kbd>{' '}
                      to submit
                    </span>
                  </div>
                  <Input
                    ref={inputRef}
                    id={`grammar-answer-${item.id}`}
                    value={answer}
                    disabled={Boolean(currentFeedback?.submitted)}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !isSubmitting && !currentFeedback?.submitted) {
                        event.preventDefault();
                        submitCurrent();
                      }
                    }}
                    placeholder={
                      item.questionFormat === 'error_correction'
                        ? 'Type or paste the corrected sentence here...'
                        : 'Type the missing word or phrase...'
                    }
                    className="h-11 rounded-lg border-[#e2e5f2] bg-[#fbfbfe] px-4 font-semibold text-slate-900 transition-all focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-white/2.5 dark:text-white"
                  />
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              {!diagnostic && currentFeedback?.submitted && (
                <div
                  aria-live="polite"
                  className={cn(
                    'mt-4 rounded-lg border p-4 transition-all duration-200',
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
                    <div className="mt-2 text-sm font-bold text-[#5a63df] dark:text-indigo-300">
                      Correct answer: {currentFeedback.feedback?.correctAnswer}
                    </div>
                  )}
                  <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                    {currentFeedback.feedback?.explanation}
                  </p>
                  {!currentFeedback.isCorrect && (
                    <ReviewLessons skillCode={item.skillCode} newTab className="mt-3" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  TILE,
                  'mt-4 flex items-start gap-3 border-[#5a63df]/20 bg-[#5a63df]/4 p-3.5 dark:bg-indigo-500/5'
                )}
              >
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#5a63df] dark:text-indigo-400" />
                <div>
                  <div className="text-xs font-extrabold text-[#5a63df] dark:text-indigo-300">
                    Why this matters
                  </div>
                  <p className={cn('mt-0.5 text-xs font-medium leading-relaxed', MUTED)}>
                    {skill.transferHint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeedf7] px-5 py-4 dark:border-white/[0.07] sm:px-7">
            <Button
              onClick={() => goTo(position - 1)}
              disabled={position === 0}
              variant="outline"
              className="rounded-lg border-[#e2e5f2] font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>
            {!currentFeedback?.submitted ? (
              <Button
                onClick={submitCurrent}
                disabled={isSubmitting}
                className="rounded-lg bg-[#5a63df] px-5 font-bold text-white transition-all hover:bg-[#4a52c9]"
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
                className="rounded-lg bg-[#5a63df] px-5 font-bold text-white transition-all hover:bg-[#4a52c9]"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete(attempt.id)}
                disabled={!allAnswered || isCompleting}
                className="rounded-lg bg-[#5a63df] px-5 font-bold text-white transition-all hover:bg-[#4a52c9]"
              >
                {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete {diagnostic ? 'level check' : 'practice'}
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-3 xl:sticky xl:top-6">
          <div className={cn(PANEL, 'overflow-hidden')}>
            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 divide-x divide-[#eeedf7] border-b border-[#eeedf7] dark:divide-white/10 dark:border-white/10">
              <div className="p-3.5 text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Questions
                </div>
                <div className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
                  {items.length}
                </div>
              </div>
              <div className="p-3.5 text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Band focus
                </div>
                <div className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
                  Band {item.difficulty}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="border-b border-[#eeedf7] p-4 sm:p-5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Your progress
                </h2>
                <span className="text-xs font-extrabold text-[#5a63df] dark:text-indigo-400">
                  {answeredCount} / {items.length}
                </span>
              </div>
              <Progress
                aria-label={`${answeredCount} of ${items.length} questions saved`}
                value={(answeredCount / items.length) * 100}
                className="mt-3 h-2 bg-[#f4f3fb] dark:bg-white/10"
                indicatorClassName="bg-[#5a63df]"
              />
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>{answeredCount} saved</span>
                <span>{items.length - answeredCount} remaining</span>
              </div>
            </div>

            {/* Questions Grid */}
            <nav aria-label="Question navigator" className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Questions</h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Step {position + 1} of {items.length}
                </span>
              </div>
              <div className="mt-3.5 grid grid-cols-5 justify-items-center gap-2">
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
                        'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2',
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
              <div className="mt-4 flex items-center justify-between border-t border-[#eeedf7] pt-3 text-[10px] font-bold text-slate-400 dark:border-white/[0.07]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border-2 border-[#5a63df] bg-[#5a63df]/10" />{' '}
                  Current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#5a63df]/15 dark:bg-indigo-500/30" />{' '}
                  Saved
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-slate-300 bg-white dark:border-white/20 dark:bg-transparent" />{' '}
                  Remaining
                </span>
              </div>
            </nav>
          </div>

          {familyProgress.length > 1 && (
            <section className={cn(PANEL, 'p-4 sm:p-5')}>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Grammar skills
              </h2>
              <div className="mt-3 space-y-2">
                {familyProgress.map((family) => (
                  <div
                    key={family.skillCode}
                    className="flex items-center justify-between rounded-lg bg-[#f4f3fb] px-3 py-2 text-[11px] font-bold dark:bg-white/5"
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
        </aside>
      </div>
    </div>
  );
}
