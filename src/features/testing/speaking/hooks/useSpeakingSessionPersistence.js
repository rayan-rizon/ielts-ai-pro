import { useCallback, useRef } from 'react';

import { supabase } from '@/lib/supabase';

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
        .then(async () => {
          const { error } = await supabase
            .from('test_sessions')
            .update({
              ...mergedUpdates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .eq('is_completed', false);
          // An already queued autosave must never replace a server-saved report.
          if (error) throw error;
        });

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
