import { Link } from 'react-router-dom';
import { GraduationCap, Headphones } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

// ---------------------------------------------------------------------------
// Pure derived-value helpers used by the TestCard component
// ---------------------------------------------------------------------------

/** Returns true when the test is locked behind a paywall for this user. */
export function computeAccessLock(test, user, isAdmin) {
  const tier = (user?.subscription_tier || 'free').toLowerCase();
  const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;
  return !!(test.access_tier && test.access_tier !== 'free' && !hasPremiumAccess);
}

/** Returns the completion percentage (0-100) for an in-progress session. */
export function computeProgress(session, test, questionCount) {
  if (!session || session.is_completed) return 0;
  const answered =
    session.completed_questions || Object.keys(session.user_responses || {}).length || 0;
  const total = test.total_questions || questionCount || 40;
  return Math.round((answered / total) * 100);
}

/** Builds the human-readable title (Cambridge format or raw title). */
export function buildDisplayTitle(test) {
  if (!test.is_official_cambridge || !test.cambridge_year) return test.title;
  const bookNumber = test.cambridge_year - 2005;
  const testNum = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
  return `IELTS ${bookNumber} Listening ${test.cambridge_year} Test ${testNum}`;
}

/** Returns the right icon component for the test format. */
export function resolveIcon(test) {
  return test.test_format?.toLowerCase() === 'academic' ? GraduationCap : Headphones;
}

/**
 * Returns the React Router `to` path for the card link.
 * Uses a single state object to stay within the 4-arg limit.
 */
export function buildLinkTarget({ isResuming, isCompleted, session, completedSession, test }) {
  if (isResuming) return `/listening-test/${session.id}`;
  if (isCompleted) return `/listening-test/${completedSession.id}`;
  return withLearningActivity(`/listening-test?test-id=${test.id}`);
}

/**
 * Returns the ContainerLink component type and its props.
 * Kept out of the render body to avoid branch-count inflation in TestCard.
 */
export function resolveLinkConfig(isLocked, linkTo) {
  if (isLocked) {
    return {
      ContainerLink: 'div',
      linkProps: { onClick: () => (window.location.href = createPageUrl('Pricing')) },
    };
  }
  return { ContainerLink: Link, linkProps: { to: linkTo } };
}
