import { useCallback, useEffect, useRef, useState } from 'react';
import { requestReportAssist } from './reportAssistClient';

export const modelKey = (band, language) => `${band}:${language}`;

/**
 * Band 7/8 paragraphs the learner asked for, kept per band and language.
 * Nothing is generated until asked; after that, a language change brings the
 * notes over in the new language.
 */
export function useBandModels({ sessionId, taskType, language }) {
  const [entries, setEntries] = useState({});
  const asked = useRef(new Set());
  const scope = `${sessionId}|${taskType}`;
  const scopeRef = useRef(scope);

  const load = useCallback(
    (band) => {
      const key = `${scopeRef.current}|${modelKey(band, language)}`;
      asked.current.add(`${scopeRef.current}|${band}`);
      setEntries((current) => ({ ...current, [key]: { status: 'loading' } }));
      requestReportAssist({ sessionId, taskType, operation: 'model', band, language })
        .then((data) => setEntries((current) => ({ ...current, [key]: { status: 'ready', data } })))
        .catch((error) =>
          setEntries((current) => ({ ...current, [key]: { status: 'failed', code: error.code } }))
        );
    },
    [sessionId, taskType, language]
  );

  scopeRef.current = scope;
  const entry = useCallback(
    (band) => entries[`${scope}|${modelKey(band, language)}`] || null,
    [entries, scope, language]
  );

  useEffect(() => {
    for (const band of [7, 8])
      if (asked.current.has(`${scope}|${band}`) && !entry(band)) load(band);
  }, [scope, entry, load]);

  /** The comparisons already on screen, for the PDF. */
  const loaded = () =>
    [7, 8].flatMap((band) => {
      const ready = entry(band);
      return ready?.status === 'ready' ? [{ band, ...ready.data }] : [];
    });

  return { entry, load, loaded };
}
