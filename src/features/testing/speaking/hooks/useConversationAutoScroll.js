import { useEffect, useRef } from 'react';

/**
 * Keeps the conversation transcript pinned to its newest message.
 *
 * Scrolling on `conversation` changes alone is not enough: pressing Finish
 * neither adds nor removes an entry, yet the draft-transcript bubble, the
 * processing status and the examiner's reply all keep growing the container
 * afterwards. Chasing that with fixed timeouts missed whichever growth landed
 * last — which is why the view stayed stuck above the newest bubble.
 *
 * Watching the container itself covers every one of those cases, including the
 * framer-motion enter animations that resize a message after it mounts.
 * A learner who deliberately scrolls up to reread is left alone until they
 * return to the bottom.
 */

// Generous enough to survive sub-pixel rounding and an in-flight smooth scroll.
const PINNED_THRESHOLD_PX = 120;
// Not every environment implements the smooth-scroll API (jsdom, older WebKit).
function scrollElementToBottom(container, behavior) {
  if (typeof container.scrollTo === 'function') {
    container.scrollTo({ top: container.scrollHeight, behavior });
    return;
  }
  container.scrollTop = container.scrollHeight;
}
// How long after a wheel/touch/key press its resulting scroll may unpin.
const USER_INTENT_WINDOW_MS = 600;

export default function useConversationAutoScroll(containerRef, { enabled = true } = {}) {
  const pinnedRef = useRef(true);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !enabled) return undefined;

    const distanceFromBottom = () =>
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const scrollToBottom = (behavior) => {
      if (!pinnedRef.current) return;
      scrollElementToBottom(container, behavior);
    };

    // A plain `scroll` listener cannot tell the learner apart from our own
    // smooth-scroll animation, whose intermediate frames sit far from the
    // bottom — reading those as "the learner scrolled away" unpinned the view
    // on the very first scroll it performed, so a growing transcript was
    // followed exactly once and then abandoned.
    //
    // Input events fire *before* the scrolling they cause, so they cannot be
    // measured directly either. They instead open a short window in which the
    // resulting scroll position is allowed to unpin.
    let userIntentUntil = 0;
    const markUserIntent = () => {
      userIntentUntil = Date.now() + USER_INTENT_WINDOW_MS;
    };

    const handleScroll = () => {
      const atBottom = distanceFromBottom() <= PINNED_THRESHOLD_PX;
      if (atBottom) {
        pinnedRef.current = true;
        return;
      }
      if (Date.now() <= userIntentUntil) pinnedRef.current = false;
    };

    const intentEvents = ['wheel', 'touchmove', 'keydown', 'mousedown'];
    intentEvents.forEach((event) =>
      container.addEventListener(event, markUserIntent, { passive: true })
    );
    container.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver = null;
    let mutationObserver = null;

    if (typeof ResizeObserver === 'function') {
      // Fires when a message grows — animating in, wrapping, or streaming text.
      resizeObserver = new ResizeObserver(() => scrollToBottom('auto'));
      resizeObserver.observe(container);
      Array.from(container.children).forEach((child) => resizeObserver.observe(child));
    }

    if (typeof MutationObserver === 'function') {
      mutationObserver = new MutationObserver((records) => {
        records.forEach((record) =>
          record.addedNodes.forEach((node) => {
            if (node.nodeType === 1) resizeObserver?.observe(node);
          })
        );
        scrollToBottom('smooth');
      });
      mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
    }

    scrollToBottom('auto');

    return () => {
      container.removeEventListener('scroll', handleScroll);
      intentEvents.forEach((event) => container.removeEventListener(event, markUserIntent));
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [containerRef, enabled]);

  /** Re-follow the newest message even if the learner had scrolled away. */
  const scrollToLatest = useRef((behavior = 'smooth') => {
    const container = containerRef?.current;
    if (!container) return;
    pinnedRef.current = true;
    scrollElementToBottom(container, behavior);
  }).current;

  return { scrollToLatest };
}
