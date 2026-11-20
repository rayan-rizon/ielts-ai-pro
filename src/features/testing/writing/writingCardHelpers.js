import { GraduationCap, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import { withLearningActivity } from '@/features/testing/shared/activityContext';

// ---------------------------------------------------------------------------
// Access lock
// ---------------------------------------------------------------------------

export function computeWritingAccessLock(test, user, isAdmin, hasSavedSession = false) {
  return (
    !isAdmin &&
    !hasSavedSession &&
    (test?.upgradeForAllowance || !hasContentAccess(user, test.access_tier))
  );
}

// ---------------------------------------------------------------------------
// Display title
// ---------------------------------------------------------------------------

export function buildWritingDisplayTitle(test) {
  if (test.is_official_cambridge && test.cambridge_year) {
    const bookNumber = test.cambridge_year - 2005;
    const testNum = test.cambridge_test_number || test.title.match(/Test\s*(\d+)/i)?.[1] || '1';
    return `IELTS ${bookNumber} Writing ${test.cambridge_year} Test ${testNum}`;
  }
  return test.title;
}

// ---------------------------------------------------------------------------
// Icon + link config
// ---------------------------------------------------------------------------

export function resolveWritingIcon(test) {
  return test.test_format?.toLowerCase() === 'academic' ? GraduationCap : PenTool;
}

export function resolveWritingLinkConfig(isLocked, test) {
  if (isLocked) {
    return {
      ContainerLink: 'span',
      linkProps: {},
    };
  }
  return {
    ContainerLink: Link,
    linkProps: { to: withLearningActivity(`/writing-task?taskId=${test.id}`) },
  };
}
