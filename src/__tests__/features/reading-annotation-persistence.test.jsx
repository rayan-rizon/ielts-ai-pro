import { act, render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearPaintedHighlights,
  paintHighlights,
  rangeToOffsets,
} from '@/features/testing/reading/components/ReadingTest/utils/passageHighlights';
import { useHighlighter } from '@/features/testing/reading/components/ReadingTest/hooks/useHighlighter';
import { useTestNotes } from '@/features/testing/reading/components/ReadingTest/hooks/useTestNotes';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';

const PASSAGE_HTML = `
  <div data-passage-body="">
    <div><span>The coastal wetlands absorb storm surges.</span></div>
    <div><span>Mangrove roots trap sediment over decades.</span></div>
  </div>
`;

/** Build a passage body in the document and return its scroll container. */
function mountPassage(html = PASSAGE_HTML) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

/** Select `text` inside the body and return the resulting live range. */
function selectText(body, text) {
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const index = node.nodeValue.indexOf(text);
    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      return range;
    }
    node = walker.nextNode();
  }
  throw new Error(`Text not found in passage: ${text}`);
}

const paintedTexts = (body) =>
  Array.from(body.querySelectorAll('span.user-highlight')).map((span) => span.textContent);

describe('reading highlight anchoring', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('anchors a selection to character offsets and repaints it onto a rebuilt body', () => {
    const container = mountPassage();
    const body = container.querySelector('[data-passage-body]');

    const anchor = rangeToOffsets(body, selectText(body, 'storm surges'));
    expect(anchor).toEqual({
      start: expect.any(Number),
      end: expect.any(Number),
      text: 'storm surges',
    });

    paintHighlights(body, [{ id: 'h1', ...anchor, color: '#fef08a' }]);
    expect(paintedTexts(body)).toEqual(['storm surges']);

    // Simulate PassagePanel re-rendering the passage from source (a passage
    // switch, a paper-theme change, or an answer reveal): the painted spans are
    // destroyed, but the anchor still restores them.
    container.innerHTML = PASSAGE_HTML;
    const rebuiltBody = container.querySelector('[data-passage-body]');
    expect(paintedTexts(rebuiltBody)).toEqual([]);

    paintHighlights(rebuiltBody, [{ id: 'h1', ...anchor, color: '#fef08a' }]);
    expect(paintedTexts(rebuiltBody)).toEqual(['storm surges']);
  });

  it('excludes injected answer-marker badges from the offset baseline', () => {
    const withoutBadge = mountPassage();
    const plainBody = withoutBadge.querySelector('[data-passage-body]');
    const anchor = rangeToOffsets(plainBody, selectText(plainBody, 'Mangrove roots'));

    // The answer-reveal toggle injects "Q7" badges ahead of later text. Because
    // badges are excluded from the baseline, offsets taken without them still
    // resolve to the same words once they appear.
    const revealed = mountPassage(`
      <div data-passage-body="">
        <div><span>The coastal wetlands absorb <span class="answer-marker-badge">Q7</span>storm surges.</span></div>
        <div><span>Mangrove roots trap sediment over decades.</span></div>
      </div>
    `);
    const revealedBody = revealed.querySelector('[data-passage-body]');

    paintHighlights(revealedBody, [{ id: 'h1', ...anchor, color: '#bfdbfe' }]);
    expect(paintedTexts(revealedBody)).toEqual(['Mangrove roots']);
  });

  it('relocates a highlight when the passage text has shifted underneath it', () => {
    const container = mountPassage();
    const body = container.querySelector('[data-passage-body]');

    // Offsets from an older revision of the passage, with the stored text intact.
    paintHighlights(body, [
      { id: 'h1', start: 0, end: 15, text: 'trap sediment', color: '#bbf7d0' },
    ]);

    expect(paintedTexts(body)).toEqual(['trap sediment']);
  });

  it('paints a highlight spanning multiple paragraphs without moving elements', () => {
    const container = mountPassage();
    const body = container.querySelector('[data-passage-body]');
    const paragraphsBefore = body.querySelectorAll('div').length;

    const range = document.createRange();
    const firstParagraph = selectText(body, 'storm surges');
    const secondParagraph = selectText(body, 'Mangrove roots');
    range.setStart(firstParagraph.startContainer, firstParagraph.startOffset);
    range.setEnd(secondParagraph.endContainer, secondParagraph.endOffset);

    const anchor = rangeToOffsets(body, range);
    paintHighlights(body, [{ id: 'h1', ...anchor, color: '#fbcfe8' }]);

    expect(body.querySelectorAll('div').length).toBe(paragraphsBefore);
    expect(paintedTexts(body).join('')).toContain('storm surges');
    expect(paintedTexts(body).join('')).toContain('Mangrove roots');
  });

  it('restores the body exactly when highlights are cleared', () => {
    const container = mountPassage();
    const body = container.querySelector('[data-passage-body]');
    const originalText = body.textContent;

    const anchor = rangeToOffsets(body, selectText(body, 'sediment'));
    paintHighlights(body, [{ id: 'h1', ...anchor, color: '#fecaca' }]);
    clearPaintedHighlights(body);

    expect(body.querySelectorAll('span.user-highlight')).toHaveLength(0);
    expect(body.textContent).toBe(originalText);
  });

  it('declines a selection it cannot anchor rather than painting an unrestorable highlight', () => {
    const container = mountPassage();
    const body = container.querySelector('[data-passage-body]');

    const outside = document.createElement('p');
    outside.textContent = 'Sidebar text';
    document.body.appendChild(outside);

    const range = document.createRange();
    range.selectNodeContents(outside);

    expect(rangeToOffsets(body, range)).toBeNull();
  });
});

