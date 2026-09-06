import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';
import {
  getPassageBody,
  paintHighlights,
  rangeToOffsets,
} from '@/features/testing/reading/components/ReadingTest/utils/passageHighlights';

/**
 * Passage highlighting.
 *
 * Highlights live in the store as serialisable anchors, and the DOM is painted
 * from them. Previously they were local component state plus a one-off DOM
 * mutation, which meant a passage switch (which rebuilds the passage body) or a
 * refresh silently discarded every highlight the learner had made.
 *
 * @param {Object}  options
 * @param {React.RefObject} options.passageRef      Scroll container holding the passage body.
 * @param {number}          options.currentPassageIndex Passage new highlights belong to.
 */
export const useHighlighter = ({ passageRef, currentPassageIndex = 0 } = {}) => {
  const highlights = useReadingTestStore((s) => s.highlights);
  const setHighlights = useReadingTestStore((s) => s.setHighlights);
  const addHighlight = useReadingTestStore((s) => s.addHighlight);
  const removeHighlightFromStore = useReadingTestStore((s) => s.removeHighlight);

  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  const handleHighlightClick = useCallback((event, highlight) => {
    event.stopPropagation();
    setSelectedHighlight(highlight);
    setHighlightMenuPosition({
      x: event.clientX,
      y: event.clientY + window.scrollY,
    });
    setShowHighlightMenu(true);
  }, []);

  // Painted spans capture their click handler at paint time; the ref keeps them
  // pointing at the current one without forcing a repaint.
  const highlightClickRef = useRef(handleHighlightClick);
  useEffect(() => {
    highlightClickRef.current = handleHighlightClick;
  }, [handleHighlightClick]);

  const passageHighlights = useMemo(
    () => highlights.filter((highlight) => highlight.passageIndex === currentPassageIndex),
    [highlights, currentPassageIndex]
  );

  // The attached passage body. Held separately from `passageRef` because the
  // body mounts inside a <Suspense> boundary: an effect can run before the body
  // exists, and nothing re-runs it once the boundary resolves.
  const bodyNodeRef = useRef(null);

  const paint = useCallback(
    (root) => {
      if (!root) return;
      paintHighlights(root, passageHighlights, {
        onHighlightClick: (event, highlight) => highlightClickRef.current?.(event, highlight),
      });
    },
    [passageHighlights]
  );

  /**
   * Callback ref for the passage body element.
   *
   * React invokes this the moment the node attaches — after Suspense resolves,
   * after a remount, after a rehydrated session renders — which is the only
   * timing that reliably covers restoring highlights on load. Its identity also
   * changes whenever `passageHighlights` does, so adding or removing a highlight
   * re-runs it and repaints.
   */
  const passageBodyRef = useCallback(
    (node) => {
      bodyNodeRef.current = node;
      paint(node);
    },
    [paint]
  );

  /**
   * Repaint the current passage's highlights.
   *
   * Safe to call at any time — it clears whatever is painted before applying,
   * so extra calls are idempotent. The caller must invoke this after any render
   * that rebuilds the body's HTML in place (paper theme, answer reveal), which
   * keeps the same element and so does not re-run the callback ref.
   */
  const repaintHighlights = useCallback(() => {
    paint(bodyNodeRef.current || getPassageBody(passageRef?.current));
  }, [paint, passageRef]);

  // Covers switching passages, where the body element is reused but its
  // contents are rebuilt from the new passage.
  useEffect(() => {
    repaintHighlights();
  }, [repaintHighlights]);

  const closeMenu = useCallback(() => {
    setShowHighlightMenu(false);
    setCurrentSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const applyHighlight = useCallback(
    (color) => {
      const root = bodyNodeRef.current || getPassageBody(passageRef?.current);
      const range = currentSelection?.range;

      if (!root || !range || range.collapsed) {
        closeMenu();
        return null;
      }

      const anchor = rangeToOffsets(root, range);
      if (!anchor) {
        // Better to decline than to paint a highlight that cannot be restored.
        console.warn('[ReadingTest] Selection could not be anchored to the passage.');
        closeMenu();
        return null;
      }

      const highlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        passageIndex: currentPassageIndex,
        start: anchor.start,
        end: anchor.end,
        text: anchor.text,
        color,
        timestamp: new Date().toISOString(),
      };

      addHighlight(highlight);
      closeMenu();
      return highlight;
    },
    [passageRef, currentSelection, currentPassageIndex, addHighlight, closeMenu]
  );

  const removeHighlight = useCallback(() => {
    if (!selectedHighlight) return;
    removeHighlightFromStore(selectedHighlight.id);
    setShowHighlightMenu(false);
    setSelectedHighlight(null);
  }, [selectedHighlight, removeHighlightFromStore]);

  return {
    highlights,
    setHighlights,
    showHighlightMenu,
    setShowHighlightMenu,
    highlightMenuPosition,
    setHighlightMenuPosition,
    currentSelection,
    setCurrentSelection,
    selectedHighlight,
    setSelectedHighlight,
    applyHighlight,
    removeHighlight,
    handleHighlightClick,
    repaintHighlights,
    passageBodyRef,
  };
};
