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
  TITLE,
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

function useLegacySessionCheck(userId, sessionId, isLibraryParam) {
  const shouldCheck = Boolean(PRACTICE_LIBRARY_ENABLED && userId && sessionId && !isLibraryParam);
  return useQuery({
    queryKey: ['practice-session-version', userId, sessionId],
    enabled: shouldCheck,
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
}

function LegacySessionError({ onRetry }) {
  return (
    <div className={`${PANEL} m-4 p-4`} role="alert">
      <p>Your saved practice could not be opened.</p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

export default function PracticeLabPage() {
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const isLibraryParam = params.get('library') === '1';
  const legacy = useLegacySessionCheck(user?.id, sessionId, isLibraryParam);

  if (!PRACTICE_LIBRARY_ENABLED) return <SkillLab />;
  if (!sessionId || isLibraryParam) return <LibraryPracticeLab />;
  if (legacy.isPending) return <Skeleton />;
  if (legacy.error) return <LegacySessionError onRetry={() => legacy.refetch()} />;
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
    <article
      className={`${PANEL} flex flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12`}
    >
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

function SkillLabDisabled() {
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-6">
      <section className={`${PANEL} p-4 md:p-5`} role="status">
        <p className={`${MICRO} text-[#5a63df] dark:text-[#afb5ff]`}>Practice Lab</p>
        <h1 className={`${TITLE} mt-1 text-lg`}>Your practice space is taking a short break</h1>
        <p className={`mt-2 max-w-xl text-sm leading-relaxed ${MUTED}`}>
          Your test results and saved learning progress are safe. Try again shortly, or continue
          with your Learning Path while we reconnect your practice sets.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Link
            to="/learning-path"
            className="inline-flex items-center rounded-md border border-[#e4e2f0] bg-white px-3 py-2 text-sm font-semibold text-[#5a63df] dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-[#afb5ff]"
          >
            Open Learning Path
          </Link>
        </div>
      </section>
    </main>
  );
}

function SkillLabError({ message, onRetry }) {
  return (
    <main className="p-5">
      <h1 className="text-2xl font-bold">Practice Lab</h1>
      <p role="alert" className="my-3">
        {message}
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </main>
  );
}

function isSessionLoading(dashboard, sessionId, session) {
  if (dashboard.isLoading) return true;
  return Boolean(sessionId && session.isLoading);
}

function getSessionErrorMessage(dashboard, sessionId, session) {
  if (sessionId && session.isError) return session.error?.message;
  if (dashboard.isError) return dashboard.error?.message;
  return null;
}

function AnswerExplanationItem({ item }) {
  const answerDisplay = Array.isArray(item.answer) ? item.answer.join(' → ') : item.answer;
  return (
    <div className="space-y-1 text-sm">
      <p className="font-semibold">{item.prompt}</p>
      <p>Your answer: {answerDisplay}</p>
      <p>{item.explanation}</p>
      {item.transcript && <p>What you heard: {item.transcript}</p>}
    </div>
  );
}

function SessionReturnLink({ returnTo }) {
  if (!returnTo || returnTo === '/practice-lab') return null;
  const label =
    returnTo === '/learning-path' ? 'Return to your learning path' : 'Return to your test result';
  return (
    <p>
      <Link to={returnTo} className="text-[#5a63df]">
        {label}
      </Link>
    </p>
  );
}

function formatIndependentResultText(session) {
  if (session.independent_count) {
    return `You answered ${session.independent_correct} of ${session.independent_count} questions correctly on your own.`;
  }
  return 'Your revision is saved.';
}

function formatRetentionAdvice(retained) {
  if (retained) return 'You also did well on a later check.';
  return 'Keep practising with fresh examples to see whether this gets easier.';
}

function formatReviewDateAdvice(nextReviewAt) {
  if (nextReviewAt) {
    return `Review again on ${new Date(nextReviewAt).toLocaleDateString()}.`;
  }
  return 'You have finished the fresh examples. Read your saved explanations whenever you like.';
}

function SkillLabFinishedStage({ session: s }) {
  const answersList = s.answered || [];
  return (
    <>
      <h2 className="text-lg font-semibold">A useful step forward</h2>
      <p>{formatIndependentResultText(s)}</p>
      <details className={`${WELL} min-w-40 rounded-lg p-3`}>
        <summary className="cursor-pointer text-sm font-semibold">
          Read your answers and explanations
        </summary>
        <div className="mt-3 space-y-4">
          {answersList.map((item, index) => (
            <AnswerExplanationItem key={index} item={item} />
          ))}
        </div>
      </details>
      <p>
        {s.progress}. {formatRetentionAdvice(s.retained)}
      </p>
      <p className={`text-sm ${MUTED}`}>
        {formatReviewDateAdvice(s.next_review_at)} This is practice progress, not an IELTS band
        score.
      </p>
      <Link to="/practice-lab" className="inline-block text-[#5a63df]">
        Choose your next lesson →
      </Link>
      <SessionReturnLink returnTo={s.return_to} />
    </>
  );
}

function SkillLabLearnStage({ session: s, busy, onNext }) {
  return (
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
            Try revising this in the practice box. This example will not count as an independent
            check.
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
      <Button disabled={busy} onClick={onNext}>
        Let’s practise
      </Button>
    </>
  );
}

function SkillLabQuestionStage({ session: s, busy, onAnswer, onNext }) {
  const isLastQuestion = s.position === s.total - 1;
  return (
    <>
      <LessonQuestion
        key={s.item.id}
        item={s.item}
        response={s.response}
        busy={busy}
        onAnswer={onAnswer}
      />
      {s.response && (
        <Button disabled={busy} onClick={onNext}>
          {isLastQuestion ? 'See my progress' : 'Next example'}
        </Button>
      )}
    </>
  );
}

function resolveSessionStage(finished, position, itemStage) {
  if (finished) return 'Your progress';
  if (position < 0) return 'Learn';
  return itemStage === 'guided' ? 'Practise together' : 'Try on your own';
}

function SkillLabActiveSession({ session: s, error, busy, perform, onRefreshSession }) {
  const finished = Boolean(s.completed_at);
  const stage = resolveSessionStage(finished, s.position, s.item?.stage);

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
          You have seen some of these examples before. This is revision and will not count as a new
          independent result.
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={`${PANEL} min-w-0 space-y-4 p-4 sm:p-5`}>
          {finished ? (
            <SkillLabFinishedStage session={s} />
          ) : s.position < 0 ? (
            <SkillLabLearnStage
              session={s}
              busy={busy}
              onNext={() => perform('next', { position: s.position })}
            />
          ) : (
            <SkillLabQuestionStage
              session={s}
              busy={busy}
              onAnswer={(a) => perform('answer', a)}
              onNext={() => perform('next', { position: s.position })}
            />
          )}
        </section>
        <LessonTutor session={s} onRefresh={onRefreshSession} />
      </div>
    </main>
  );
}

function computeLatestCompletedSessions(sessions) {
  const latest = new Map();
  sessions
    .filter((s) => s.completed_at)
    .forEach((s) => {
      if (!latest.has(s.skill)) latest.set(s.skill, s);
    });
  return latest;
}

function resolveDueLessons(recommendations, latest) {
  return recommendations.filter((l) => {
    const session = latest.get(l.skill);
    return session?.next_review_at && new Date(session.next_review_at) <= new Date();
  });
}

function resolveTopRecommended(recommendations) {
  if (recommendations.some((l) => l.priority < 3)) {
    return recommendations.slice(0, 3);
  }
  return ['reading', 'writing', 'listening']
    .map((module) => recommendations.find((l) => l.module === module))
    .filter(Boolean);
}

function DashboardBanners({ enabled, remaining, error }) {
  return (
    <>
      {!enabled && (
        <p className={`${WELL} p-4`}>
          New lessons are not available yet. You can still read your saved work.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {remaining === 0 && (
        <p className={`${WELL} p-3 text-sm`}>
          You have used today’s lessons. Your saved explanations and progress are still available.
        </p>
      )}
    </>
  );
}

function DashboardDueSection({ due, onStart, busy, remaining, enabled }) {
  const isActionDisabled = busy || !enabled;
  return (
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
              onStart={onStart}
              busy={isActionDisabled}
              remaining={remaining}
            />
          ))}
        </div>
      ) : (
        <p className={`${WELL} p-4 text-sm`}>
          Nothing to review today. After a lesson, we’ll suggest when to try it again.
        </p>
      )}
    </section>
  );
}

