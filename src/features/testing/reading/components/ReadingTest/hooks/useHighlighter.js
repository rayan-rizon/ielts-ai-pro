import { useState, useCallback } from 'react';

export const useHighlighter = () => {
  const [highlights, setHighlights] = useState([]);
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

  const applyHighlight = useCallback(
    (color) => {
      if (!currentSelection) return;

      const highlightId = Date.now().toString();
      const highlight = {
        id: highlightId,
        text: currentSelection.text,
        color: color,
        timestamp: new Date().toISOString(),
      };

      // Create highlight span
      const span = document.createElement('span');
      // Ensure text is readable with saturated colors
      span.className =
        'user-highlight cursor-pointer transition-all duration-200 ' +
        'rounded-sm px-0.5 box-decoration-clone ';

      // Apply different styles for light/dark mode via direct style manipulation if possible,
      // but here we use a class-based approach or just standard styles.
      span.style.backgroundColor = color;
      // In light mode (standard), dark text on saturated colors works best.
      // We'll rely on the selection fix in index.css for the active selection.
      span.style.color = '#1a1a1a';
      span.style.fontWeight = '500';
      span.setAttribute('data-highlight-id', highlightId);

      span.onclick = (e) => handleHighlightClick(e, highlight);

      try {
        // Check if the range is still valid and not collapsed
        if (!currentSelection.range || currentSelection.range.collapsed) {
          console.warn('Selection range is collapsed or invalid, cannot highlight');
          setShowHighlightMenu(false);
          setCurrentSelection(null);
          window.getSelection().removeAllRanges();
          return;
        }

        // Extract the contents and wrap them
        const contents = currentSelection.range.extractContents();
        span.appendChild(contents);
        currentSelection.range.insertNode(span);

        setHighlights((prev) => [...prev, highlight]);
      } catch (error) {
        console.error('Error applying highlight:', error);

        // Fallback method - try to recreate the selection (less reliable but can catch some edge cases)
        try {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              const contents = range.extractContents();
              span.appendChild(contents);
              range.insertNode(span);
              setHighlights((prev) => [...prev, highlight]);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback highlight method also failed:', fallbackError);
        }
      }

      setShowHighlightMenu(false);
      setCurrentSelection(null);
      window.getSelection().removeAllRanges();

      return span;
    },
    [currentSelection, handleHighlightClick]
  );

  const removeHighlight = useCallback(() => {
    if (!selectedHighlight) return;

    const highlightElement = document.querySelector(
      `[data-highlight-id="${selectedHighlight.id}"]`
    );
    if (highlightElement) {
      const parent = highlightElement.parentNode;
      while (highlightElement.firstChild) {
        parent.insertBefore(highlightElement.firstChild, highlightElement);
      }
      parent.removeChild(highlightElement);
    }

    setHighlights((prev) => prev.filter((h) => h.id !== selectedHighlight.id));
    setShowHighlightMenu(false);
    setSelectedHighlight(null);
  }, [selectedHighlight]);

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
  };
};
