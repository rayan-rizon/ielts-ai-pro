import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Pure helper function to evaluate onboarding completion and redirection with minimal complexity
function evaluateOnboardingState({ user, isLoading, dismissed, localOnboardingCompleted }) {
  if (isLoading) {
    return { shouldRedirect: false, shouldShow: false };
  }
  if (!user) {
    return { shouldRedirect: false, shouldShow: false };
  }

  // Redirect new users who haven't completed onboarding to the onboarding flow
  const isProfileIncomplete = user.onboarding_completed === false;
  if (isProfileIncomplete) {
    if (!localOnboardingCompleted) {
      return { shouldRedirect: true, shouldShow: false };
    }
  }

  // For the reminder card, check target data.
  const hasTargetBand = !!user.target_band_score;
  const hasTestDate = !!user.test_date;
  const hasTargetData = hasTargetBand && hasTestDate;

  // Only show Quick Start if not dismissed AND they don't have target data yet
  if (dismissed) {
    return { shouldRedirect: false, shouldShow: false };
  }
  if (hasTargetData) {
    return { shouldRedirect: false, shouldShow: false };
  }

  return { shouldRedirect: false, shouldShow: true };
}

// Helper hook to evaluate onboarding completion and redirection
function useOnboardingEvaluation(user, isLoading, navigate) {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem('dashboardV3:onboardingDismissed') === '1';
    const localOnboardingCompleted = window.localStorage.getItem('onboarding_completed') === 'true';

    const { shouldRedirect, shouldShow } = evaluateOnboardingState({
      user,
      isLoading,
      dismissed,
      localOnboardingCompleted,
    });

    if (shouldRedirect) {
      navigate('/onboarding', { replace: true });
      return;
    }

    setShowOnboarding(shouldShow);
  }, [user, isLoading, navigate]);

  return [showOnboarding, setShowOnboarding];
}

// Hook to manage dashboard onboarding state and guides
export default function useDashboardOnboarding(user, stats, isLoading) {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useOnboardingEvaluation(user, isLoading, navigate);
  const [onboardingHighlight, setOnboardingHighlight] = useState(null);

  const primaryActionsRef = useRef(null);
  const quickLaunchRef = useRef(null);
  const insightsRef = useRef(null);

  useEffect(() => {
    if (!onboardingHighlight) return;
    const t = window.setTimeout(() => setOnboardingHighlight(null), 1600);
    return () => window.clearTimeout(t);
  }, [onboardingHighlight]);

  const onboardingFocusPrimary = useCallback(() => {
    primaryActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('primary');
  }, []);

  const onboardingFocusQuick = useCallback(() => {
    quickLaunchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('quick');
  }, []);

  const onboardingFocusInsights = useCallback(() => {
    insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOnboardingHighlight('insights');
  }, []);

  const onboardingSteps = useMemo(() => {
    return buildOnboardingSteps({
      user,
      totalTests: stats.totalTests,
      onboardingFocusPrimary,
      onboardingFocusQuick,
      onboardingFocusInsights,
    });
  }, [
    stats.totalTests,
    user,
    onboardingFocusPrimary,
    onboardingFocusQuick,
    onboardingFocusInsights,
  ]);

  const dismissOnboarding = useCallback(() => {
    window.localStorage.setItem('dashboardV3:onboardingDismissed', '1');
    setShowOnboarding(false);
  }, [setShowOnboarding]);

  return {
    showOnboarding,
    onboardingHighlight,
    onboardingSteps,
    dismissOnboarding,
    primaryActionsRef,
    quickLaunchRef,
    insightsRef,
  };
}

// Build onboarding card steps config with minimized complexity
function buildOnboardingSteps({
  user,
  totalTests,
  onboardingFocusPrimary,
  onboardingFocusQuick,
  onboardingFocusInsights,
}) {
  if (!user) {
    return [];
  }

  const needsTarget = !user.target_band_score;
  const needsDate = !user.test_date;

  let profileTitle = 'Finish setup';
  let profileDesc = 'Set target band and exam date.';
  let isProfileComplete = false;

  if (!needsTarget) {
    if (!needsDate) {
      profileTitle = 'Profile ready';
      profileDesc = 'Goals and date are set.';
      isProfileComplete = true;
    }
  }

  const hasTakenTests = totalTests > 0;
  let launchTitle = 'Take your first test';
  let launchDesc = 'Start with a quick Reading test.';

  if (hasTakenTests) {
    launchTitle = 'Keep momentum';
    launchDesc = 'Launch a targeted session in one click.';
  }

  return [
    {
      id: 'profile',
      title: profileTitle,
      description: profileDesc,
      done: isProfileComplete,
      href: createPageUrl('Onboarding'),
      focus: onboardingFocusPrimary,
    },
    {
      id: 'launch',
      title: launchTitle,
      description: launchDesc,
      done: hasTakenTests,
      href: createPageUrl('Reading'),
      focus: onboardingFocusQuick,
    },
    {
      id: 'insights',
      title: 'See your plan',
      description: 'Use insights to pick the next best action.',
      done: false,
      href: createPageUrl('LearningPath'),
      focus: onboardingFocusInsights,
    },
  ];
}
