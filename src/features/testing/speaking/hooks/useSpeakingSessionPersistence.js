import { useCallback } from 'react';

import { TestSession } from '@/features/testing/shared/services/TestSession';

export default function useSpeakingSessionPersistence(sessionId) {
  return useCallback(
    async (updates) => {
      if (!sessionId) return;

      try {
        await TestSession.update(sessionId, {
          ...updates,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('Failed to save session progress:', error);
      }
    },
    [sessionId]
  );
}