describe('reading annotations survive passage switches and reloads', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    useReadingTestStore.setState({ highlights: [], notes: [] });
  });

  it('keeps highlights in the store, scoped to the passage they were made on', () => {
    const container = mountPassage();
    const passageRef = { current: container };
    const body = container.querySelector('[data-passage-body]');

    const { result, rerender } = renderHook(
      ({ passageIndex }) => useHighlighter({ passageRef, currentPassageIndex: passageIndex }),
      { initialProps: { passageIndex: 0 } }
    );

    act(() => {
      result.current.setCurrentSelection({
        text: 'storm surges',
        range: selectText(body, 'storm surges'),
      });
    });
    act(() => {
      result.current.applyHighlight('#fef08a');
    });

    expect(useReadingTestStore.getState().highlights).toHaveLength(1);
    expect(useReadingTestStore.getState().highlights[0]).toMatchObject({
      passageIndex: 0,
      text: 'storm surges',
      color: '#fef08a',
    });
    expect(paintedTexts(body)).toEqual(['storm surges']);

    // Moving to passage 2 hides it; the record is kept, not discarded.
    rerender({ passageIndex: 1 });
    expect(useReadingTestStore.getState().highlights).toHaveLength(1);
    expect(paintedTexts(container.querySelector('[data-passage-body]'))).toEqual([]);

    // Coming back repaints it.
    rerender({ passageIndex: 0 });
    expect(paintedTexts(container.querySelector('[data-passage-body]'))).toEqual(['storm surges']);
  });

  it('removes a highlight through the store so the repaint drops it', () => {
    const container = mountPassage();
    const passageRef = { current: container };
    const body = container.querySelector('[data-passage-body]');

    const { result } = renderHook(() => useHighlighter({ passageRef, currentPassageIndex: 0 }));

    act(() => {
      result.current.setCurrentSelection({
        text: 'sediment',
        range: selectText(body, 'sediment'),
      });
    });
    act(() => {
      result.current.applyHighlight('#bbf7d0');
    });

    const [created] = useReadingTestStore.getState().highlights;
    act(() => {
      result.current.setSelectedHighlight(created);
    });
    act(() => {
      result.current.removeHighlight();
    });

    expect(useReadingTestStore.getState().highlights).toHaveLength(0);
    expect(paintedTexts(container.querySelector('[data-passage-body]'))).toEqual([]);
  });

  it('paints restored highlights when the passage body attaches, not on an earlier render', () => {
    // A resumed session: the highlights are already in the store before the
    // passage body exists. The body mounts inside a <Suspense> boundary, so an
    // effect can run first and find nothing to paint — the callback ref is what
    // guarantees the paint happens once the node actually attaches.
    useReadingTestStore.setState({
      highlights: [
        {
          id: 'h1',
          passageIndex: 0,
          start: 4,
          end: 20,
          text: 'coastal wetlands',
          color: '#fef08a',
        },
      ],
    });

    function PassageBody({ mounted }) {
      const { passageBodyRef } = useHighlighter({
        passageRef: { current: null },
        currentPassageIndex: 0,
      });
      if (!mounted) return <div>loading…</div>;
      return (
        <div data-passage-body="" ref={passageBodyRef}>
          <div>
            <span>The coastal wetlands absorb storm surges.</span>
          </div>
        </div>
      );
    }

    const { rerender } = render(<PassageBody mounted={false} />);
    expect(document.querySelectorAll('span.user-highlight')).toHaveLength(0);

    // The boundary resolves and the body appears.
    rerender(<PassageBody mounted />);

    const body = document.querySelector('[data-passage-body]');
    expect(paintedTexts(body)).toEqual(['coastal wetlands']);
  });

  it('keeps notes in the store and tags them with the passage they were written on', () => {
    const { result } = renderHook(() => useTestNotes());

    act(() => result.current.setNewNote('Check the paraphrase in paragraph C'));
    act(() => result.current.addNote(2));

    expect(useReadingTestStore.getState().notes).toHaveLength(1);
    expect(useReadingTestStore.getState().notes[0]).toMatchObject({
      content: 'Check the paraphrase in paragraph C',
      passageIndex: 2,
    });
    expect(result.current.newNote).toBe('');

    // A remount — the page unmounting and coming back, or a refresh rehydrating
    // sessionStorage — still sees the note.
    const remounted = renderHook(() => useTestNotes());
    expect(remounted.result.current.notes).toHaveLength(1);

    act(() => remounted.result.current.removeNote(remounted.result.current.notes[0].id));
    expect(useReadingTestStore.getState().notes).toHaveLength(0);
  });

  it('persists annotations to sessionStorage so a refresh restores them', () => {
    useReadingTestStore.setState({
      highlights: [
        { id: 'h1', passageIndex: 0, start: 4, end: 11, text: 'coastal', color: '#fef08a' },
      ],
      notes: [{ id: 'n1', content: 'Watch the dates', passageIndex: 0 }],
    });

    const persisted = JSON.parse(sessionStorage.getItem('reading-test-store'));
    expect(persisted.state.highlights).toHaveLength(1);
    expect(persisted.state.notes).toHaveLength(1);
  });
});
