import { usePairedTest } from '@/features/testing/paired/PairedContext';
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
  const paired = usePairedTest();
  const pairedRef = useRef(paired);
  pairedRef.current = paired;
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
      const remaining = getExamRemainingSeconds(
        session,
        durationSeconds,
        pairedRef.current?.now() ?? Date.now()
      );
      onTickRef.current?.(remaining);
      if (remaining === 0 && !expired) {
        expired = true;
        if (pairedRef.current) {
          pairedRef.current.act('get').catch(() => {});
          return;
        }
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
