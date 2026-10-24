import { useState, useCallback, useRef } from 'react';

import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';
import {
  defineWord,
  resolveDefineLanguage,
} from '@/features/vocabulary/services/vocabDefineService';
import {
  cardToItemFields,
  mergeEnrichment,
  needsEnrichment,
  savedSenseHint,
} from '@/features/vocabulary/utils/vocabCard';

/** Words sent per click of "Add meanings", so one tap cannot drain a day's allowance. */
export const ENRICH_BATCH_SIZE = 10;

const BLOCKING = new Set(['quota', 'burst', 'budget']);

/**
 * Fills in the AI card (translation, IPA, level, collocations...) for words that
 * were saved before it existed, without touching the meaning the learner saved.
 */
export function useVocabularyEnrichment({ setAllVocabulary, language }) {
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [batch, setBatch] = useState(null); // { done, total } while running
  const [notice, setNotice] = useState(null); // { kind, message }
  const attemptedRef = useRef(new Set());
  const aiLanguage = resolveDefineLanguage(language);

  const setBusy = (id, on) =>
    setBusyIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const enrichItem = useCallback(
    async (item) => {
      const hint = savedSenseHint(item.definition);
      setBusy(item.id, true);
      try {
        const { card } = await defineWord(item.word, { hint, language: aiLanguage });
        const patch = mergeEnrichment(item, cardToItemFields(card, aiLanguage, item));
        // A word saved with no usable meaning takes the card's; a saved one is kept.
        if (!hint) patch.definition = card.meaning;
        if (!item.example && card.examples?.[0]) patch.example = card.examples[0];
        const updated = await VocabularyItem.update(item.id, patch);
        setAllVocabulary((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry))
        );
        return updated;
      } finally {
        setBusy(item.id, false);
      }
    },
    [aiLanguage, setAllVocabulary]
  );

  /** Used when a word is opened: at most one automatic attempt per word per visit. */
  const enrichOnce = useCallback(
    async (item, { force = false } = {}) => {
      if (!item?.id) return null;
      if (!force && attemptedRef.current.has(`${item.id}:${aiLanguage}`)) return null;
      if (!needsEnrichment(item, aiLanguage)) return null;
      attemptedRef.current.add(`${item.id}:${aiLanguage}`);
      try {
        setNotice(null);
        return await enrichItem(item);
      } catch (error) {
        setNotice({ kind: error.kind || 'unavailable', message: error.message });
        return null;
      }
    },
    [aiLanguage, enrichItem]
  );

  const enrichMany = useCallback(
    async (items) => {
      const todo = items
        .filter((item) => needsEnrichment(item, aiLanguage))
        .slice(0, ENRICH_BATCH_SIZE);
      if (!todo.length) return { done: 0, stopped: null };
      setNotice(null);
      setBatch({ done: 0, total: todo.length });
      let done = 0;
      let stopped = null;
      for (const item of todo) {
        try {
          await enrichItem(item);
          done += 1;
          setBatch({ done, total: todo.length });
        } catch (error) {
          if (BLOCKING.has(error.kind)) {
            stopped = error;
            break;
          }
          // One word failing (not a word, offline blip) does not stop the rest.
          if (error.kind === 'offline' || error.kind === 'auth') {
            stopped = error;
            break;
          }
        }
      }
      setBatch(null);
      if (stopped) setNotice({ kind: stopped.kind, message: stopped.message });
      return { done, stopped };
    },
    [aiLanguage, enrichItem]
  );

  return {
    busyIds,
    batch,
    notice,
    clearNotice: () => setNotice(null),
    enrichItem,
    enrichOnce,
    enrichMany,
    aiLanguage,
  };
}
