import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen } from 'lucide-react';
import { createPageUrl } from '@/utils';

// ---------------------------------------------------------------------------
// Pure derived-value helpers used by the Reading TestCard components
// ---------------------------------------------------------------------------

/** Returns true when the test is locked behind a paywall for this user. */
export function computeReadingAccessLock(test, user, isAdmin) {
  const tier = (user?.subscription_tier || 'free').toLowerCase();
  const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;
  return !!(test.access_tier && test.access_tier !== 'free' && !hasPremiumAccess);
}

/** Returns the completion percentage (0-100) for an in-progress session. */
export function computeReadingProgress(session, test, questionCount) {
  if (!session || session.is_completed) return 0;
  const answered =
    session.completed_questions || Object.keys(session.user_responses || {}).length || 0;
  const total = test.total_questions || questionCount || 40;
  return Math.round((answered / total) * 100);
}

/** Builds the human-readable title (Cambridge format or raw title). */
export function buildReadingDisplayTitle(test) {
  if (!test.is_official_cambridge || !test.cambridge_year) return test.title;
  const bookNumber = test.cambridge_year - 2005;
  const testNum = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
  return `IELTS ${bookNumber} Reading ${test.cambridge_year} Test ${testNum}`;
}

/** Returns the right icon component for the test format. */
export function resolveReadingIcon(test) {
  return test.test_format?.toLowerCase() === 'academic' ? GraduationCap : BookOpen;
}

/**
 * Returns the React Router `to` path for the card link.
 * Uses a single state object to stay within the 4-arg limit.
 */
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

/**
 * Returns the ContainerLink component type and its props.
 * Kept out of the render body to avoid branch-count inflation.
 */
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
  const session = testSession && !testSession.is_completed ? testSession : undefined;
  const completedSession = testSession && testSession.is_completed ? testSession : undefined;
  return { session, completedSession };
}
