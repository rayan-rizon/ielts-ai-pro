import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  applyReportText,
  collectReportText,
} from '../../../../../supabase/functions/_shared/writingReportText';
import { taskTypeOf } from '../utils/writingReportModel';
import { requestReportAssist } from './reportAssistClient';

/*
 * Translations the learner agreed to spend a review on. Shared, so the report
 * and the essay beside it both update after one tap.
 */
const agreed = new Set();
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const agree = (key) => {
  agreed.add(key);
  listeners.forEach((listener) => listener());
};
export const resetTranslationAgreementsForTests = () => agreed.clear();

const wantsTranslation = (feedback, sessionId, language) =>
  [language !== 'en', sessionId, feedback].every(Boolean);

/** The request for a report's translation, or null when none is needed. */
function translationRequest(feedback, sessionId, language) {
  if (!wantsTranslation(feedback, sessionId, language)) return null;
  if (!Object.keys(collectReportText(feedback)).length) return null;
  return { sessionId, taskType: taskTypeOf(feedback), operation: 'translate', language };
}

/** Translated copy of the report. */
export async function translateReport(feedback, sessionId, language) {
  const request = translationRequest(feedback, sessionId, language);
  if (!request) return feedback;
  // Without the learner's agreement the server only returns what is already paid for.
  const paying = agreed.has(translationKey(request, feedback));
  const data = await requestReportAssist(paying ? { ...request, useCredit: true } : request);
  return applyReportText(feedback, data.translations);
}

/** Identifies one translation: the report version, attempt and language. */
function translationKey(request, feedback) {
  if (!request) return null;
  const version = feedback.sourceFingerprint || feedback.generatedAt || '';
  return `${request.sessionId}|${request.taskType}|${request.language}|${version}`;
}

const FAILURES = { credit_required: 'offer', no_credit: 'no_credit' };

function statusOf(key, result) {
  if (!key) return 'none';
  if (result?.failed) return FAILURES[result.code] || 'failed';
  return result?.feedback ? 'ready' : 'loading';
}

/** Runs one translation per key; a late reply for an old key is ignored. */
function useKeyedResult(key, paying, load) {
  const [result, setResult] = useState({ key: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) return undefined;
    let current = true;
    setResult({ key });
    load()
      .then((feedback) => current && setResult({ key, feedback }))
      .catch((error) => current && setResult({ key, failed: true, code: error?.code }));
    return () => {
      current = false;
    };
    // `key` stands for everything `load` reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, paying, attempt]);

  const mine = key && result.key === key ? result : null;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return [mine, retry];
}

/**
 * The report with explanations in the learner's language. English shows at
 * once and stays if translation fails, so the report is never blocked.
 */
export function useTranslatedReport({ feedback, sessionId, language }) {
  const key = translationKey(translationRequest(feedback, sessionId, language), feedback);
  const paying = useSyncExternalStore(subscribe, () => agreed.has(key));
  const [mine, retry] = useKeyedResult(key, paying, () =>
    translateReport(feedback, sessionId, language)
  );
  const shown = mine?.feedback || feedback;
  const status = statusOf(key, mine);
  return useMemo(
    () => ({ shown, status, retry, translate: () => agree(key) }),
    [shown, status, key, retry]
  );
}
