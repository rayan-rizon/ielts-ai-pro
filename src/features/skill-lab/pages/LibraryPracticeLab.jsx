import { motion, useReducedMotion } from 'framer-motion';
import PracticeHome from '../components/PracticeHome';
import { RetryBar, RetryPanel } from '../components/RetryMistake';
import { retryQuestions, retryRows } from '../retryModel';
import PassageHighlighter from '../components/PassageHighlighter';
import PracticeTranscript from '../components/PracticeTranscript';
import { withTestNumbers } from '../practiceNumbering';
import SessionProgressBar from '../components/SessionProgressBar';
import { questionSlots } from '../practiceHomeModel';
import { ResultSummary, ReviewList } from '../components/PracticeResults';
import { buildReviewRows, questionRangeLabel } from '../practiceReview';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { focusLabel } from '../practiceLabels';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatLibraryText } from '../libraryText';
import { getSupabaseFunctionHeaders } from '@/lib/csrf';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { PANEL, WELL, MUTED, TITLE } from '@/features/dashboard/components/primitives.jsx';
import MatchingRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/MatchingRenderer';
import MultipleChoiceRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/MultipleChoiceRenderer';
import TrueFalseRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/TrueFalseRenderer';
import {
  FlowchartRenderer,
  NotesCompletionRenderer,
  TableCompletionRenderer,
} from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers';
import ListeningQuestions from '@/features/testing/listening/components/ListeningTest/components/QuestionRendererDispatcher';
import QuestionInput from '@/features/testing/reading/components/ReadingTest/components/QuestionInput';
import { Input } from '@/components/ui/input';

const title = focusLabel;
async function action(actionName, data = {}) {
  const { data: result, error } = await supabase.functions.invoke('skill-lab', {
    headers: getSupabaseFunctionHeaders(),
    body: { library: true, catalogueVersion: 2, action: actionName, ...data },
  });
  if (error || result?.error) {
    let message = result?.error;
    try {
      message = (await error?.context?.json())?.error || message;
    } catch {
      /* Generic safe fallback. */
    }
    throw new Error(message || 'Practice could not be loaded. Please try again.');
  }
  return result;
}
function sourcePassageTitle(source) {
  const direct = source?.passage_title || source?.passageTitle;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const content = String(source?.content || '')
    .replace(/\\n/g, '\n')
    .trim();
  const candidate =
    content.match(/^\s*\[center\]\s*([\s\S]*?)\s*\[\/center\]/i)?.[1] ||
    content.match(/^\s*<h[1-6][^>]*>\s*([\s\S]*?)\s*<\/h[1-6]>/i)?.[1] ||
    content.match(/^\s*\[(?:heading|title)\]\s*([\s\S]*?)\s*\[\/(?:heading|title)\]/i)?.[1];
  if (!candidate) return null;
  const title = candidate
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*[*_]+|[*_]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return title &&
    !/^(?:reading\s+)?passage(?:\s+\d+)?$/i.test(title) &&
    !/^part\s*(?:\d+|[ivx]+)$/i.test(title) &&
    !/^[A-G]$/i.test(title)
    ? title
    : null;
}

function hasRenderableQuestion(question, module) {
  if (module === 'listening') return true;
  if (question.type === 'matching_headings') {
    return (
      (Array.isArray(question.questions) && question.questions.length > 0) ||
      (Array.isArray(question.matching_data?.paragraphs) &&
        question.matching_data.paragraphs.length > 0)
    );
  }
  if (question.type === 'matching_features') {
    return (
      (Array.isArray(question.questions) && question.questions.length > 0) ||
      (Array.isArray(question.matching_features?.questions) &&
        question.matching_features.questions.length > 0) ||
      (Array.isArray(question.matching_features?.paragraphs) &&
        question.matching_features.paragraphs.length > 0)
    );
  }
  if (question.type === 'matching') {
    return Boolean(
      (Array.isArray(question.options) && question.options.length > 0) || question.question_text
    );
  }
  return true;
}

