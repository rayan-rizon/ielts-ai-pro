import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Headphones } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

/**
 * One skill config per test type. Everything that used to differ between the
 * duplicated reading/listening card modules is now data, not code.
 */
export const TEST_SKILLS = {
  reading: {
    key: 'reading',
    label: 'Reading',
    route: 'reading-test',
    icon: BookOpen,
    emptyDescription: 'Authentic IELTS Reading practice with curated passages.',
  },
  listening: {
    key: 'listening',
    label: 'Listening',
    route: 'listening-test',
    icon: Headphones,
    emptyDescription: 'Authentic IELTS Listening practice with curated audio.',
  },
};

/** True when the test sits behind a paywall for this user. */
export function computeAccessLock(test, user, isAdmin) {
  if (isAdmin) return false;
  const tier = (user?.subscription_tier || 'free').toLowerCase();
  if (tier === 'pro' || tier === 'premium') return false;
  return !!(test?.access_tier && test.access_tier !== 'free');
}

/**
 * Completion percentage (0-100) for an in-progress session.
 *
 * Uses `??` rather than `||` so a genuine `completed_questions: 0` is honoured
 * instead of silently falling through to the `user_responses` length — the two
 * copies of this helper disagreed on that before, so reading and listening
 * could report different progress for identical session data.
 */
export function computeProgress(session, test, questionCount) {
  if (!session?.id || session.is_completed) return 0;
  const answered =
    session.completed_questions ?? Object.keys(session.user_responses || {}).length ?? 0;
  const total = test?.total_questions ?? questionCount ?? 40;
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((answered / total) * 100)));
}

/** Cambridge volume number, or null when the test is not an official paper. */
export function volumeNumber(test) {
  if (!test?.is_official_cambridge) return null;
  if (test.cambridge_book_number) return test.cambridge_book_number;
  if (test.cambridge_year) return test.cambridge_year - 2005;
  return null;
}

/** Test number within its volume (1-4 for Cambridge books). */
export function testNumber(test) {
  return test?.cambridge_test_number || test?.title?.match(/Test\s*(\d+)/i)?.[1] || null;
}

/** Human-readable title — Cambridge naming when official, raw title otherwise. */
export function buildDisplayTitle(test, skill) {
  const vol = volumeNumber(test);
  if (!vol) return test?.title || 'Untitled test';
  return `IELTS ${vol} ${skill.label} ${test.cambridge_year} Test ${testNumber(test) || 1}`;
}

/** Academic papers get their own icon; everything else uses the skill default. */
export function resolveIcon(test, skill) {
  return test?.test_format?.toLowerCase() === 'academic' ? GraduationCap : skill.icon;
}

export function buildLinkTarget(
  { isResuming, isCompleted, session, completedSession, test },
  skill
) {
  if (isResuming && session?.id) return `/${skill.route}/${session.id}`;
  if (isCompleted && completedSession?.id) return `/${skill.route}/${completedSession.id}`;
  return withLearningActivity(`/${skill.route}?test-id=${test.id}`);
}

export function resolveLinkConfig(isLocked, linkTo) {
  if (isLocked) {
    return {
      ContainerLink: 'div',
      linkProps: { onClick: () => (window.location.href = createPageUrl('Pricing')) },
    };
  }
  return { ContainerLink: Link, linkProps: { to: linkTo } };
}

export function resolveTestSessions(testSession) {
  const isCompleted = !!testSession?.is_completed;
  return {
    session: !isCompleted ? testSession : undefined,
    completedSession: isCompleted ? testSession : undefined,
  };
}

/**
 * Formats a band score for display, or returns null when there is no usable
 * number. Previously the card checked only `!== undefined`, so a null score
 * from an abandoned session rendered an empty "Your score" row.
 */
export function formatBand(score) {
  const n = typeof score === 'string' ? Number(score) : score;
  if (!Number.isFinite(n)) return null;
  return n.toFixed(1);
}

/** Route helpers so the action buttons never re-derive URLs by hand. */
export const routes = {
  resume: (skill, id) => `/${skill.route}/${id}`,
  results: (skill, id) => `/${skill.route}/${id}?view-results=true`,
  retake: (skill, testId) => withLearningActivity(`/${skill.route}?test-id=${testId}&retake=true`),
  start: (skill, testId) => withLearningActivity(`/${skill.route}?test-id=${testId}`),
};
