import { useGamification } from '@/hooks/useGamification';

/**
 * useWritingGamification
 *
 * Encapsulates gamification logic for the Writing Test:
 * - Confetti effects
 * - XP Notifications
 * - Awarding XP
 */
export function useWritingGamification() {
  const {
    showConfetti,
    showXPNotification,
    earnedXP,
    awardXP,
    setShowConfetti,
    setShowXPNotification,
  } = useGamification();

  return {
    showConfetti,
    showXPNotification,
    earnedXP,
    awardXP,
    setShowConfetti,
    setShowXPNotification,
  };
}
