import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

export default function useSpeakingNavigationBlocker({
  isTestComplete,
  isExiting,
  evaluationError,
  showUpgradeDialog,
  conversationLength,
  setShowExitDialog,
}) {
  const conversationLengthRef = useRef(0);

  useEffect(() => {
    conversationLengthRef.current = conversationLength;
  }, [conversationLength]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isTestComplete &&
      !isExiting.current &&
      conversationLengthRef.current > 1 &&
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
