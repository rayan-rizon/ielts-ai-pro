import { supabase } from '@/lib/supabase';
import { captureProductEvent } from '@/lib/posthog';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PANEL,
  WELL,
  TILE,
  MICRO,
  MUTED,
  NUM,
  AiBadge,
  Pill,
} from '@/features/dashboard/components/primitives';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PRACTICE_LIBRARY_ENABLED, SKILL_LAB_ENABLED, getRecommendations } from '../skills';
import { lessonAction } from '../services/skillLabService';
import RecommendedLesson from '../components/RecommendedLesson';
import LessonQuestion from '../components/LessonQuestion';
import LessonTutor from '../components/LessonTutor';
import LibraryPracticeLab from './LibraryPracticeLab';
export default function PracticeLabPage() {
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const legacy = useQuery({
    queryKey: ['practice-session-version', user?.id, sessionId],
    enabled: Boolean(
      PRACTICE_LIBRARY_ENABLED && user?.id && sessionId && params.get('library') !== '1'
    ),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_lab_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    retry: 1,
  });
  if (!PRACTICE_LIBRARY_ENABLED) return <SkillLab />;
  if (!sessionId || params.get('library') === '1') return <LibraryPracticeLab />;
  if (legacy.isPending) return <Skeleton />;
  if (legacy.error)
    return (
      <div className={`${PANEL} m-4 p-4`} role="alert">
        <p>Your saved practice could not be opened.</p>
        <Button onClick={() => legacy.refetch()}>Try again</Button>
      </div>
    );
  return legacy.data ? <SkillLab /> : <LibraryPracticeLab />;
}

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your lessons"
      className="mx-auto max-w-6xl space-y-3 p-4"
    >
      <div className={`${WELL} h-24 animate-pulse`} />
      <div className="grid gap-3 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`${WELL} h-48 animate-pulse`} />
        ))}
      </div>
    </div>
  );
}
function LessonCard({ lesson, onStart, busy, remaining }) {
  return (
    <article className={`${PANEL} flex flex-col gap-3 p-4`}>
      <div className="flex items-center justify-between">
        <span className={MICRO}>{lesson.module}</span>
        <Pill tone="neutral">{lesson.estimated_minutes} min</Pill>
      </div>
      <h3 className="font-semibold">{lesson.title}</h3>
      <p className={`text-sm ${MUTED}`}>{lesson.outcome}</p>
      {lesson.reason && <p className={`text-xs ${MUTED}`}>{lesson.reason}</p>}
      <Button
        className="mt-auto"
        variant="outline"
        disabled={busy || remaining <= 0}
        onClick={() => onStart(lesson.skill)}
      >
        Start learning
        <ArrowRight className="ml-2 h-3 w-3" />
      </Button>
    </article>
  );
}
function SkillLab() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const startRequest = useRef(null);
  const [filter, setFilter] = useState(params.get('module') || 'all');
  const dashboard = useQuery({
    queryKey: ['skill-lab', 'dashboard', user?.id],
    queryFn: () => lessonAction('dashboard'),
    enabled: SKILL_LAB_ENABLED && Boolean(user?.id),
    staleTime: 0,
  });
  const session = useQuery({
    queryKey: ['skill-lab', 'session', user?.id, sessionId],
    queryFn: () => lessonAction('get', sessionId),
    enabled: SKILL_LAB_ENABLED && Boolean(user?.id && sessionId),
    staleTime: 0,
  });
  async function invalidate() {
    await Promise.all(
      ['skill-lab', 'learningPath', 'analytics', 'dashboard'].map((key) =>
        client.invalidateQueries({ queryKey: [key] })
      )
    );
  }
  async function perform(action, payload) {
    setError('');
    setBusy(true);
    try {
      const result = await lessonAction(action, sessionId, payload);
      client.setQueryData(['skill-lab', 'session', user?.id, sessionId], result);
      if (result.completed_at) {
        if (!session.data?.completed_at)
          void captureProductEvent('skill_lab_session_completed', {
            test_type: result.lesson.module,
            skill_code: result.skill,
            independent_count: result.independent_count,
            independent_correct: result.independent_correct,
            repeat_practice: result.repeated,
          });
        await invalidate();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function start(skill, mode = 'learn') {
    setError('');
    setBusy(true);
    if (startRequest.current?.skill !== skill || startRequest.current?.mode !== mode)
      startRequest.current = { skill, mode, id: crypto.randomUUID() };
    try {
      const result = await lessonAction('start', null, {
        skill,
        mode,
        request_id: startRequest.current.id,
        source_id: params.get('sourceId'),
        activity_id: params.get('activityId'),
      });
      startRequest.current = null;
      void captureProductEvent('skill_lab_session_started', {
        test_type: result.lesson.module,
        skill_code: result.skill,
        current_tier: result.tier,
        source: params.get('activityId')
          ? 'learning_path'
          : params.get('sourceId')
            ? 'test_result'
            : 'library',
      });
      await invalidate();
      navigate(`/practice-lab/session/${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!SKILL_LAB_ENABLED)
    return (
      <main className="p-5">
        <h1 className="text-2xl font-bold">Practice Lab</h1>
        <p className="mt-2">Your new learning space is being prepared.</p>
        <Link to="/learning-path" className="mt-4 inline-block text-[#5a63df]">
          Open your learning path
        </Link>
      </main>
    );
  if (dashboard.isLoading || (sessionId && session.isLoading)) return <Skeleton />;
  if (dashboard.isError || (sessionId && session.isError))
    return (
      <main className="p-5">
        <h1 className="text-2xl font-bold">Practice Lab</h1>
        <p role="alert" className="my-3">
          {session.error?.message || dashboard.error?.message}
        </p>
        <Button
          onClick={() => {
            void dashboard.refetch();
            void session.refetch();
          }}
        >
          Try again
        </Button>
      </main>
    );
  if (!dashboard.data) return <Skeleton />;
  const data = dashboard.data;
  const s = session.data;
  if (sessionId && s) {
    const finished = Boolean(s.completed_at);
    const stage = finished
      ? 'Your progress'
      : s.position < 0
        ? 'Learn'
        : s.item?.stage === 'guided'
          ? 'Practise together'
          : 'Try on your own';
    return (
      <main className="mx-auto max-w-6xl space-y-4 p-4 text-slate-900 dark:text-slate-100">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/practice-lab" className={`text-xs ${MUTED}`}>
              Practice Lab
            </Link>
            <h1 className="mt-1 text-xl font-bold">{s.lesson.title}</h1>
          </div>
          <Link to="/practice-lab" className="text-sm text-[#5a63df]">
            Save and leave
          </Link>
        </header>
        <div className={`${TILE} flex flex-wrap items-center justify-between gap-2 p-3`}>
          <strong>{stage}</strong>
          <span className={NUM}>
            {finished ? 'Saved' : `${Math.max(0, s.position + 1)} / ${s.total} questions`}
          </span>
          <span className={`text-xs ${MUTED}`}>
            About {s.lesson.estimated_minutes} minutes · no time limit
          </span>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {s.repeated && (
          <p className={`${WELL} p-3 text-sm`}>
            You have seen some of these examples before. This is revision and will not count as a
            new independent result.
          </p>
        )}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={`${PANEL} min-w-0 space-y-4 p-4 sm:p-5`}>
            {finished ? (
              <>
                <h2 className="text-lg font-semibold">A useful step forward</h2>
                <p>
                  {s.independent_count
                    ? `You answered ${s.independent_correct} of ${s.independent_count} questions correctly on your own.`
                    : 'Your revision is saved.'}
                </p>
                <details className={`${WELL} min-w-40 rounded-lg p-3`}>
                  <summary className="cursor-pointer text-sm font-semibold">
                    Read your answers and explanations
                  </summary>
                  <div className="mt-3 space-y-4">
                    {s.answered?.map((a, i) => (
                      <div key={i} className="space-y-1 text-sm">
                        <p className="font-semibold">{a.prompt}</p>
                        <p>
                          Your answer: {Array.isArray(a.answer) ? a.answer.join(' → ') : a.answer}
                        </p>
                        <p>{a.explanation}</p>
                        {a.transcript && <p>What you heard: {a.transcript}</p>}
                      </div>
                    ))}
                  </div>
                </details>
                <p>
                  {s.progress}.{' '}
                  {s.retained
                    ? 'You also did well on a later check.'
                    : 'Keep practising with fresh examples to see whether this gets easier.'}
                </p>
                <p className={`text-sm ${MUTED}`}>
                  {s.next_review_at
                    ? `Review again on ${new Date(s.next_review_at).toLocaleDateString()}.`
                    : 'You have finished the fresh examples. Read your saved explanations whenever you like.'}{' '}
                  This is practice progress, not an IELTS band score.
                </p>
                <Link to="/practice-lab" className="inline-block text-[#5a63df]">
                  Choose your next lesson →
                </Link>
                {s.return_to && s.return_to !== '/practice-lab' && (
                  <p>
                    <Link to={s.return_to} className="text-[#5a63df]">
                      {s.return_to === '/learning-path'
                        ? 'Return to your learning path'
                        : 'Return to your test result'}
                    </Link>
                  </p>
                )}
              </>
            ) : s.position < 0 ? (
              <>
                <Pill tone="accent">One skill at a time</Pill>
                <h2 className="text-lg font-semibold">{s.lesson.outcome}</h2>
                <div className={`${WELL} space-y-2 p-4`}>
                  <h3 className="font-semibold">A common mistake</h3>
                  <p className="text-sm">{s.lesson.trap}</p>
                </div>
                {s.source_excerpt && (
                  <div className={`${WELL} space-y-2 p-4`}>
                    <h3 className="font-semibold">From your writing</h3>
                    <blockquote className="text-sm">{s.source_excerpt.original}</blockquote>
                    <p className="text-sm">{s.source_excerpt.explanation}</p>
                    <p className={`text-xs ${MUTED}`}>
                      Try revising this in the practice box. This example will not count as an
                      independent check.
                    </p>
                  </div>
                )}
                <h3 className="font-semibold">Try this approach</h3>
                <p className="text-sm leading-relaxed">{s.lesson.strategy}</p>
                <div className={`${WELL} p-4`}>
                  <h3 className="mb-2 font-semibold">Let’s look at an example</h3>
                  <p className="text-sm leading-relaxed">{s.lesson.example}</p>
                </div>
                <p className={`text-xs ${MUTED}`}>
                  {s.source_id
                    ? 'You opened this lesson from a saved result. This is a chance to practise the selected skill.'
                    : 'You can learn this skill without taking a full test first.'}
                </p>
                <Button disabled={busy} onClick={() => perform('next', { position: s.position })}>
                  Let’s practise
                </Button>
              </>
            ) : (
              <>
                <LessonQuestion
                  key={s.item.id}
                  item={s.item}
                  response={s.response}
                  busy={busy}
                  onAnswer={(a) => perform('answer', a)}
                />
                {s.response && (
                  <Button disabled={busy} onClick={() => perform('next', { position: s.position })}>
                    {s.position === s.total - 1 ? 'See my progress' : 'Next example'}
                  </Button>
                )}
              </>
            )}
          </section>
          <LessonTutor session={s} onRefresh={() => session.refetch()} />
        </div>
      </main>
    );
  }
  const recommendations = getRecommendations(
    data.lessons,
    data.evidence,
    data.sessions,
    data.memory.disputed_skills
  );
  const selected = params.get('skill');
  const selectedLesson = recommendations.find((l) => l.skill === selected);
  const ongoing = data.sessions.filter((s) => !s.completed_at);
  const latest = new Map();
  data.sessions
    .filter((s) => s.completed_at)
    .forEach((s) => {
      if (!latest.has(s.skill)) latest.set(s.skill, s);
    });
  const due = recommendations.filter(
    (l) =>
      latest.get(l.skill)?.next_review_at &&
      new Date(latest.get(l.skill).next_review_at) <= new Date()
  );
  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 text-slate-900 dark:text-slate-100">
      <header className={`${PANEL} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div>
          <p className={`${MICRO} text-[#5a63df]`}>Your next step</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Practice Lab</h1>
            <AiBadge active />
          </div>
          <p className={`mt-2 text-sm ${MUTED}`}>
            Understand a mistake. Try a new approach. See your progress.
          </p>
        </div>
        <div className={`${WELL} min-w-40 rounded-lg p-3`}>
          <p className={MICRO}>Lessons left today</p>
          <p className={`${NUM} mt-1 text-2xl`}>
            {data.remaining}
            <span className="text-sm"> / {data.limit}</span>
          </p>
          <p className={`mt-1 text-xs ${MUTED}`}>
            Resets{' '}
            {new Date(data.reset_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </header>
      {!data.enabled && (
        <p className={`${WELL} p-4`}>
          New lessons are not available yet. You can still read your saved work.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {data.remaining === 0 && (
        <p className={`${WELL} p-3 text-sm`}>
          You have used today’s lessons. Your saved explanations and progress are still available.
        </p>
      )}
      {selectedLesson && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">The skill you chose</h2>
          <LessonCard
            lesson={selectedLesson}
            onStart={start}
            busy={busy || !data.enabled}
            remaining={data.remaining}
          />
        </section>
      )}
      {selected && !selectedLesson && (
        <p className="text-sm">That skill is not available yet. Choose a related lesson below.</p>
      )}
      {ongoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Continue learning</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ongoing.map((s) => (
              <Link
                key={s.id}
                to={`/practice-lab/session/${s.id}`}
                className={`${TILE} flex items-center justify-between gap-3 p-4 text-sm`}
              >
                {data.lessons.find((l) => l.skill === s.skill)?.title || 'Continue your lesson'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}
      <RecommendedLesson
        lessons={
          recommendations.some((l) => l.priority < 3)
            ? recommendations.slice(0, 3)
            : ['reading', 'writing', 'listening']
                .map((module) => recommendations.find((l) => l.module === module))
                .filter(Boolean)
        }
        onStart={start}
        busy={busy || !data.enabled}
        remaining={data.remaining}
      />
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <RotateCcw className="h-4 w-4" />
          Due for review
        </h2>
        {due.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {due.map((l) => (
              <LessonCard
                key={l.skill}
                lesson={l}
                onStart={start}
                busy={busy || !data.enabled}
                remaining={data.remaining}
              />
            ))}
          </div>
        ) : (
          <p className={`${WELL} p-4 text-sm`}>
            Nothing to review today. After a lesson, we’ll suggest when to try it again.
          </p>
        )}
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Explore skills</h2>
          <label className="text-sm">
            Show{' '}
            <select
              aria-label="Choose a subject"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`${TILE} ml-2 p-2`}
            >
              {['all', 'reading', 'listening', 'writing', 'speaking'].map((v) => (
                <option key={v} value={v}>
                  {v === 'all' ? 'All subjects' : v[0].toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {recommendations
            .filter((l) => filter === 'all' || l.module === filter)
            .map((l) => (
              <LessonCard
                key={l.skill}
                lesson={l}
                onStart={start}
                busy={busy || !data.enabled}
                remaining={data.remaining}
              />
            ))}
        </div>
      </section>
      {!data.sessions.length && (
        <p className={`${WELL} p-4 text-sm`}>
          Not sure where to start? Choose a lesson above. Its five-question check gives you a
          starting point without a full test.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/grammar" className={`${TILE} flex items-center gap-2 p-4 text-sm`}>
          <BookOpen className="h-4 w-4" />
          Build your grammar →
        </Link>
        <Link to="/vocabulary" className={`${TILE} p-4 text-sm`}>
          Practise your saved words →
        </Link>
      </div>
      {data.sessions.some((s) => s.completed_at) && (
        <details className={`${PANEL} p-4`}>
          <summary className="cursor-pointer font-semibold">Your saved lessons</summary>
          <div className="mt-3 space-y-2">
            {data.sessions
              .filter((s) => s.completed_at)
              .map((s) => (
                <Link
                  key={s.id}
                  className="block text-sm text-[#5a63df]"
                  to={`/practice-lab/session/${s.id}`}
                >
                  {data.lessons.find((l) => l.skill === s.skill)?.title} ·{' '}
                  {new Date(s.completed_at).toLocaleDateString()}
                </Link>
              ))}
          </div>
        </details>
      )}
      {!data.sessions.length && (
        <Button
          variant="outline"
          disabled={busy || !data.enabled || data.remaining <= 0}
          onClick={() => start(selectedLesson?.skill || 'reading_true_false_not_given', 'check')}
        >
          Try a five-question starting check
        </Button>
      )}
    </main>
  );
}
