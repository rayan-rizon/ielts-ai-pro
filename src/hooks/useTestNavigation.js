import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

/**
 * useTestNavigation - Shared hook for test navigation blocking and exit dialog handling.
 *
 * This hook consolidates the navigation blocking logic used in both ReadingTest and ListeningTest.
 * It handles:
 * 1. Blocking navigation when a test is in progress with unsaved answers.
 * 2. Managing the exit dialog state.
 * 3. Handling the beforeunload event to warn users about leaving.
 * 4. Providing a safe exit function that bypasses the blocker.
 *
 * @param {Object} options - Configuration options.
 * @param {Object|null} options.session - The current test session object.
 * @param {boolean} options.isFinished - Whether the test is finished/submitted.
 * @param {Object} options.answers - The current answers object.
 * @param {string} options.exitPath - The path to navigate to on exit (e.g., '/reading' or '/listening').
 * @returns {Object} - { blocker, showExitDialog, setShowExitDialog, handleExit, isExiting }
 */
export function useTestNavigation({ session, isFinished, answers, exitPath }) {
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const isExiting = useRef(false);

  // Navigation blocker - prevents accidental navigation when test is in progress
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isExiting.current &&
      session &&
      !session.is_completed &&
      !isFinished &&
      currentLocation.pathname !== nextLocation.pathname &&
      Object.keys(answers || {}).length > 0
  );

  // Show exit dialog when blocker is triggered
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitDialog(true);
    }
  }, [blocker.state]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (session && !session.is_completed && !isFinished) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session, isFinished]);

  /**
   * Handle exit action - bypasses blocker and navigates to exit path.
   * Use this when user confirms they want to leave.
   */
  const handleExit = useCallback(() => {
    isExiting.current = true;
    if (blocker.state === 'blocked') {
      const target = blocker.location;
      blocker.reset();
      setTimeout(() => navigate(target), 0);
    } else {
      navigate(exitPath);
    }
  }, [blocker, navigate, exitPath]);

  /**
   * Reset blocker state - use when user cancels exit dialog.
   */
  const resetBlocker = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    blocker,
    showExitDialog,
    setShowExitDialog,
    handleExit,
    resetBlocker,
    isExiting,
  };
}

export default useTestNavigation;
