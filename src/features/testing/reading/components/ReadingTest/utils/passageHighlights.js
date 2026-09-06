/**
 * Passage highlight anchoring and painting.
 *
 * Highlights used to exist only as DOM spans, created by extracting the
 * selection range's contents and re-inserting them wrapped. That made the DOM
 * the source of truth, which it cannot be: `PassagePanel` rebuilds the passage
 * body from source whenever the passage, paper theme, or answer-reveal state
 * changes, so every span was destroyed on a passage switch, and a refresh lost
 * them entirely.
 *
 * Highlights are now plain serialisable descriptors anchored to character
 * offsets in the passage body's text, and the DOM is a projection of them:
 * `paintHighlights` clears whatever is painted and re-applies the descriptors
 * after each render that could have rebuilt the body.
 *
 * A descriptor is:
 *   { id, passageIndex, start, end, text, color, timestamp }
 *
 * `text` is not redundant with the offsets — it is the integrity check. If the
 * body's text has shifted under a highlight (a content correction, an anchoring
 * edge case), the offsets are re-derived by locating `text` nearest to where it
 * used to be, so a highlight degrades to "slightly relocated" rather than
 * "silently wrong" or "gone".
 */

const HIGHLIGHT_CLASS = 'user-highlight';

/**
 * The answer-marker badges ("Q23") are injected and removed by the answer-reveal
 * toggle, so their text is excluded from the offset baseline. Without this,
 * revealing answers would shift every offset that follows a marker.
 */
const BADGE_SELECTOR = '.answer-marker-badge';

/** Marks the element whose text content offsets are measured against. */
export const PASSAGE_BODY_SELECTOR = '[data-passage-body]';

/** Resolve the element highlights are anchored to, from the scroll container. */
export function getPassageBody(container) {
  return container?.querySelector?.(PASSAGE_BODY_SELECTOR) || null;
}

/** Text nodes making up the baseline, in document order, badges excluded. */
function collectTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(BADGE_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  return nodes;
}

const baselineText = (nodes) => nodes.map((node) => node.nodeValue).join('');

/**
 * Character offset of a range boundary within the baseline.
 *
 * Text-node boundaries are the common case. Element boundaries happen with
 * select-all and some triple-click selections, and are resolved by document
 * order against the collected nodes.
 */
function boundaryOffset(nodes, container, offset) {
  if (!container) return null;

  if (container.nodeType === Node.TEXT_NODE) {
    let accumulated = 0;
    for (const node of nodes) {
      if (node === container) {
        return accumulated + Math.min(offset, node.nodeValue.length);
      }
      accumulated += node.nodeValue.length;
    }
    // A boundary inside a badge (or otherwise off-baseline) has no offset.
    return null;
  }

  const marker = document.createRange();
  try {
    marker.setStart(container, offset);
  } catch {
    return null;
  }
  marker.collapse(true);

  let accumulated = 0;
  for (const node of nodes) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    if (marker.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0) {
      return accumulated;
    }
    accumulated += node.nodeValue.length;
  }
  return accumulated;
}

/**
 * Convert a live selection range into a persistable anchor.
 *
 * Returns `null` when the selection cannot be anchored (outside the passage
 * body, collapsed, or whitespace only) — the caller should then decline to
 * create a highlight rather than paint one it can never restore.
 *
 * @returns {{start:number, end:number, text:string}|null}
 */
export function rangeToOffsets(root, range) {
  if (!root || !range) return null;
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

  const nodes = collectTextNodes(root);
  if (nodes.length === 0) return null;

  const rawStart = boundaryOffset(nodes, range.startContainer, range.startOffset);
  const rawEnd = boundaryOffset(nodes, range.endContainer, range.endOffset);
  if (rawStart === null || rawEnd === null) return null;

  let start = Math.min(rawStart, rawEnd);
  let end = Math.max(rawStart, rawEnd);
  const fullText = baselineText(nodes);

  // Trim the edges so a sloppy drag does not anchor onto surrounding spaces —
  // this also makes the stored text match what the learner sees highlighted.
  while (start < end && /\s/.test(fullText[start])) start += 1;
  while (end > start && /\s/.test(fullText[end - 1])) end -= 1;
  if (end <= start) return null;

  return { start, end, text: fullText.slice(start, end) };
}

