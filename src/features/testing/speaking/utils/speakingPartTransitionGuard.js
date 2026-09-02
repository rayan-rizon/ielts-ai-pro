/**
 * Keeps a part transition single-flight until its server request settles.
 * React state updates are asynchronous, so state alone cannot stop a held
 * Enter key or a fast double click from issuing duplicate advance requests.
 */
export function createSpeakingPartTransitionGuard() {
  let inFlight = false;

  return {
    acquire() {
      if (inFlight) return false;
      inFlight = true;
      return true;
    },
    release() {
      inFlight = false;
    },
  };
}
