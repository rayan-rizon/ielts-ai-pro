import { computeQuestionNumbers } from '../components/ListeningTest/utils/questionProcessing';

// ============ ACTIONS CONSTANT ============
export const LISTENING_ACTIONS = {
  SET_TEST_DATA: 'SET_TEST_DATA',
  SET_SESSION: 'SET_SESSION',
  SET_ANSWER: 'SET_ANSWER',
  SET_ANSWERS_BULK: 'SET_ANSWERS_BULK',
  TICK_TIMER: 'TICK_TIMER',
  SET_TIME: 'SET_TIME',
  SET_AUDIO_TIME: 'SET_AUDIO_TIME',
  SET_LOADING: 'SET_LOADING',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SET_ERROR: 'SET_ERROR',
  FINISH_TEST: 'FINISH_TEST',
  RESET_TEST: 'RESET_TEST',
  SET_ACTIVE_PART: 'SET_ACTIVE_PART',
  TOGGLE_FLAG: 'TOGGLE_FLAG',
  TOGGLE_TRANSCRIPT: 'TOGGLE_TRANSCRIPT',
  SET_RESULTS: 'SET_RESULTS',
  SET_CORRECT_ANSWERS_MAP: 'SET_CORRECT_ANSWERS_MAP',
  SET_CONFETTI: 'SET_CONFETTI',
  SET_XP: 'SET_XP',
  SHOW_RESULTS_MODAL: 'SHOW_RESULTS_MODAL',
  VALIDATE_SESSION: 'VALIDATE_SESSION',
};

/**
 * Unified Dispatcher for Listening Test
 * Handles mapping generic reducer-like actions to generic Zustand store updates.
 *
 * @param {Object} store - The generic specific store (zustand store object, not hook)
 * @param {Object} action - The action object { type, payload }
 */
export const dispatchListeningAction = (store, action) => {
  const state = store.getState();
  const ACTIONS = LISTENING_ACTIONS;

  switch (action.type) {
    case ACTIONS.VALIDATE_SESSION:
      state.validateSession(action.payload);
      break;
    case ACTIONS.SET_TEST_DATA: {
      const questionsWithNumbers = computeQuestionNumbers(action.payload.questions);
      state.setTestData(action.payload.passage, action.payload.questions, questionsWithNumbers);
      break;
    }
    case ACTIONS.SET_SESSION:
      state.setSession(action.payload);
      break;
    case ACTIONS.SET_ANSWER:
      state.setAnswer(action.payload.id, action.payload.value);
      break;
    case ACTIONS.SET_ANSWERS_BULK:
      state.setAnswersBulk(action.payload);
      break;
    case ACTIONS.TICK_TIMER:
      state.tickTimer();
      break;
    case ACTIONS.SET_TIME:
      state.setTime(action.payload);
      break;
    case ACTIONS.SET_AUDIO_TIME:
      state.setAudioTime(action.payload);
      break;
    case ACTIONS.SET_LOADING:
      state.setLoading(action.payload);
      break;
    case ACTIONS.SET_SUBMITTING:
      state.setSubmitting(action.payload);
      break;
    case ACTIONS.SET_ERROR:
      state.setError(action.payload);
      break;
    case ACTIONS.FINISH_TEST:
      state.finishTest();
      break;
    case ACTIONS.RESET_TEST:
      state.resetTest();
      break;
    case ACTIONS.SET_ACTIVE_PART:
      state.setActivePart(action.payload);
      break;
    case ACTIONS.TOGGLE_FLAG:
      state.toggleFlag(action.payload);
      break;
    case ACTIONS.TOGGLE_TRANSCRIPT:
      state.toggleTranscript();
      break;
    case ACTIONS.SET_RESULTS:
      state.setResults(action.payload);
      break;
    case ACTIONS.SET_CORRECT_ANSWERS_MAP:
      state.setCorrectAnswersMap(action.payload);
      break;
    case ACTIONS.SET_CONFETTI:
      state.setConfetti(action.payload);
      break;
    case ACTIONS.SET_XP:
      state.setXP(action.payload);
      break;
    case ACTIONS.SHOW_RESULTS_MODAL:
      state.showResultsModal(action.payload);
      break;
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
};
