import { useEffect, useRef, useState } from 'react';
import { readPlanPractice, updatePlanPractice } from './planPracticeStore';

/**
 * The learner's added practice. A change shows at once and is taken back if it
 * cannot be saved; `failed` is true until the next successful save.
 */
export function usePlanPractice(userId) {
  const [state, setState] = useState({ items: null, busy: false, failed: false });
  const saved = useRef([]);

  useEffect(() => {
    if (!userId) return undefined;
    let current = true;
    const show = (items) => {
      saved.current = items;
      if (current) setState((before) => ({ ...before, items }));
    };
    // If the list cannot be read, adding still works: saving reads it again.
    readPlanPractice()
      .then(show)
      .catch(() => show([]));
    return () => {
      current = false;
    };
  }, [userId]);

  const change = async (update, { optimistic = true } = {}) => {
    setState((before) => ({
      items: optimistic ? update(before.items || []) : before.items,
      busy: true,
      failed: false,
    }));
    try {
      saved.current = await updatePlanPractice(update);
      setState({ items: saved.current, busy: false, failed: false });
    } catch (error) {
      console.warn('Study plan practice was not saved:', error?.message);
      setState({ items: saved.current, busy: false, failed: true });
    }
  };

  return { ...state, change };
}
