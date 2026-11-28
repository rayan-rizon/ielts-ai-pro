import { useCallback, useSyncExternalStore } from 'react';
import { requestReportAssist } from './reportAssistClient';

const modelKey = (band, language) => `${band}:${language}`;

// Kept outside the report: switching tabs rebuilds it, and that must neither
// send a second request nor repeat one that failed.
let entries = new Map();
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => entries;

function keep(key, entry) {
  entries = new Map(entries).set(key, entry);
  listeners.forEach((listener) => listener());
}

/** Sends once: nothing while an answer is coming or here, and a failure only on retry. */
function fetchModel(key, request, { retry = false } = {}) {
  const status = entries.get(key)?.status;
  const open = retry ? [undefined, 'failed'] : [undefined];
  if (!open.includes(status)) return;
  keep(key, { status: 'loading' });
  requestReportAssist(request)
    .then((data) => keep(key, { status: 'ready', data }))
    .catch((error) => keep(key, { status: 'failed', code: error.code }));
}

export function resetBandModelsForTests() {
  entries = new Map();
}

/** Band 7/8 paragraphs for one marked answer, kept per band and language. */
export function useBandModels({ sessionId, taskType, language, markedAt }) {
  const all = useSyncExternalStore(subscribe, snapshot);
  const scope = `${sessionId}|${taskType}|${markedAt || ''}`;
  const keyOf = useCallback((band) => `${scope}|${modelKey(band, language)}`, [scope, language]);

  const entry = useCallback((band) => all.get(keyOf(band)) || null, [all, keyOf]);
  const send = useCallback(
    (band, options) =>
      fetchModel(keyOf(band), { sessionId, taskType, operation: 'model', band, language }, options),
    [keyOf, sessionId, taskType, language]
  );
  const load = useCallback((band) => send(band), [send]);
  const retry = useCallback((band) => send(band, { retry: true }), [send]);

  /** The comparisons already on screen, for the PDF. */
  const loaded = () =>
    [7, 8].flatMap((band) => {
      const ready = entry(band);
      return ready?.status === 'ready' ? [{ band, ...ready.data }] : [];
    });

  return { entry, load, retry, loaded };
}
