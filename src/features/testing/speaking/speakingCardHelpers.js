import { GraduationCap, Mic } from 'lucide-react';
import { createPageUrl } from '@/utils';

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

export function resolveSpeakingLinkConfig(isLocked, test, activeSession, completedSession) {
  const isResuming = !!activeSession;
  const isCompleted = !!completedSession;

  if (isLocked) {
    return {
      ContainerLink: 'div',
      linkProps: { onClick: () => (window.location.href = createPageUrl('Pricing')) },
    };
  }

  // NOTE: Assuming Link from react-router-dom is used externally.
  let to = `/speaking-test?test-id=${test.id}`;
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
