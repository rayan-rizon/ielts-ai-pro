import { useEffect, useRef } from 'react';
import { callEdgeFunction } from '@/utils/api';

// Pause/resume must follow any in-flight heartbeat, otherwise an older response
// can overwrite the paused clock or a slow pause can arrive after resume.
export function createPracticeClockSync({ send, applyState, onError }) {
  let paused = false;
  let revision = 0;
  let disposed = false;
  let queue = Promise.resolve();
  const enqueue = (action) => {
    const requestedRevision = revision;
    queue = queue.then(async () => {
      if (disposed || (action === 'heartbeat' && paused)) return;
      try {
        const result = await send(action);
        if (!disposed && requestedRevision === revision) applyState(result.state);
      } catch (error) {
        if (!disposed && requestedRevision === revision) onError(error, action, paused);
      }
    });
    return queue;
  };
  return {
    setPaused(nextPaused) {
      if (disposed || paused === nextPaused) return queue;
      paused = nextPaused;
      revision += 1;
      return enqueue(paused ? 'pause' : 'resume_practice');
    },
    heartbeat() {
      return paused ? queue : enqueue('heartbeat');
    },
    dispose() {
      disposed = true;
    },
  };
}

export default function useSpeakingPracticeClock({
  enabled,
  sessionId,
  isPaused,
  setState,
  onError,
}) {
  const clockRef = useRef(null);
  const callbacks = useRef({ setState, onError });
  callbacks.current = { setState, onError };
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const clock = createPracticeClockSync({
      send: (action) => callEdgeFunction('processSpeakingSessionV2', { action, sessionId }),
      applyState: (state) => callbacks.current.setState(state),
      onError: (...args) => callbacks.current.onError(...args),
    });
    clockRef.current = clock;
    const interval = window.setInterval(() => clock.heartbeat(), 15_000);
    return () => {
      window.clearInterval(interval);
      clock.dispose();
      clockRef.current = null;
    };
  }, [enabled, sessionId]);
  useEffect(() => {
    clockRef.current?.setPaused(Boolean(isPaused));
  }, [enabled, sessionId, isPaused]);
}