/** The (node, from, to) slices covered by [start, end) across the baseline. */
function collectSegments(nodes, start, end) {
  const segments = [];
  let accumulated = 0;

  for (const node of nodes) {
    const length = node.nodeValue.length;
    const nodeStart = accumulated;
    const nodeEnd = accumulated + length;
    accumulated = nodeEnd;

    if (nodeEnd <= start) continue;
    if (nodeStart >= end) break;

    segments.push({
      node,
      from: Math.max(0, start - nodeStart),
      to: Math.min(length, end - nodeStart),
    });
  }

  return segments;
}

const segmentsText = (segments) =>
  segments.map(({ node, from, to }) => node.nodeValue.slice(from, to)).join('');

/** Find `text` in the baseline, preferring the occurrence closest to where it was. */
function relocate(fullText, text, preferredStart) {
  if (!text) return null;

  let best = null;
  let index = fullText.indexOf(text);
  while (index !== -1) {
    if (best === null || Math.abs(index - preferredStart) < Math.abs(best - preferredStart)) {
      best = index;
    }
    index = fullText.indexOf(text, index + 1);
  }

  return best === null ? null : { start: best, end: best + text.length };
}

function wrapSegment({ node, from, to }, highlight, onHighlightClick) {
  let target = node;
  if (to < target.nodeValue.length) target.splitText(to);
  if (from > 0) target = target.splitText(from);

  const span = document.createElement('span');
  span.className = `${HIGHLIGHT_CLASS} cursor-pointer transition-all duration-200 rounded-sm px-0.5 box-decoration-clone`;
  span.style.backgroundColor = highlight.color;
  // Saturated highlight colours need dark text to stay readable in every paper theme.
  span.style.color = '#1a1a1a';
  span.style.fontWeight = '500';
  span.setAttribute('data-highlight-id', String(highlight.id));

  if (onHighlightClick) {
    span.addEventListener('click', (event) => onHighlightClick(event, highlight));
  }

  target.parentNode.insertBefore(span, target);
  span.appendChild(target);
}

/** Unwrap every painted highlight, returning the body to its rendered state. */
export function clearPaintedHighlights(root) {
  if (!root) return;

  root.querySelectorAll(`span.${HIGHLIGHT_CLASS}`).forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  });
}

/**
 * Paint the given descriptors onto the passage body.
 *
 * Wrapping only ever splits text nodes — it never moves elements — so painting
 * cannot restructure the DOM React rendered, and a highlight spanning several
 * paragraphs is safe.
 *
 * @returns {string[]} ids of the highlights that could be anchored and painted.
 */
export function paintHighlights(root, highlights, { onHighlightClick } = {}) {
  if (!root) return [];
  clearPaintedHighlights(root);
  if (!Array.isArray(highlights) || highlights.length === 0) return [];

  const painted = [];

  highlights.forEach((highlight) => {
    if (!highlight || typeof highlight.start !== 'number' || typeof highlight.end !== 'number') {
      return;
    }

    // Re-collected per highlight: wrapping the previous one split its text
    // nodes. Total text is unchanged, so offsets stay valid.
    const nodes = collectTextNodes(root);
    if (nodes.length === 0) return;

    let segments = collectSegments(nodes, highlight.start, highlight.end);

    if (highlight.text && segmentsText(segments) !== highlight.text) {
      const healed = relocate(baselineText(nodes), highlight.text, highlight.start);
      if (!healed) return;
      segments = collectSegments(nodes, healed.start, healed.end);
      if (segmentsText(segments) !== highlight.text) return;
    }

    if (segments.length === 0) return;

    segments.forEach((segment) => wrapSegment(segment, highlight, onHighlightClick));
    painted.push(highlight.id);
  });

  return painted;
}
