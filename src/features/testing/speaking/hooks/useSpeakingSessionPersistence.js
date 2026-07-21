import { useCallback, useRef } from 'react';

import { TestSession } from '@/features/testing/shared/services/TestSession';

export default function useSpeakingSessionPersistence(sessionId, initialContentData = null) {
  const activeSessionIdRef = useRef(null);
  const latestContentDataRef = useRef({});
  const updateQueueRef = useRef(Promise.resolve());

  if (activeSessionIdRef.current !== sessionId) {
    activeSessionIdRef.current = sessionId;
    latestContentDataRef.current = initialContentData || {};
    updateQueueRef.current = Promise.resolve();
  }

  return useCallback(
    async (updates) => {
      if (!sessionId) return;

      const mergedUpdates = { ...updates };
      if (updates.content_data) {
        latestContentDataRef.current = {
          ...latestContentDataRef.current,
          ...updates.content_data,
        };
        mergedUpdates.content_data = latestContentDataRef.current;
      }

      const queuedUpdate = updateQueueRef.current
        .catch(() => undefined)
        .then(() =>
          TestSession.update(sessionId, {
            ...mergedUpdates,
            updated_at: new Date().toISOString(),
          })
        );

      updateQueueRef.current = queuedUpdate;

      try {
        await queuedUpdate;
      } catch (error) {
        console.warn('Failed to save session progress:', error);
      }
    },
    [sessionId]
  );
}
