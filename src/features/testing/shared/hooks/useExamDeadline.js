import { useEffect, useRef } from 'react';
import { EXAM_DURATION_SECONDS, getExamRemainingSeconds, getSessionTestMode } from '../testMode';

export function useExamDeadline({
  session,
  isFinished,
  durationSeconds = EXAM_DURATION_SECONDS,
  onTick,
  onExpire,
  onResumeExpired,
}) {
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);
  const onResumeExpiredRef = useRef(onResumeExpired);

  useEffect(() => {
    onTickRef.current = onTick;
    onExpireRef.current = onExpire;
    onResumeExpiredRef.current = onResumeExpired;
  }, [onTick, onExpire, onResumeExpired]);

  useEffect(() => {
    if (!session || isFinished || getSessionTestMode(session) !== 'exam') return;

    let expired = false;
    let isInitialSync = true;
    const syncDeadline = () => {
      const remaining = getExamRemainingSeconds(session, durationSeconds);
      onTickRef.current?.(remaining);
      if (remaining === 0 && !expired) {
        expired = true;
        if (isInitialSync && onResumeExpiredRef.current) {
          onResumeExpiredRef.current();
        } else {
          onExpireRef.current?.();
        }
      }
      isInitialSync = false;
    };

    syncDeadline();
    const timer = window.setInterval(syncDeadline, 1000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.created_at, session?.started_at, isFinished, durationSeconds]);
}
