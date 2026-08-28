import { useCallback, useState } from 'react';

export default function useXPRewards(pendingTimersRef) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [earnedXP, setEarnedXP] = useState({ xp: 0, bonus: 0, streak: 0 });

  const awardXP = useCallback(
    async (serverAward) => {
      try {
        // The evaluator records this award atomically with the authoritative
        // completed session. Never mint speaking XP from browser state.
        if (!serverAward?.awarded) return;

        setEarnedXP({
          xp: serverAward.awardedPoints,
          bonus: 0,
          streak: 0,
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
