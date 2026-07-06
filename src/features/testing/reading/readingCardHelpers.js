import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen } from 'lucide-react';
import { createPageUrl } from '@/utils';

// ---------------------------------------------------------------------------
// Pure derived-value helpers used by the Reading TestCard components
// ---------------------------------------------------------------------------

export function computeReadingAccessLock(test, user, isAdmin) {
  if (isAdmin) return false;
  const tier = user?.subscription_tier?.toLowerCase();
  if (tier === 'pro' || tier === 'premium') return false;
  const isFreeTest = !test.access_tier || test.access_tier === 'free';
  return !isFreeTest;
}

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
  return `/reading-test?test-id=${test.id}`;
}

export function resolveReadingLinkConfig(isLocked, linkTo) {
  if (isLocked) {
    return {
      ContainerLink: 'div',
      linkProps: { onClick: () => (window.location.href = createPageUrl('Pricing')) },
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
