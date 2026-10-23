import { createContext, useContext } from 'react';

/**
 * The completed test session that review screens belong to. Components deep inside a
 * review (the per-question explanation, for one) read it to offer "Ask Ava about this
 * question" without every renderer in between having to pass a session id down.
 * Null outside a completed review, which hides the button.
 */
export const CoachSourceContext = createContext(null);

export const useCoachSource = () => useContext(CoachSourceContext);
