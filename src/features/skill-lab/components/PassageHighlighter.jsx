import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Highlighter, Trash2 } from 'lucide-react';
import { MUTED } from '@/features/dashboard/components/primitives.jsx';
import {
  getPassageBody,
  paintHighlights,
  rangeToOffsets,
} from '@/features/testing/reading/components/ReadingTest/utils/passageHighlights';

const COLORS = [
  ['yellow', '#fde68a'],
  ['green', '#bbf7d0'],
  ['blue', '#bfdbfe'],
];
const TOOLBAR_HALF_WIDTH = 70;
const EDGE = 8;

function load(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

/** Where the toolbar goes: under the words, so it clears the phone's own copy menu. */
function placeUnder(rect) {
  const middle = rect ? rect.left + rect.width / 2 : 0;
  const maxLeft = window.innerWidth - TOOLBAR_HALF_WIDTH - EDGE;
  return {
    left: Math.max(TOOLBAR_HALF_WIDTH + EDGE, Math.min(middle, maxLeft)),
    top: (rect?.bottom || 0) + EDGE,
  };
}

const hasSelectedText = (selection) => Boolean(selection?.rangeCount) && !selection.isCollapsed;

function useHighlights(storageKey) {
  const containerRef = useRef(null);
  const [highlights, setHighlights] = useState(() => load(storageKey));
  const [menu, setMenu] = useState(null);

  // The passage can be rebuilt by any render, so the marks are painted after each one.
  useEffect(() => {
    paintHighlights(getPassageBody(containerRef.current), highlights, {
      onHighlightClick: (event, highlight) =>
        setMenu({ id: highlight.id, ...placeUnder(event.target.getBoundingClientRect()) }),
    });
  });

  const save = (next) => {
    setHighlights(next);
    setMenu(null);
    window.getSelection()?.removeAllRanges();
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Highlights still work for this visit. */
    }
  };

  const readSelection = () => {
    const selection = window.getSelection();
    if (!hasSelectedText(selection)) {
      setMenu((current) => (current?.anchor ? null : current));
      return;
    }
    const range = selection.getRangeAt(0);
    const anchor = rangeToOffsets(getPassageBody(containerRef.current), range);
    if (anchor) setMenu({ anchor, ...placeUnder(range.getBoundingClientRect?.()) });
  };

  return {
    containerRef,
    menu,
    readSelection,
    close: () => setMenu(null),
    add: (color) => save([...highlights, { id: crypto.randomUUID(), color, ...menu.anchor }]),
    remove: () => save(highlights.filter((highlight) => highlight.id !== menu.id)),
  };
}

function Toolbar({ menu, onAdd, onRemove }) {
  return (
    <div
      role="toolbar"
      aria-label="Highlight text"
      style={{ left: menu.left, top: menu.top }}
      // Pressing a button must not collapse the selection first.
      onMouseDown={(event) => event.preventDefault()}
      className="fixed z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-[#cfcddf] bg-white p-1.5 shadow-md dark:border-white/15 dark:bg-[#15141c]"
    >
      {menu.anchor ? (
        COLORS.map(([name, color]) => (
          <button
            key={name}
            type="button"
            aria-label={`Highlight ${name}`}
            onClick={() => onAdd(color)}
            style={{ backgroundColor: color }}
            className="h-8 w-8 rounded-md border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          />
        ))
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
        >
          <Trash2 size={13} aria-hidden="true" />
          Remove highlight
        </button>
      )}
    </div>
  );
}

/** Wraps a `[data-passage-body]` so the learner can mark evidence in it. */
export default function PassageHighlighter({ storageKey, children }) {
  const { containerRef, menu, readSelection, close, add, remove } = useHighlights(storageKey);

  useEffect(() => {
    if (!menu) return undefined;
    // A fixed toolbar would drift away from its words once anything scrolls.
    const onKey = (event) => event.key === 'Escape' && close();
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, close]);

  return (
    <>
      <p className={`flex items-center gap-1.5 text-[11px] ${MUTED}`}>
        <Highlighter size={12} aria-hidden="true" />
        Select text to highlight it. Select a highlight to remove it.
      </p>
      <div
        ref={containerRef}
        className="flex-1"
        onMouseUp={readSelection}
        onTouchEnd={readSelection}
        onKeyUp={readSelection}
      >
        {children}
      </div>
      {menu && createPortal(<Toolbar menu={menu} onAdd={add} onRemove={remove} />, document.body)}
    </>
  );
}
