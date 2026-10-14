import { useEffect, useRef, useState } from 'react';

// Keep complete editor snapshots in memory, never in a learner session or DB.
// Redo is discarded when a new change follows Undo; hydration is the baseline.
export function useEditorHistory(value, restore, ready = true, limit = 60) {
  const key = JSON.stringify(value);
  const timeline = useRef({ entries: [], index: -1 });
  const latest = useRef({ key, restore });
  latest.current = { key, restore };
  const [, refresh] = useState(0);
  useEffect(() => {
    if (!ready) return;
    const state = timeline.current;
    if (state.entries[state.index] === key) return;
    state.entries = state.entries.slice(0, state.index + 1);
    state.entries.push(key);
    if (state.entries.length > limit) state.entries.shift();
    state.index = state.entries.length - 1;
    refresh((n) => n + 1);
  }, [key, ready, limit]);
  const move = (direction) => {
    const state = timeline.current;
    const index = state.index + direction;
    if (!ready || index < 0 || index >= state.entries.length) return;
    state.index = index;
    latest.current.restore(JSON.parse(state.entries[index]));
    refresh((n) => n + 1);
  };
  return {
    undo: () => move(-1),
    redo: () => move(1),
    canUndo: ready && timeline.current.index > 0,
    canRedo: ready && timeline.current.index < timeline.current.entries.length - 1,
  };
}
