import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export default function useSpeakingNavigationBlocker({
  isTestComplete,
  isExiting,
  evaluationError,
  showUpgradeDialog,
  testStarted,
  setShowExitDialog,
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isTestComplete &&
      !isExiting.current &&
      testStarted &&
      !evaluationError &&
      !showUpgradeDialog &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitDialog(true);
    }
  }, [blocker.state, setShowExitDialog]);

  return blocker;
}
