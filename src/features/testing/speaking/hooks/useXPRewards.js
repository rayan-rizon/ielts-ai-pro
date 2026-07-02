import { useCallback, useState } from 'react';

import { User } from '@/features/auth/services/User';
import { UserPoints } from '@/features/gamification/services/UserPoints';

export default function useXPRewards(pendingTimersRef) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [earnedXP, setEarnedXP] = useState({ xp: 0, bonus: 0, streak: 0 });

  const awardXP = useCallback(
    async (evaluation) => {
      try {
        const userProfile = await User.me();
        if (!userProfile?.id || !evaluation.overallBand) return;

        const xpAmount = 100 + Math.round(evaluation.overallBand * 20);
        await UserPoints.addPoints(userProfile.id, xpAmount);
        const streakData = await UserPoints.updateStreak(userProfile.id);

        setEarnedXP({
          xp: xpAmount,
          bonus: 0,
          streak: streakData?.current_streak || 0,
        });
        setShowConfetti(true);

        const xpTimerId = setTimeout(() => {
          pendingTimersRef.current.delete(xpTimerId);
          setShowXPNotification(true);
        }, 500);
        pendingTimersRef.current.add(xpTimerId);
      } catch (xpError) {
        console.warn('Could not award XP:', xpError);
      }
    },
    [pendingTimersRef]
  );

  return {
    showConfetti,
    setShowConfetti,
    showXPNotification,
    setShowXPNotification,
    earnedXP,
    awardXP,
  };
}
