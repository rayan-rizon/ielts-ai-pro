import { createPortal } from 'react-dom';
import PracticeHome from '../components/PracticeHome';
import { Sparkles, X, ArrowUp, ArrowLeft } from 'lucide-react';
import { focusLabel } from '../practiceLabels';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';
import { sanitizeHtml } from '@/lib/security';
import { getSupabaseFunctionHeaders } from '@/lib/csrf';
import { Button } from '@/components/ui/button';
import {
  PANEL,
  WELL,
  TILE,
  MICRO,
  MUTED,
  NUM,
  TITLE,
  Pill,
} from '@/features/dashboard/components/primitives.jsx';
import MatchingRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/MatchingRenderer';
import MultipleChoiceRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/MultipleChoiceRenderer';
import TrueFalseRenderer from '@/features/testing/reading/components/ReadingTest/components/QuestionRenderers/TrueFalseRenderer';
import ListeningQuestions from '@/features/testing/listening/components/ListeningTest/components/QuestionRendererDispatcher';

const title = focusLabel;
function formatLibraryText(value = '') {
  return sanitizeHtml(
    String(value)
      // Some older library passages use BBCode-style alignment markers.
      // Convert the supported one to a real block, and remove any other
      // alignment markers so learners never see storage markup.
      .replace(
        /\[center\]([\s\S]*?)\[\/center\]/gi,
        '<div class="text-center font-semibold">$1</div>'
      )
      .replace(/\[\/?(?:left|right|justify)\]/gi, '')
      .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  );
}
async function action(actionName, data = {}) {
  const { data: result, error } = await supabase.functions.invoke('skill-lab', {
    headers: getSupabaseFunctionHeaders(),
    body: { library: true, action: actionName, ...data },
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
function Questions({ questions, module, answers, onChange, result, explanations = [] }) {
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
      isFinished: Boolean(result),
      validationMap: result?.answers || {},
      correctAnswersMap: result?.answers || {},
      handleMultiSelectChange: (id, value, checked, limit) => {
        const previous = Array.isArray(answers[id]) ? answers[id] : [];
        const next = checked
          ? [...new Set([...previous, value])]
          : previous.filter((v) => v !== value);
        if (!checked || !limit || next.length <= limit) onChange(id, next);
      },
    };
    return (
      <article
        key={question.id}
        className={`min-w-0 overflow-x-auto border-b border-[#e4e2f0] py-3 space-y-3 last:border-0 dark:border-white/[0.07]`}
      >
        {question.group_instructions &&
          questions[index - 1]?.group_instructions !== question.group_instructions && (
            <div
              className={`border-b border-[#e4e2f0] pb-3 text-sm leading-relaxed whitespace-pre-line [&_strong]:mr-1 dark:border-white/[0.07]`}
              dangerouslySetInnerHTML={{ __html: formatLibraryText(question.group_instructions) }}
            />
          )}
        <p className="font-medium">
          {question.question_number}. {question.question_text}
        </p>
        {module === 'listening' ? (
          <ListeningQuestions {...props} />
        ) : question.type.startsWith('matching') ? (
          <MatchingRenderer {...props} />
        ) : question.type === 'multiple_choice' ? (
          <MultipleChoiceRenderer {...props} />
        ) : ['true_false_not_given', 'yes_no_not_given'].includes(question.type) ? (
          <TrueFalseRenderer {...props} />
        ) : (
          <p className={MUTED}>Open this question type in the test library.</p>
        )}
        {result && (
          <div
            className="space-y-2"
            aria-label={`Feedback for question ${question.question_number}`}
          >
            {Object.entries(result.answers || {})
              .filter(([id]) => id === question.id || id.startsWith(`${question.id}_`))
              .sort(([, a], [, b]) => Number(a.questionNumber || 0) - Number(b.questionNumber || 0))
              .map(([id, item]) => (
                <div key={id} className={`${WELL} rounded-lg p-3 text-xs`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${MICRO} ${MUTED}`}>
                      Question {item.questionNumber || question.question_number}
                    </span>
                    <Pill tone={item.isCorrect ? 'ok' : 'warn'}>
                      {item.isCorrect ? 'Correct' : 'Review this answer'}
                    </Pill>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p className={MUTED}>Your answer</p>
                      <p className="mt-1 font-medium">
                        {String(item.userAnswer || answers[id] || 'Not answered')}
                      </p>
                    </div>
                    <div>
                      <p className={MUTED}>Correct answer</p>
                      <p className="mt-1 font-semibold">
                        {Array.isArray(item.correctAnswer)
                          ? item.correctAnswer.join(' / ')
                          : String(item.correctAnswer ?? 'Unavailable')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            {explanations
              .filter((e) => e.id === question.id && e.text)
              .map((e) => (
                <p key={e.id} className="whitespace-pre-wrap text-xs leading-relaxed">
                  {e.text}
                </p>
              ))}
          </div>
        )}
      </article>
    );
  });
}
function Source({ source }) {
  const [audioError, setAudioError] = useState(false);
  return (
    <section className={`${PANEL} p-3 space-y-2`} aria-label="Original passage or audio">
      <h2 className={TITLE}>
        {source.audio_url ? 'Listening audio' : 'Reading passage'}
        {source.section ? ` · Part ${source.section}` : ''}
      </h2>
      {source.audio_url && (
        <p className={`text-xs ${MUTED}`}>
          {source.audio_scope === 'full_test'
            ? 'The original full recording is provided because a separate section is unavailable. Listen for the part containing these questions.'
            : 'Listen to the original recording for this part. Answer only the questions in your set.'}
        </p>
      )}
      {source.audio_url && (
        <>
          <audio
            controls
            preload="metadata"
            src={source.audio_url}
            onError={() => setAudioError(true)}
            className="w-full"
          />
          {audioError && (
            <p role="alert">
              Audio could not load. Your answers are saved when you go back to Practice Lab. Reload
              to try again.
            </p>
          )}
        </>
      )}
      {!source.audio_url && (
        <div
          className="whitespace-pre-wrap break-words text-sm leading-7 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: formatLibraryText(source.content) }}
        />
      )}
    </section>
  );
}
function TeacherHelp({ sessionId }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [helpError, setHelpError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const { user } = useAuth();
  const paid =
    user?.role === 'admin' ||
    (['pro', 'premium'].includes(user?.subscription_tier) &&
      (!user.subscription_end_date || Date.parse(user.subscription_end_date) > Date.now()));
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  async function ask(event) {
    event.preventDefault();
    if (busy || !question.trim()) return;
    setBusy(true);
    setHelpError('');
    setResponse('');
    try {
      const result = await action('help', {
        sessionId,
        kind: 'help',
        answer: question,
        requestId: crypto.randomUUID(),
      });
      setResponse(`${result.explanation}\n\n${result.next_step}`);
    } catch (e) {
      setHelpError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return createPortal(
    <aside
      aria-label="AI teacher"
      className="fixed bottom-4 right-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-5 sm:right-5"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
      }}
    >
      {open && (
        <section
          id="practice-teacher-panel"
          aria-labelledby="practice-teacher-title"
          className={`${PANEL} w-80 max-w-full overflow-hidden`}
        >
          <header className="flex items-center justify-between gap-2 border-b border-[#e4e2f0] px-3 py-2.5 dark:border-white/10">
            <div>
              <h2 id="practice-teacher-title" className={`${TITLE} flex items-center gap-2`}>
                <Sparkles size={14} className="text-[#5a63df] dark:text-[#afb5ff]" />
                Your AI teacher
              </h2>
              <p className={`mt-0.5 text-[10px] ${MUTED}`}>Focused on this set and your progress</p>
            </div>
            <button
              type="button"
              aria-label="Close AI teacher"
              onClick={close}
              className="rounded-md p-2 hover:bg-[#5a63df]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
            >
              <X size={14} />
            </button>
          </header>
          <div className="max-h-[60dvh] space-y-3 overflow-y-auto p-3">
            {!paid ? (
              <>
                <p className={`text-xs leading-relaxed ${MUTED}`}>
                  Get a clearer explanation of your answers with Pro or Premium. The saved tips
                  remain free.
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex rounded-lg bg-[#5a63df] px-3 py-2 text-xs font-semibold text-white"
                >
                  Explore plans
                </Link>
              </>
            ) : (
              <>
                {!response && !busy && (
                  <div className="flex flex-wrap gap-1.5">
                    {['Explain my mistake', 'Suggest an approach'].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setQuestion(prompt);
                          inputRef.current?.focus();
                        }}
                        className={`${TILE} px-2 py-1.5 text-[11px] hover:border-[#5a63df]/40 focus-visible:ring-2 focus-visible:ring-[#5a63df]`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                {response && (
                  <div
                    aria-live="polite"
                    className={`${WELL} rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap`}
                  >
                    {response}
                  </div>
                )}
                {helpError && (
                  <p role="alert" className={`${WELL} rounded-lg p-3 text-xs leading-relaxed`}>
                    {helpError}
                  </p>
                )}
                {busy && (
                  <p role="status" className={`text-xs ${MUTED}`}>
                    Preparing your explanation…
                  </p>
                )}
                <form onSubmit={ask} className="space-y-2">
                  <label className="sr-only" htmlFor="practice-teacher-question">
                    Your question
                  </label>
                  <textarea
                    id="practice-teacher-question"
                    ref={inputRef}
                    rows={2}
                    maxLength={600}
                    placeholder="Ask about this set…"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className={`${TILE} w-full resize-none p-2.5 text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] ${MUTED}`}>3 questions included per set</span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={busy || !question.trim()}
                      className="h-8 px-3 text-xs"
                      aria-label="Ask your teacher"
                    >
                      Ask <ArrowUp size={13} className="ml-1" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      )}
      <button
        ref={triggerRef}
        type="button"
        aria-controls="practice-teacher-panel"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border border-[#5a63df]/30 bg-[#5a63df] px-4 py-2.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 hover:bg-[#4c55cd]"
      >
        <Sparkles size={15} />
        {open ? 'AI teacher' : 'Ask your AI teacher'}
        {busy && <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" />}
      </button>
    </aside>,
    document.body
  );
}
export default function LibraryPracticeLab() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [focus, setFocus] = useState(params.get('focus') || '');
  const [answers, setAnswers] = useState({});
  const [stage, setStage] = useState(0);
  const [tab, setTab] = useState('questions');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);
  const startId = useRef(null);
  const hydratedSession = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const answersRef = useRef({});
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
      answersRef.current = restored;
      setAnswers(restored);
      setStage(query.data.result ? 3 : query.data.stage || 0);
      setCompletedResult(query.data.result || null);
    }
  }, [sessionId, query.data, user?.id]);
  function changeAnswer(id, value) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    try {
      sessionStorage.setItem(`practice-library:${user?.id}:${sessionId}`, JSON.stringify(next));
    } catch {
      /* Server autosave remains available. */
    }
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => action('save', { sessionId, answers: next, stage: 2 }))
      .catch(() =>
        setError(
          'Your latest answers are saved in this tab. Check your connection, then go back to Practice Lab.'
        )
      );
  }
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
        activityId: params.get('activityId'),
      });
      startId.current = null;
      navigate(`/practice-lab/session/${session.id}?library=1`);
    });
  }
  if (query.isPending)
    return (
      <div
        role="status"
        aria-label="Loading your practice"
        className="mx-auto max-w-7xl space-y-3 p-4 md:p-6 motion-safe:animate-pulse"
      >
        <div className={`${WELL} h-12 rounded-lg`} />
        {!sessionId && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${PANEL} h-20`} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-12 gap-3">
          <div className={`${PANEL} col-span-12 h-80 lg:col-span-8`} />
          <div className={`${PANEL} col-span-12 h-80 lg:col-span-4`} />
        </div>
        {!sessionId && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`${PANEL} h-24`} />
            ))}
          </div>
        )}
        <span className="sr-only">Loading your practice…</span>
      </div>
    );
  if (query.error)
    return (
      <div className={`${PANEL} m-4 p-5`} role="alert">
        <p>{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
      </div>
    );
  const data = query.data;
  const alert = error && (
    <p role="alert" className={`${WELL} p-3`}>
      {error}
    </p>
  );
  if (sessionId) {
    const labels = [
      data.mistake ? 'Review your mistake' : 'Your starting point',
      'Try this approach',
      'Practise another set',
      'Review your answers',
    ];
    const reviewing = stage === 0 && data.mistake;
    const source = reviewing ? data.mistake : data.source;
    const gradedResult = data.result || completedResult;
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
        setStage(3);
        await Promise.all(
          ['practice-library', 'learningPath', 'learning-path', 'analytics', 'dashboard'].map(
            (key) => cache.invalidateQueries({ queryKey: [key] })
          )
        );
      });
    const save = () =>
      run(async () => {
        await saveQueue.current.catch(() => {});
        await action('save', { sessionId, answers, stage });
        navigate('/practice-lab');
      });
    return (
      <main className="mx-auto max-w-7xl space-y-3 px-3 py-3 pb-16 md:px-5 md:py-4 md:pb-16">
        <header
          className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e2f0] pb-3 dark:border-white/[0.07]`}
        >
          <div>
            <p className={MICRO}>Practice Lab · {title(data.focus)}</p>
            <h1 className="text-xl font-semibold" tabIndex={-1}>
              {data.source.title}
            </h1>
            <p className={`mt-1 text-xs ${MUTED}`}>
              Step {stage + 1} of 4 · {labels[stage]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={save}
              className="gap-1.5"
              aria-label="Back to Practice Lab"
            >
              <ArrowLeft size={14} />
              Back to Practice Lab
            </Button>
            {data.source_session_id && (
              <Link
                className="text-xs text-[#5a63df] underline underline-offset-2"
                to={`/${data.focus.split(':')[0]}-test/${data.source_session_id}?view-results=true`}
              >
                Test result
              </Link>
            )}
          </div>
        </header>
        <ol className="flex flex-wrap gap-x-4 gap-y-1">
          {labels.map((label, index) => (
            <li
              key={label}
              aria-current={index === stage ? 'step' : undefined}
              className={`py-1 text-xs ${index === stage ? 'font-semibold text-[#5a63df] dark:text-[#afb5ff]' : MUTED}`}
            >
              <span className={NUM}>{index + 1}.</span> {label}
            </li>
          ))}
        </ol>
        {alert}
        {stage === 3 && gradedResult && (
          <section
            className={`${WELL} flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5`}
            aria-label="Practice result"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={`${NUM} text-lg font-semibold`}>
                {gradedResult.correct} of {gradedResult.total} correct
              </h2>
              <Pill tone={gradedResult.correct === gradedResult.total ? 'ok' : 'warn'}>
                {gradedResult.total - gradedResult.correct} to review
              </Pill>
              <span className={`text-xs ${MUTED}`}>
                {data.familiarity === 'new'
                  ? 'New questions'
                  : data.familiarity === 'familiar'
                    ? 'Familiar passage or audio'
                    : 'Repeated questions'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#5a63df] dark:text-[#afb5ff]">
              {data.activity_id && <Link to="/learning-path">Learning path →</Link>}
              <Link to="/practice-lab">Your next step →</Link>
            </div>
          </section>
        )}
        {stage === 1 ? (
          <section className={`${PANEL} p-5 space-y-4`}>
            <h2 className="font-semibold">An approach to try</h2>
            <ul className="list-disc pl-5 space-y-3">
              {data.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <p className={MUTED}>
              Try this approach on the next set. These tips do not assume why you made a mistake.
            </p>
          </section>
        ) : stage === 0 && !data.mistake ? (
          <section className={`${PANEL} p-5`}>
            <h2 className="font-semibold">Your starting point</h2>
            <p>
              There is no saved answer to review for this set. Start with a few tips, then try the
              original library questions.
            </p>
          </section>
        ) : (
          <>
            <div className="flex gap-2 md:hidden">
              <Button variant="outline" onClick={() => setTab('passage')}>
                Passage / audio
              </Button>
              <Button variant="outline" onClick={() => setTab('questions')}>
                Questions
              </Button>
            </div>
            <div className="grid items-start gap-3 md:grid-cols-2">
              <div
                className={`${tab !== 'passage' ? 'hidden md:block' : ''} min-w-0 md:sticky md:top-4 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto`}
              >
                <Source
                  key={`${sessionId}:${reviewing ? 'mistake' : 'practice'}`}
                  source={source}
                />
              </div>
              <div
                className={`${tab !== 'questions' ? 'hidden md:block' : ''} ${PANEL} min-w-0 px-3`}
              >
                <Questions
                  questions={reviewing ? data.mistake.questions : data.questions}
                  module={data.focus.split(':')[0]}
                  answers={reviewing ? data.mistake.answers : answers}
                  onChange={reviewing || stage === 3 ? () => {} : changeAnswer}
                  result={reviewing ? data.mistake.result : gradedResult}
                  explanations={reviewing ? data.mistake.explanations : data.explanations}
                />
              </div>
            </div>
          </>
        )}
        {stage < 2 && (
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await action('save', { sessionId, answers, stage: stage + 1 });
                setStage(stage + 1);
              })
            }
          >
            {stage === 0 ? 'See the approach' : 'Start the questions'}
          </Button>
        )}
        {(stage === 1 || stage === 3) && <TeacherHelp key={sessionId} sessionId={sessionId} />}
        {stage === 2 && (
          <Button disabled={busy} onClick={finish}>
            Check my answers
          </Button>
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
      busy={busy}
      error={alert}
      start={start}
    />
  );
}
