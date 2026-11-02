import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import HighlightMenu from '@/features/testing/reading/components/ReadingTest/components/HighlightMenu';
import { rangeToOffsets } from '@/features/testing/reading/components/ReadingTest/utils/passageHighlights';

const COLORS = {
  yellow: '#fef08a',
  blue: '#bfdbfe',
  green: '#bbf7d0',
  pink: '#fbcfe8',
  red: '#fecaca',
};
const isSupported = () =>
  typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';

function readHighlights(key) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || '[]');
    return Array.isArray(saved)
      ? saved
          .filter(
            (h) =>
              Number.isInteger(h.start) &&
              h.start >= 0 &&
              Number.isInteger(h.end) &&
              h.end > h.start &&
              typeof h.text === 'string' &&
              h.text.trim() &&
              COLORS[h.color]
          )
          .slice(-200)
      : [];
  } catch {
    return [];
  }
}

// Native ranges leave React's question and answer DOM intact, including inline gaps.
function highlightRanges(root, anchor) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('.answer-marker-badge')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const text = nodes.map((node) => node.nodeValue).join('');
  let start = anchor.start;
  if (text.slice(start, anchor.end) !== anchor.text) {
    // Feedback may insert labels before the question. Only restore an unambiguous match.
    start = text.indexOf(anchor.text);
    if (start < 0 || text.indexOf(anchor.text, start + 1) !== -1) return [];
  }
  const end = start + anchor.text.length;
  let offset = 0;
  return nodes.flatMap((node) => {
    const from = Math.max(0, start - offset);
    const to = Math.min(node.length, end - offset);
    offset += node.length;
    if (from >= to || node.parentElement?.closest('textarea, select, [contenteditable="true"]'))
      return [];
    const range = document.createRange();
    range.setStart(node, from);
    range.setEnd(node, to);
    return [range];
  });
}

function ScopedHighlighter({
  children,
  scope,
  mode,
  onAddNote,
  assistantEnabled = false,
  onAssistantAction,
}) {
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const id = `question-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const storageKey = `question-highlights:v1:${scope}`;
  const [highlights, setHighlights] = useState(() => readHighlights(storageKey));
  const [selection, setSelection] = useState(null);
  const [existingIndex, setExistingIndex] = useState(null);
  const supported = isSupported();

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(highlights));
    } catch {
      /* Storage may be unavailable. */
    }
  }, [storageKey, highlights]);

  useEffect(() => {
    if (!supported) return;
    const captureSelection = () => {
      // Keep the captured anchor while interacting with the floating menu.
      if (menuRef.current?.contains(document.activeElement)) return;
      const selected = window.getSelection();
      const range = selected?.rangeCount ? selected.getRangeAt(0) : null;
      if (!range || range.collapsed) return;
      const editable = (node) =>
        (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest(
          'input, textarea, select, [contenteditable="true"]'
        );
      const anchor =
        !editable(range.startContainer) && !editable(range.endContainer)
          ? rangeToOffsets(rootRef.current, range)
          : null;
      if (!anchor) {
        setSelection(null);
        setExistingIndex(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const panel = rootRef.current.getBoundingClientRect();
      setExistingIndex(null);
      setSelection({
        ...anchor,
        position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
        panelBounds: { left: panel.left, right: panel.right, top: panel.top, bottom: panel.bottom },
      });
    };
    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (
        event.type === 'pointerdown' &&
        (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target))
      )
        return;
      setSelection(null);
      setExistingIndex(null);
    };
    document.addEventListener('selectionchange', captureSelection);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismiss);
    document.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('selectionchange', captureSelection);
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    };
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const paint = () => {
      for (const name of Object.keys(COLORS)) {
        const ranges = highlights
          .filter((h) => h.color === name)
          .flatMap((anchor) => highlightRanges(rootRef.current, anchor));
        CSS.highlights.set(`${id}-${name}`, new Highlight(...ranges));
      }
    };
    paint();
    const observer = new MutationObserver(paint);
    observer.observe(rootRef.current, { childList: true, characterData: true, subtree: true });
    return () => {
      observer.disconnect();
      for (const name of Object.keys(COLORS)) CSS.highlights.delete(`${id}-${name}`);
    };
  }, [highlights, id, supported, children]);

  const closeMenu = () => {
    setSelection(null);
    setExistingIndex(null);
    window.getSelection()?.removeAllRanges();
  };

  const openExistingHighlight = (event) => {
    if (!supported || window.getSelection()?.toString().trim()) return;
    const index = highlights.findIndex((anchor) =>
      highlightRanges(rootRef.current, anchor).some((range) =>
        [...range.getClientRects()].some(
          (rect) =>
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        )
      )
    );
    if (index < 0) return;
    event.stopPropagation();
    const panel = rootRef.current.getBoundingClientRect();
    setExistingIndex(index);
    setSelection({
      ...highlights[index],
      position: { x: event.clientX, y: event.clientY },
      panelBounds: { left: panel.left, right: panel.right, top: panel.top, bottom: panel.bottom },
    });
  };

  return (
    <>
      <style>
        {Object.entries(COLORS)
          .map(
            ([name, value]) =>
              `::highlight(${id}-${name}) { background-color: ${value}; color: #172033; }`
          )
          .join('\n')}
      </style>
      <div
        ref={rootRef}
        onClick={openExistingHighlight}
        onPointerUp={(event) => {
          const selected = window.getSelection();
          if (
            selected?.toString().trim() &&
            selected.rangeCount &&
            rangeToOffsets(rootRef.current, selected.getRangeAt(0))
          ) {
            event.stopPropagation();
            document.dispatchEvent(new Event('selectionchange'));
          }
        }}
      >
        {children}
      </div>
      {supported &&
        selection &&
        createPortal(
          <div
            ref={menuRef}
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
          >
            <HighlightMenu
              position={selection.position}
              currentSelection={selection}
              isExistingHighlight={existingIndex !== null}
              assistantEnabled={
                mode === 'practice' && assistantEnabled && Boolean(onAssistantAction)
              }
              onAssistantAction={(action) => {
                onAssistantAction?.(action, { ...selection, source: 'question' });
                closeMenu();
              }}
              onSelectColor={(hex) => {
                const color = Object.keys(COLORS).find((name) => COLORS[name] === hex);
                if (!color) return;
                setHighlights((items) =>
                  [
                    ...items.filter((h) => !(h.start < selection.end && h.end > selection.start)),
                    { start: selection.start, end: selection.end, text: selection.text, color },
                  ].slice(-200)
                );
                closeMenu();
              }}
              onEdit={() => setExistingIndex(null)}
              onRemove={() => {
                if (existingIndex !== null)
                  setHighlights((items) => items.filter((_, index) => index !== existingIndex));
                closeMenu();
              }}
              onAddNote={
                mode !== 'exam' && onAddNote
                  ? () => {
                      onAddNote(selection.text);
                      closeMenu();
                    }
                  : undefined
              }
            />
          </div>,
          document.body
        )}
    </>
  );
}

/** Session, mode and part form the persistence boundary; switching scope resets pending selections. */
export default function QuestionHighlighter(props) {
  return <ScopedHighlighter key={props.scope} {...props} />;
}
