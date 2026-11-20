import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen } from 'lucide-react';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

// ---------------------------------------------------------------------------
// Pure derived-value helpers used by the Reading TestCard components
// ---------------------------------------------------------------------------

export { isObjectiveTestLocked as computeReadingAccessLock } from '../shared/quota/objectiveAccess';

export function computeReadingProgress(session, test, questionCount) {
  if (!session?.id) return 0;
  if (session.is_completed) return 0;
  const answered = session.completed_questions ?? Object.keys(session.user_responses || {}).length;
  const total = test.total_questions ?? questionCount ?? 40;
  return Math.round((answered / total) * 100);
}

export function buildReadingDisplayTitle(test) {
  const isCambridge = test.is_official_cambridge;
  const year = test.cambridge_year;
  if (!isCambridge || !year) {
    return test.title;
  }
  const bookNumber = year - 2005;
  const match = test.title.match(/Test\s*(\d+)/i);
  const testNum = test.cambridge_test_number ?? match?.[1] ?? '1';
  return `IELTS ${bookNumber} Reading ${year} Test ${testNum}`;
}

export function resolveReadingIcon(test) {
  const format = test.test_format?.toLowerCase();
  return format === 'academic' ? GraduationCap : BookOpen;
}

export function buildReadingLinkTarget({
  isResuming,
  isCompleted,
  session,
  completedSession,
  test,
}) {
  if (isResuming) return `/reading-test/${session.id}`;
  if (isCompleted) return `/reading-test/${completedSession.id}`;
  return withLearningActivity(`/reading-test?test-id=${test.id}`);
}

export function resolveReadingLinkConfig(isLocked, linkTo) {
  if (isLocked) {
    return {
      ContainerLink: 'span',
      linkProps: {},
    };
  }
  return { ContainerLink: Link, linkProps: { to: linkTo } };
}

export function resolveTestSessions(testSession) {
  const isCompleted = testSession?.is_completed;
  return {
    session: !isCompleted ? testSession : undefined,
    completedSession: isCompleted ? testSession : undefined,
  };
}
