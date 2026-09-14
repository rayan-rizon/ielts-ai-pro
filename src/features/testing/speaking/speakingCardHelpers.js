import { GraduationCap, Mic } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

// ---------------------------------------------------------------------------
// Pure helper functions for the Speaking Card
// ---------------------------------------------------------------------------

export function buildSpeakingDisplayTitle(test) {
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    const testNumber = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
    return `IELTS ${bookNumber} Speaking ${test.cambridge_year} Test ${testNumber}`;
  }
  return test.title;
}

export function resolveSpeakingIcon(test) {
  return test.test_format?.toLowerCase() === 'academic' ? GraduationCap : Mic;
}

export function computeSpeakingAccessLock(test, user, isAdmin) {
  const tier = (user?.subscription_tier || 'free').toLowerCase();
  const hasPremiumAccess = tier === 'pro' || tier === 'premium' || isAdmin;

  if (test.access_tier && test.access_tier !== 'free') {
    return !hasPremiumAccess;
  }
  return false;
}

export function resolveSpeakingAttemptState(session, now = Date.now()) {
  if (!session) return { isResuming: false, isCompleted: false, needsRestart: false };

  const isCompleted = Boolean(session.is_completed);
  if (isCompleted) return { isResuming: false, isCompleted: true, needsRestart: false };

  const snapshot = session.content_data?.speakingV2State;
  const isV2 = session.content_data?.speakingVersion === 'v2';
  const deadline = snapshot?.resumeExpiresAt || snapshot?.expiresAt;
  const deadlineMs = deadline ? Date.parse(deadline) : Number.NaN;
  const isExpired =
    isV2 && (snapshot?.status === 'expired' || (Number.isFinite(deadlineMs) && now >= deadlineMs));

  return {
    isResuming: !isExpired,
    isCompleted: false,
    needsRestart: isExpired,
  };
}

export function resolveSpeakingLinkConfig(
  isLocked,
  test,
  activeSession,
  completedSession,
  needsRestart = false
) {
  const isResuming = !!activeSession;
  const isCompleted = !!completedSession;

  if (isLocked) {
    return {
      ContainerLink: 'div',
      linkProps: { onClick: () => (window.location.href = createPageUrl('Pricing')) },
    };
  }

  // NOTE: Assuming Link from react-router-dom is used externally.
  let to = withLearningActivity(
    `/speaking-test?test-id=${test.id}${needsRestart ? '&retake=true' : ''}`
  );
  if (isResuming) {
    to = `/speaking-test/${test.id}`;
  } else if (isCompleted) {
    to = `/speaking-test/${completedSession.id}?view-score=true`;
  }

  return {
    ContainerLink: 'a', // The parent component will likely pass Link to it, but we provide the `to` prop
    linkProps: { to },
  };
}
