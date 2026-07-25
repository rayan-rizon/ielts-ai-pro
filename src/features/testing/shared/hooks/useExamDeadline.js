import { useEffect, useRef } from 'react';
import { EXAM_DURATION_SECONDS, getExamRemainingSeconds, getSessionTestMode } from '../testMode';

export function useExamDeadline({
  session,
  isFinished,
  durationSeconds = EXAM_DURATION_SECONDS,
  onTick,
  onExpire,
}) {
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onTickRef.current = onTick;
    onExpireRef.current = onExpire;
  }, [onTick, onExpire]);

  useEffect(() => {
    if (!session || isFinished || getSessionTestMode(session) !== 'exam') return;

    let expired = false;
    const syncDeadline = () => {
      const remaining = getExamRemainingSeconds(session, durationSeconds);
      onTickRef.current?.(remaining);
      if (remaining === 0 && !expired) {
        expired = true;
        onExpireRef.current?.();
      }
    };

    syncDeadline();
    const timer = window.setInterval(syncDeadline, 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.created_at, session?.started_at, isFinished, durationSeconds]);
}