const SUBJECT_OPTIONS = ['all', 'reading', 'listening', 'writing', 'speaking'];

function DashboardExploreSection({
  recommendations,
  filter,
  setFilter,
  onStart,
  busy,
  remaining,
  enabled,
}) {
  const isActionDisabled = busy || !enabled;
  const filteredLessons = recommendations.filter((l) => filter === 'all' || l.module === filter);

  return (
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
            {SUBJECT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v === 'all' ? 'All subjects' : v[0].toUpperCase() + v.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {filteredLessons.map((l) => (
          <LessonCard
            key={l.skill}
            lesson={l}
            onStart={onStart}
            busy={isActionDisabled}
            remaining={remaining}
          />
        ))}
      </div>
    </section>
  );
}

function DashboardSavedLessonsSection({ sessions, lessons }) {
  const completed = sessions.filter((s) => s.completed_at);
  if (!completed.length) return null;

  return (
    <details className={`${PANEL} p-4`}>
      <summary className="cursor-pointer font-semibold">Your saved lessons</summary>
      <div className="mt-3 space-y-2">
        {completed.map((s) => (
          <Link
            key={s.id}
            className="block text-sm text-[#5a63df]"
            to={`/practice-lab/session/${s.id}`}
          >
            {lessons.find((l) => l.skill === s.skill)?.title} ·{' '}
            {new Date(s.completed_at).toLocaleDateString()}
          </Link>
        ))}
      </div>
    </details>
  );
}

function DashboardHeader({ remaining, limit, resetAt }) {
  return (
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
          {remaining}
          <span className="text-sm"> / {limit}</span>
        </p>
        <p className={`mt-1 text-xs ${MUTED}`}>
          Resets {new Date(resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </header>
  );
}

function DashboardSelectedSkillSection({
  selectedSkill,
  selectedLesson,
  onStart,
  isActionDisabled,
  remaining,
}) {
  if (selectedLesson) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">The skill you chose</h2>
        <LessonCard
          lesson={selectedLesson}
          onStart={onStart}
          busy={isActionDisabled}
          remaining={remaining}
        />
      </section>
    );
  }
  if (selectedSkill) {
    return (
      <p className="text-sm">That skill is not available yet. Choose a related lesson below.</p>
    );
  }
  return null;
}

function DashboardOngoingSection({ ongoing, lessons }) {
  if (!ongoing.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Continue learning</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ongoing.map((s) => (
          <Link
            key={s.id}
            to={`/practice-lab/session/${s.id}`}
            className={`${TILE} flex items-center justify-between gap-3 p-4 text-sm`}
          >
            {lessons.find((l) => l.skill === s.skill)?.title || 'Continue your lesson'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardStartingCheck({ hasSessions, busy, enabled, remaining, onStart, defaultSkill }) {
  if (hasSessions) return null;
  const isStartDisabled = busy || !enabled || remaining <= 0;
  return (
    <Button
      variant="outline"
      disabled={isStartDisabled}
      onClick={() => onStart(defaultSkill, 'check')}
    >
      Try a five-question starting check
    </Button>
  );
}

function SkillLabDashboard({ data, selectedSkill, filter, setFilter, busy, onStart, error }) {
  const recommendations = getRecommendations(
    data.lessons,
    data.evidence,
    data.sessions,
    data.memory.disputed_skills
  );
  const selectedLesson = recommendations.find((l) => l.skill === selectedSkill);
  const ongoing = data.sessions.filter((s) => !s.completed_at);
  const latest = computeLatestCompletedSessions(data.sessions);
  const due = resolveDueLessons(recommendations, latest);
  const topRecommended = resolveTopRecommended(recommendations);
  const hasSessions = data.sessions.length > 0;
  const isActionDisabled = busy || !data.enabled;

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 text-slate-900 dark:text-slate-100">
      <DashboardHeader remaining={data.remaining} limit={data.limit} resetAt={data.reset_at} />

      <DashboardBanners enabled={data.enabled} remaining={data.remaining} error={error} />

      <DashboardSelectedSkillSection
        selectedSkill={selectedSkill}
        selectedLesson={selectedLesson}
        onStart={onStart}
        isActionDisabled={isActionDisabled}
        remaining={data.remaining}
      />

      <DashboardOngoingSection ongoing={ongoing} lessons={data.lessons} />

      <RecommendedLesson
        lessons={topRecommended}
        onStart={onStart}
        busy={isActionDisabled}
        remaining={data.remaining}
      />

      <DashboardDueSection
        due={due}
        onStart={onStart}
        busy={busy}
        remaining={data.remaining}
        enabled={data.enabled}
      />

      <DashboardExploreSection
        recommendations={recommendations}
        filter={filter}
        setFilter={setFilter}
        onStart={onStart}
        busy={busy}
        remaining={data.remaining}
        enabled={data.enabled}
      />

      {!hasSessions && (
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

      <DashboardSavedLessonsSection sessions={data.sessions} lessons={data.lessons} />

      <DashboardStartingCheck
        hasSessions={hasSessions}
        busy={busy}
        enabled={data.enabled}
        remaining={data.remaining}
        onStart={onStart}
        defaultSkill={selectedLesson?.skill || 'reading_true_false_not_given'}
      />
    </main>
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
        if (!session.data?.completed_at) {
          void captureProductEvent('skill_lab_session_completed', {
            test_type: result.lesson.module,
            skill_code: result.skill,
            independent_count: result.independent_count,
            independent_correct: result.independent_correct,
            repeat_practice: result.repeated,
          });
        }
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
    if (startRequest.current?.skill !== skill || startRequest.current?.mode !== mode) {
      startRequest.current = { skill, mode, id: crypto.randomUUID() };
    }
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

  if (!SKILL_LAB_ENABLED) return <SkillLabDisabled />;
  if (isSessionLoading(dashboard, sessionId, session)) return <Skeleton />;

  const errorMessage = getSessionErrorMessage(dashboard, sessionId, session);
  if (errorMessage) {
    return (
      <SkillLabError
        message={errorMessage}
        onRetry={() => {
          void dashboard.refetch();
          void session.refetch();
        }}
      />
    );
  }

  if (!dashboard.data) return <Skeleton />;

  if (sessionId && session.data) {
    return (
      <SkillLabActiveSession
        session={session.data}
        error={error}
        busy={busy}
        perform={perform}
        onRefreshSession={() => session.refetch()}
      />
    );
  }

  return (
    <SkillLabDashboard
      data={dashboard.data}
      selectedSkill={params.get('skill')}
      filter={filter}
      setFilter={setFilter}
      busy={busy}
      onStart={start}
      error={error}
    />
  );
}