export function parseGroupInstructions(rawInstructions) {
  if (!rawInstructions) return { range: null, body: '' };
  let text = String(rawInstructions).replace(/\\n/g, '\n').trim();

  // Strip wrapping BBCode [heading]...[/heading] if present at the start
  const bbHeadingMatch = text.match(/^\[(?:heading|title)\]([\s\S]*?)\[\/(?:heading|title)\]\s*/i);
  let range = null;
  if (bbHeadingMatch) {
    range = bbHeadingMatch[1].trim();
    text = text.slice(bbHeadingMatch[0].length).trim();
  }

  // If no BBCode heading, check for plain "Questions X-Y" or "Questions X to Y"
  if (!range) {
    const rangeMatch = text.match(
      /^(Questions?\s+\d+(?:[\s–\-\u2013\u2014to]+\d+)?)(?:\s*[:.\-–—]\s*|\s*\n+|$)/i
    );
    if (rangeMatch) {
      range = rangeMatch[1].trim();
      text = text.slice(rangeMatch[0].length).trim();
    }
  }

  return { range, body: text };
}

export function QuestionGroupInstructions({ instructions }) {
  if (!instructions || !String(instructions).trim()) return null;

  const { range, body } = parseGroupInstructions(instructions);
  const formattedHtml = body ? formatLibraryText(body) : null;

  return (
    <div
      className="relative mb-3.5 overflow-hidden rounded-xl border border-[#5a63df]/20 bg-linear-to-b from-[#5a63df]/[0.04] to-[#faf9ff] p-3 pl-3.5 sm:p-3.5 sm:pl-4 dark:border-[#8f97ff]/25 dark:from-[#171622] dark:to-[#121118]"
      role="region"
      aria-label={range ? `Instructions for ${range}` : 'Question instructions'}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5a63df] dark:bg-[#8f97ff]"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h3 className={cn(TITLE, 'text-[13px] font-bold text-slate-800 dark:text-slate-100')}>
            {range || 'Task Instructions'}
          </h3>
        </div>
      </div>

      {formattedHtml && (
        <div
          className="mt-2 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:px-1 [&_strong]:py-0.5 [&_strong]:rounded [&_strong]:bg-[#5a63df]/10 dark:[&_strong]:bg-[#8f97ff]/18 [&_hr]:my-2 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      )}
    </div>
  );
}

function ImmediateAnswerInput({ onChange, ...props }) {
  return <Input {...props} onChange={(event) => onChange(event.target.value)} />;
}

function ReadingShortAnswer({ question, ...props }) {
  const text = question.question_text || '';
  return (
    <QuestionInput
      {...props}
      text={/_____|\[\d+\]/.test(text) ? text : `${text} [${question.question_number}]`}
      questionId={question.id}
      globalNum={question.question_number}
    />
  );
}

const READING_QUESTION_RENDERERS = {
  multiple_choice: MultipleChoiceRenderer,
  true_false_not_given: TrueFalseRenderer,
  yes_no_not_given: TrueFalseRenderer,
  notes_completion: NotesCompletionRenderer,
  table_completion: TableCompletionRenderer,
  flowchart: FlowchartRenderer,
  short_answer: ReadingShortAnswer,
};

function QuestionBody({ module, question, props }) {
  if (module === 'listening') return <ListeningQuestions {...props} />;
  if (question.type.startsWith('matching')) {
    return hasRenderableQuestion(question, module) ? (
      <MatchingRenderer {...props} />
    ) : (
      <p className={`${WELL} rounded-lg p-3 text-xs leading-relaxed ${MUTED}`}>
        This question set is missing its original question details, so it cannot be practised here.
        Open the source test to view the complete set.
      </p>
    );
  }
  const Renderer = READING_QUESTION_RENDERERS[question.type];
  return Renderer ? (
    <Renderer {...props} />
  ) : (
    <p className={MUTED}>Open this question type in the test library.</p>
  );
}

function ReadingQuestionPrompt({ question }) {
  if (question.type === 'short_answer' || !question.question_text) return null;
  return (
    <p className="text-sm font-semibold leading-snug">
      {question.question_number}. {question.question_text}
    </p>
  );
}

function Questions({ questions, module, answers, onChange }) {
  return questions.map((question, index) => {
    const props = {
      question,
      allQuestions: questions,
      answers,
      onAnswerChange: onChange,
      handleAnswerChange: onChange,
      flaggedQuestions: new Set(),
      onToggleFlag: () => {},
      toggleFlag: () => {},
      isFinished: false,
      validationMap: {},
      correctAnswersMap: {},
      AnswerInput: ImmediateAnswerInput,
      handleMultiSelectChange: (id, value, checked, limit) => {
        const previous = Array.isArray(answers[id]) ? answers[id] : [];
        const next = checked
          ? [...new Set([...previous, value])]
          : previous.filter((v) => v !== value);
        if (!checked || !limit || next.length <= limit) onChange(id, next);
      },
    };
    const isListening = module === 'listening';
    return (
      <article
        key={question.id}
        data-question-id={question.id}
        className={`min-w-0 overflow-x-auto border-b border-[#e4e2f0] py-2.5 space-y-2 last:border-0 dark:border-white/[0.07]`}
      >
        {question.group_instructions &&
          questions[index - 1]?.group_instructions !== question.group_instructions && (
            <QuestionGroupInstructions instructions={question.group_instructions} />
          )}
        {/* The listening renderer already prints the question; repeating it doubled the heading. */}
        {!isListening && <ReadingQuestionPrompt question={question} />}
        <QuestionBody module={module} question={question} props={props} />
      </article>
    );
  });
}
function AudioNote({ source, questionRange }) {
  return (
    <p className={`text-xs ${MUTED}`}>
      {source.audio_scope === 'full_test'
        ? 'The original full recording is provided because a separate section is unavailable. Listen for the part containing these questions.'
        : 'Listen to the original recording for this part. Answer only the questions in your set.'}
      {questionRange && (
        <>
          {' '}
          Your set covers <strong className="font-semibold">{questionRange}</strong>
          {source.section ? ` of Part ${source.section}` : ''}; the recording plays the whole part.
        </>
      )}
    </p>
  );
}
function Source({ source, highlightKey }) {
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  const passageTitle = sourcePassageTitle(source);
  return (
    <section
      className={`${PANEL} flex flex-col flex-1 h-full p-3.5 sm:p-4 space-y-2.5`}
      aria-label="Original passage or audio"
    >
      <div className="border-b border-[#eeedf7] pb-2 dark:border-white/[0.08]">
        <h2 className={`${TITLE} text-center`}>
          {passageTitle || (source.audio_url ? 'Listening audio' : 'Reading passage')}
          {source.section ? ` · Part ${source.section}` : ''}
        </h2>
      </div>
      {source.audio_url && (
        <>
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={source.audio_url}
            onError={() => setAudioError(true)}
            className="w-full"
          />
          <PracticeTranscript source={source} audioRef={audioRef} />
          {audioError && (
            <p role="alert">
              Audio could not load. Your answers are saved when you choose Save and exit. Reload to
              try again.
            </p>
          )}
        </>
      )}
      {!source.audio_url && (
        <PassageHighlighter storageKey={highlightKey}>
          <div
            data-passage-body
            className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800 dark:text-slate-200 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: formatLibraryText(source.content) }}
          />
        </PassageHighlighter>
      )}
    </section>
  );
}
const AUTOSAVE_DEBOUNCE_MS = 1200;

