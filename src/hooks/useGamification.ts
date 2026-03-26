import { useState, useCallback } from 'react';
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
    /** Whether to include 100 XP bonus for perfect score (default: true) */
    includePerfectBonus?: boolean;
    /** Whether to update the user's streak (default: true) */
    updateStreak?: boolean;
    /** Delay before showing XP notification in ms (default: 500) */
    notificationDelay?: number;
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

    /**
     * Award XP to the current user after test completion.
     */
    const awardXP = useCallback(
        async (
            correctAnswers: number,
            totalQuestions: number,
            options: AwardXPOptions = {}
        ): Promise<AwardXPResult> => {
            const { includePerfectBonus = true, updateStreak = true, notificationDelay = 500 } = options;

            try {
                // Get current user profile (ensures public profile exists)
                const user = await User.me();

                // Calculate XP amount based on performance
                const xpAmount = UserPoints.calculateTestXP(correctAnswers, totalQuestions);

                // Calculate perfect score bonus
                const isPerfect = correctAnswers === totalQuestions && totalQuestions > 0;
                const bonusXP = includePerfectBonus && isPerfect ? 100 : 0;

                // Award points to user (using public ID, not auth ID)
                await UserPoints.addPoints(user.id!, xpAmount);

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
                setTimeout(() => setShowXPNotification(true), notificationDelay);

                return { success: true, ...xpData };
            } catch (error) {
                console.error('useGamification: Failed to award XP:', error);
                return { success: false, xp: 0, bonus: 0, streak: 0 };
            }
        },
        []
    );

    /**
     * Reset gamification state (useful when unmounting or resetting test).
     */
    const resetGamification = useCallback((): void => {
        setShowConfetti(false);
        setShowXPNotification(false);
        setEarnedXP({ xp: 0, bonus: 0, streak: 0 });
    }, []);

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
