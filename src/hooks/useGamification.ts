import { useState, useCallback, useEffect, useRef } from 'react';
import { User, UserPoints } from '@/entities';

/**
 * XP data returned after awarding points
 */
export interface EarnedXP {
  /** Base XP earned */
  xp: number;
  /** Bonus XP (e.g., for perfect score) */
  bonus: number;
  /** Current streak count */
  streak: number;
}

/**
 * Options for awardXP function
 */
export interface AwardXPOptions {
  /** Whether to include the 250 XP perfect-score bonus (default: true) */
  includePerfectBonus?: boolean;
  /** Whether to update the user's streak (default: true) */
  updateStreak?: boolean;
  /** Delay before showing XP notification in ms (default: 500) */
  notificationDelay?: number;
  /** Stable source key used to prevent duplicate awards */
  actionKey?: string;
}

/**
 * Result from awardXP function
 */
export interface AwardXPResult extends EarnedXP {
  /** Whether the XP was successfully awarded */
  success: boolean;
}

/**
 * Return type for useGamification hook
 */
export interface UseGamificationResult {
  /** Whether confetti should be shown */
  showConfetti: boolean;
  /** Whether XP notification should be shown */
  showXPNotification: boolean;
  /** Earned XP data */
  earnedXP: EarnedXP;
  /** Function to award XP to user */
  awardXP: (
    correctAnswers: number,
    totalQuestions: number,
    options?: AwardXPOptions
  ) => Promise<AwardXPResult>;
  /** Reset all gamification state */
  resetGamification: () => void;
  /** Set confetti visibility */
  setShowConfetti: React.Dispatch<React.SetStateAction<boolean>>;
  /** Set XP notification visibility */
  setShowXPNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * useGamification - Shared hook for XP/Confetti gamification logic.
 *
 * This hook consolidates the gamification logic used after test submission
 * in both ReadingTest and ListeningTest modules.
 *
 * Features:
 * - Calculates XP based on correct answers
 * - Awards points to the user via UserPoints entity
 * - Updates streak data
 * - Manages confetti and XP notification state
 */
export function useGamification(): UseGamificationResult {
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showXPNotification, setShowXPNotification] = useState<boolean>(false);
  const [earnedXP, setEarnedXP] = useState<EarnedXP>({ xp: 0, bonus: 0, streak: 0 });
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNotificationTimer = useCallback(() => {
    if (notificationTimerRef.current !== null) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearNotificationTimer, [clearNotificationTimer]);

  /**
   * Award XP to the current user after test completion.
   */
  const awardXP = useCallback(
    async (
      correctAnswers: number,
      totalQuestions: number,
      options: AwardXPOptions = {}
    ): Promise<AwardXPResult> => {
      const {
        includePerfectBonus = true,
        updateStreak = true,
        notificationDelay = 500,
        actionKey,
      } = options;

      try {
        if (!actionKey) throw new Error('A stable point-award action key is required');

        // Get current user profile (ensures public profile exists)
        const user = await User.me();

        // The server derives the reward from the verified test completion.
        // Correct-answer counts remain UI-only until objective scoring is
        // evaluated server-side.
        void correctAnswers;
        void totalQuestions;
        void includePerfectBonus;
        const award = await UserPoints.addPoints(user.id!, 0, 'test_completion', actionKey);
        if (!award.awarded) {
          return { success: false, xp: 0, bonus: 0, streak: 0 };
        }
        const xpAmount = award.awardedPoints;
        const bonusXP = 0;

        // Update streak if enabled
        let streakValue = 0;
        if (updateStreak) {
          const streakData = await UserPoints.updateStreak(user.id!);
          streakValue = streakData?.current_streak || 0;
        }

        // Update local state
        const xpData: EarnedXP = {
          xp: xpAmount,
          bonus: bonusXP,
          streak: streakValue,
        };
        setEarnedXP(xpData);

        // Trigger celebration
        setShowConfetti(true);
        clearNotificationTimer();
        notificationTimerRef.current = setTimeout(() => {
          notificationTimerRef.current = null;
          setShowXPNotification(true);
        }, notificationDelay);

        return { success: true, ...xpData };
      } catch (error) {
        console.error('useGamification: Failed to award XP:', error);
        return { success: false, xp: 0, bonus: 0, streak: 0 };
      }
    },
    [clearNotificationTimer]
  );

  /**
   * Reset gamification state (useful when unmounting or resetting test).
   */
  const resetGamification = useCallback((): void => {
    clearNotificationTimer();
    setShowConfetti(false);
    setShowXPNotification(false);
    setEarnedXP({ xp: 0, bonus: 0, streak: 0 });
  }, [clearNotificationTimer]);

  return {
    showConfetti,
    showXPNotification,
    earnedXP,
    awardXP,
    resetGamification,
    setShowConfetti,
    setShowXPNotification,
  };
}

export default useGamification;