export default function LibraryPracticeLab() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [focus, setFocus] = useState(params.get('focus') || '');
  const [answers, setAnswers] = useState({});
  // null until the learner moves; the starting step is derived from the saved session.
  const [chosenStep, setChosenStep] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [tab, setTab] = useState('questions');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  // The retry is for learning only: never saved, submitted or scored.
  const [retry, setRetry] = useState({ answers: {}, revealed: false });
  const [completedResult, setCompletedResult] = useState(null);
  const shouldReduceMotion = useReducedMotion();
  const startId = useRef(null);
  const hydratedSession = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const answersRef = useRef({});
  // Answers used to hit the `practice-lab-autosave` edge function once per
  // keystroke. Typing a gap-fill answer fired a POST per character, which is
  // both rate-limit bait and pointless work — the sessionStorage mirror below
  // already makes the current tab crash-safe. The network write is debounced;
  // `flushAutosave` is the barrier every explicit save/stage transition takes so
  // a queued keystroke write can never land after (and overwrite) a later save.
  const autosaveTimer = useRef(null);
  const pendingAutosave = useRef(null);
  const query = useQuery({
    queryKey: ['practice-library', user?.id, sessionId || 'dashboard'],
    enabled: Boolean(user?.id),
    queryFn: () => action(sessionId ? 'resume' : 'dashboard', { sessionId }),
    retry: 1,
  });
  useEffect(() => {
    if (sessionId && query.data && hydratedSession.current !== sessionId) {
      let restored = query.data.answers || {};
      try {
        restored =
          JSON.parse(
            sessionStorage.getItem(`practice-library:${user?.id}:${sessionId}`) || 'null'
          ) || restored;
      } catch {
        // Server-saved answers remain available when browser storage is disabled.
      }
      hydratedSession.current = sessionId;
      setSaveState('idle');
      setRetry({ answers: {}, revealed: false });
      answersRef.current = restored;
      setAnswers(restored);
      setChosenStep(null);
      setReviewFilter('all');
      setCompletedResult(query.data.result || null);
    }
  }, [sessionId, query.data, user?.id]);
  // Sends whatever answers are queued, if any, and clears the pending timer.
  // Safe to call when nothing is queued.
  function flushAutosave() {
    if (autosaveTimer.current !== null) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    const next = pendingAutosave.current;
    if (next === null) return saveQueue.current;
    pendingAutosave.current = null;
    // An older request must not report "Saved" while newer answers are waiting.
    const isLatest = () => pendingAutosave.current === null && answersRef.current === next;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => action('save', { sessionId, answers: next, stage: 2 }))
      .then(() => {
        if (isLatest()) setSaveState('saved');
      })
      .catch(() => {
        if (isLatest()) setSaveState('error');
        setError(
          'Your latest answers are saved in this tab. Check your connection, then choose Save and exit.'
        );
      });
    return saveQueue.current;
  }

  function changeAnswer(id, value) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    try {
      sessionStorage.setItem(`practice-library:${user?.id}:${sessionId}`, JSON.stringify(next));
    } catch {
      /* Server autosave remains available. */
    }
    // Trailing debounce: the last answer state within the window is the one
    // that gets sent, so rapid typing costs one request instead of one per key.
    pendingAutosave.current = next;
    setSaveState('saving');
    if (autosaveTimer.current !== null) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null;
      flushAutosave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }
  // A debounced answer must not be lost if the learner navigates away or closes
  // the tab inside the debounce window. `pagehide` is the event that actually
  // fires on mobile Safari when a tab is discarded; unmount covers in-app
  // navigation. sessionStorage already holds the answers either way, so this is
  // about getting them to the server, not about local recovery.
  useEffect(() => {
    const onPageHide = () => flushAutosave();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      flushAutosave();
    };
    // flushAutosave closes over refs and `sessionId`; re-binding per session is
    // correct, and re-binding on every render would defeat the unmount flush.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function run(work) {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function start(group) {
    await run(async () => {
      if (!startId.current || startId.current.group !== group.id)
        startId.current = { group: group.id, id: crypto.randomUUID() };
      const session = await action('start', {
        groupId: group.id,
        requestId: startId.current.id,
        sourceSessionId: params.get('sourceId'),
        activityId:
          !params.get('focus') || params.get('focus') === group.focus
            ? params.get('activityId')
            : null,
      });
      startId.current = null;
      navigate(`/practice-lab/session/${session.id}?library=1`);
    });
  }
  if (query.isPending)
    return (
      <div className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />
        <div
          role="status"
          aria-label="Loading your practice"
          className="relative z-10 mx-auto max-w-7xl space-y-3.5 motion-safe:animate-pulse"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="h-3 w-36 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-7 w-48 rounded bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-8 w-32 rounded bg-slate-200 dark:bg-white/10" />
          </div>
          {sessionId ? (
            <div className="grid grid-cols-12 gap-3.5">
              <div className={`${PANEL} col-span-12 h-80 lg:col-span-8`} />
              <div className={`${PANEL} col-span-12 h-80 lg:col-span-4`} />
            </div>
          ) : (
            <>
              <div className={`${PANEL} h-56`} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`${PANEL} h-32`} />
                <div className={`${PANEL} h-32`} />
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`${PANEL} h-36`} />
                ))}
              </div>
            </>
          )}
          <span className="sr-only">Loading your practice…</span>
        </div>
      </div>
    );
  if (query.error)
    return (
      <main className="relative min-h-full overflow-hidden bg-[#f8f8fb] px-3 py-4 text-slate-950 dark:bg-[#08080a] dark:text-white sm:px-4 md:px-5 md:py-5">
        <div className="relative z-10 mx-auto max-w-lg">
          <div className={`${PANEL} p-5 text-center`} role="alert">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {query.error.message}
            </p>
            <Button className="mt-4" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  const data = query.data;
  const alert = error && (
    <p role="alert" className={`${WELL} p-3`}>
      {error}
    </p>
  );
  if (sessionId) {
    const gradedResult = data.result || completedResult;
    const retryList = retryQuestions(data.mistake, data.questions);
    const hasMistake = retryList.length > 0;
    // Old sessions saved stage 1 ("approach") and 2 (questions); both now mean practising.
    const step =
      chosenStep || (gradedResult ? 'results' : hasMistake && !data.stage ? 'review' : 'practise');
    const steps = [
      hasMistake && { id: 'review', label: 'Retry your mistake' },
      { id: 'practise', label: 'Try the questions' },
      { id: 'results', label: 'Check answers' },
    ].filter(Boolean);
    const stepIndex = steps.findIndex((entry) => entry.id === step);
    const reviewing = step === 'review';
    const module = data.focus.split(':')[0];
    const isListening = module === 'listening';
    const source = reviewing ? data.mistake : data.source;
    const reviewQuestions = reviewing ? retryList : data.questions;
    const reviewRows =
      step === 'results'
        ? buildReviewRows({
            questions: data.questions,
            result: gradedResult,
            answers,
            explanations: data.explanations,
          })
        : [];
    const retried = reviewing ? retryRows(data.mistake, retryList, retry.answers) : [];
    const changeRetry = (id, value) =>
      setRetry((current) => ({ ...current, answers: { ...current.answers, [id]: value } }));
    const jumpToAnswer = (number) => {
      setReviewFilter('all');
      setTab('questions');
      requestAnimationFrame(() =>
        document
          .getElementById(`review-q-${number}`)
          ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'center' })
      );
    };
    const jumpToQuestion = (slot) => {
      setTab('questions');
      requestAnimationFrame(() =>
        document
          .querySelector(`[data-question-id="${slot.questionId}"]`)
          ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'center' })
      );
    };
    const startPractising = () =>
      run(async () => {
        await flushAutosave().catch(() => {});
        await action('save', { sessionId, answers, stage: 2 });
        setChosenStep('practise');
      });
    const finish = () =>
      run(async () => {
        await saveQueue.current.catch(() => {});
        const result = await action('submit', { sessionId, answers });
        try {
          sessionStorage.removeItem(`practice-library:${user?.id}:${sessionId}`);
        } catch {
          // Nothing to clean up when browser storage is unavailable.
        }
        cache.setQueryData(['practice-library', user?.id, sessionId], result);
        setCompletedResult(result.result || null);
        setReviewFilter('all');
        setChosenStep('results');
        await Promise.all(
          ['practice-library', 'learningPath', 'learning-path', 'analytics', 'dashboard'].map(
            (key) => cache.invalidateQueries({ queryKey: [key] })
          )
        );
      });
    const save = () =>
      run(async () => {
        await flushAutosave().catch(() => {});
        await action('save', { sessionId, answers, stage: reviewing ? 0 : 2 });
        navigate(
          `/practice-lab?module=${module}&focus=${encodeURIComponent(data.category || data.focus)}`
        );
      });
    return (
      <main className="mx-auto max-w-7xl space-y-2 px-3 py-2 pb-16 md:px-5 md:pb-16">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Button
            variant="outline"
            disabled={busy}
            onClick={save}
            className="h-7 shrink-0 gap-1.5 px-2.5 text-xs shadow-none hover:translate-y-0 hover:shadow-none sm:px-3"
            aria-label="Save and exit"
          >
            <ArrowLeft size={14} />
            Save and exit
          </Button>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-[11px] font-semibold leading-tight ${MUTED}`}>
              {title(data.category || data.focus)}
            </p>
            <h1 className="truncate text-[15px] font-bold leading-tight" tabIndex={-1}>
              {data.source.title}
            </h1>
          </div>
          {/* The old result page shows answers, so it waits until this set is graded. */}
          {step === 'results' && data.source_session_id && (
            <Link
              className="order-2 ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e4e2f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5a63df] transition-colors hover:border-[#5a63df]/40 hover:bg-[#f7f6fd] dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-[#afb5ff] dark:hover:bg-white/[0.07]"
              to={`/${module}-test/${data.source_session_id}?view-results=true`}
            >
              View test result
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </header>
        <ol
          className={`${WELL} grid gap-1 rounded-lg p-1 ${steps.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
          aria-label="Practice workflow stages"
        >
          {steps.map((entry, index) => {
            const isCurrent = index === stepIndex;
            const isCompleted = index < stepIndex;
            return (
              <li
                key={entry.id}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs transition-all duration-150 ${
                  isCurrent
                    ? 'bg-white font-bold text-[#5a63df] shadow-xs dark:bg-white/[0.10] dark:text-[#afb5ff]'
                    : isCompleted
                      ? 'font-medium text-slate-700 dark:text-slate-300'
                      : MUTED
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-[#5a63df] text-white shadow-3xs'
                      : isCompleted
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                        : 'bg-white/70 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={11} strokeWidth={2.5} /> : index + 1}
                </span>
                <span className="truncate">{entry.label}</span>
              </li>
            );
          })}
        </ol>
        {alert}
        {data.familiarity === 'repeated' && step !== 'results' && (
          <p className={`${WELL} rounded-lg p-2.5 text-xs font-semibold`}>
            Revision: you have answered these questions before.
          </p>
        )}
        {step === 'results' && gradedResult && (
          <ResultSummary
            result={gradedResult}
            rows={reviewRows}
            familiarity={data.familiarity}
            showLearningPath={Boolean(data.activity_id)}
            onJump={jumpToAnswer}
          />
        )}
        {isListening && (
          <>
            <AudioNote source={source} questionRange={questionRangeLabel(reviewQuestions)} />
            <div data-testid="sticky-audio" className="sticky top-0 z-20">
              <Source
                key={`${sessionId}:${reviewing ? 'mistake' : 'practice'}`}
                source={source}
                highlightKey={`practice-highlights:${user?.id}:${sessionId}:${reviewing ? 'mistake' : 'practice'}`}
              />
            </div>
          </>
        )}
        {!isListening && (
          <div
            className={`${WELL} relative flex gap-1 rounded-lg p-1 md:hidden`}
            role="group"
            aria-label="Content view"
          >
            {[
              { id: 'passage', label: 'Passage / audio' },
              {
                id: 'questions',
                label:
                  step === 'results' || (reviewing && retry.revealed) ? 'Answers' : 'Questions',
              },
            ].map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={`relative flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors duration-200 ${
                  tab === entry.id
                    ? 'text-[#5a63df] dark:text-[#afb5ff]'
                    : `${MUTED} hover:text-slate-900 dark:hover:text-slate-100`
                }`}
              >
                {tab === entry.id && (
                  <motion.span
                    layoutId="mobile-practice-active-tab"
                    className="absolute inset-0 rounded-md bg-white shadow-xs dark:bg-white/10 dark:shadow-none"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 480, damping: 32 }
                    }
                  />
                )}
                <span className="relative z-10">{entry.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className={isListening ? 'grid gap-3' : 'grid gap-3 md:grid-cols-2 md:items-stretch'}>
          {!isListening && (
            <div
              className={`${tab !== 'passage' ? 'hidden md:flex md:flex-col' : 'flex flex-col'} min-w-0 md:sticky md:top-4 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto h-full`}
            >
              <Source
                key={`${sessionId}:${reviewing ? 'mistake' : 'practice'}`}
                source={source}
                highlightKey={`practice-highlights:${user?.id}:${sessionId}:${reviewing ? 'mistake' : 'practice'}`}
              />
            </div>
          )}
          <div
            className={`${tab !== 'questions' && !isListening ? 'hidden md:flex md:flex-col' : 'flex flex-col'} ${PANEL} min-w-0 p-3.5 sm:p-4 h-full`}
          >
            {reviewing && (
              <RetryPanel revealed={retry.revealed} rows={retried} isListening={isListening}>
                <Questions
                  questions={withTestNumbers(retryList)}
                  module={module}
                  answers={retry.answers}
                  onChange={changeRetry}
                />
              </RetryPanel>
            )}
            {step === 'results' && (
              <ReviewList
                rows={reviewRows}
                filter={reviewFilter}
                onFilterChange={setReviewFilter}
              />
            )}
            {step === 'practise' && (
              <Questions
                questions={withTestNumbers(data.questions)}
                module={module}
                answers={answers}
                onChange={changeAnswer}
              />
            )}
          </div>
        </div>
        {step === 'review' && (
          <RetryBar
            revealed={retry.revealed}
            canReveal={retried.some((row) => row.nowText)}
            busy={busy}
            onReveal={() => setRetry((current) => ({ ...current, revealed: true }))}
            onContinue={startPractising}
          />
        )}
        {step === 'practise' && (
          <SessionProgressBar
            slots={questionSlots(data.questions, answers)}
            answers={answers}
            saveState={saveState}
            busy={busy}
            onJump={jumpToQuestion}
            onSubmit={finish}
          />
        )}
      </main>
    );
  }
  return (
    <PracticeHome
      data={data}
      focus={focus}
      setFocus={setFocus}
      module={params.get('module')}
      activityId={params.get('activityId')}
      busy={busy}
      error={alert}
      start={start}
    />
  );
}
