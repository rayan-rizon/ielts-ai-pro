import { CoachSourceContext } from './coachSource';

export function CoachSourceProvider({ sessionId, children }) {
  return (
    <CoachSourceContext.Provider value={sessionId ? { sessionId } : null}>
      {children}
    </CoachSourceContext.Provider>
  );
}
