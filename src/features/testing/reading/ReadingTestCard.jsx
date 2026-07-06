import React, { memo } from 'react';
import ReadingCardListView from './ReadingCardListView';
import ReadingCardGridView from './ReadingCardGridView';
import {
  computeReadingAccessLock,
  computeReadingProgress,
  buildReadingDisplayTitle,
  resolveReadingIcon,
  buildReadingLinkTarget,
  resolveReadingLinkConfig,
} from './readingCardHelpers';
import { getColor } from './readingColorConfig';

function getSessionId(session) {
  return session ? session.id : undefined;
}

function getUserTier(user) {
  return user ? user.subscription_tier : undefined;
}

function buildCardProps(config) {
  const {
    test,
    session,
    completedSession,
    takenCount,
    questionCount,
    duration,
    user,
    isAdmin,
    hasMounted,
  } = config;
  const isResuming = !!session && !session.is_completed;
  const isCompleted = !!completedSession && completedSession.is_completed;
  const isLocked = computeReadingAccessLock(test, user, isAdmin);
  const progress = computeReadingProgress(session, test, questionCount);
  const displayTitle = buildReadingDisplayTitle(test);
  const color = getColor(displayTitle || 'default');
  const Icon = resolveReadingIcon(test);
  const linkTo = buildReadingLinkTarget({
    isResuming,
    isCompleted,
    session,
    completedSession,
    test,
  });
  const { ContainerLink, linkProps } = resolveReadingLinkConfig(isLocked, linkTo);

  return {
    test,
    isLocked,
    isResuming,
    isCompleted,
    progress,
    displayTitle,
    color,
    Icon,
    ContainerLink,
    linkProps,
    hasMounted,
    takenCount,
    questionCount,
    duration,
    session,
    completedSession,
  };
}

// ---------------------------------------------------------------------------
// TestCard — delegates entirely to view-specific components
// ---------------------------------------------------------------------------

function TestCard({
  test,
  session,
  completedSession,
  takenCount,
  questionCount,
  duration,
  user,
  isAdmin,
  hasMounted,
  viewMode,
}) {
  const props = buildCardProps({
    test,
    session,
    completedSession,
    takenCount,
    questionCount,
    duration,
    user,
    isAdmin,
    hasMounted,
  });
  if (viewMode === 'list') return <ReadingCardListView {...props} />;
  return <ReadingCardGridView {...props} />;
}

function arePropsEqual(prev, next) {
  // Compare simple properties
  const keys = ['takenCount', 'questionCount', 'duration', 'isAdmin', 'hasMounted', 'viewMode'];
  if (keys.some((key) => prev[key] !== next[key])) return false;

  // Compare nested/optional properties
  const testIdMatch = prev.test.id === next.test.id;
  const sessionIdMatch = getSessionId(prev.session) === getSessionId(next.session);
  const compSessionIdMatch =
    getSessionId(prev.completedSession) === getSessionId(next.completedSession);
  const tierMatch = getUserTier(prev.user) === getUserTier(next.user);

  return testIdMatch && sessionIdMatch && compSessionIdMatch && tierMatch;
}

export const MemoizedTestCard = memo(TestCard, arePropsEqual);
