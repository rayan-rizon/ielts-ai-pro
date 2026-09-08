/**
 * Anchor scrolling for the landing page's lazily-rendered sections.
 *
 * The landing page defers below-the-fold sections behind an IntersectionObserver
 * and holds their place with an estimated `minHeight`. A plain `#pricing` anchor
 * jump therefore aims at a position that is wrong by however much those
 * estimates differ from the real content: the browser starts a smooth scroll
 * toward the placeholder offset, the sections mount and grow underneath it, and
 * the scroll stops hundreds of pixels short of the section it was aiming at.
 *
 * The fix is to re-aim rather than to pre-render. Forcing every section to mount
 * up front does make the offsets honest, but mounting six lazy sections at once
 * blocks the main thread long enough to eat the whole animation — the visitor
 * gets a freeze and then a jump. Instead the target's offset is sampled each
 * frame and `scrollIntoView` re-issued whenever it moves. The browser retargets
 * the animation it is already running, so the motion stays continuous while the
 * sections mount along the way.
 */

/** Stop re-aiming eventually, even if something on the page never settles. */
const SETTLE_TIMEOUT_MS = 4000;

/**
 * Smooth-scroll to a section by id, correcting for late-mounting content.
 *
 * @returns {boolean} whether an element with that id was found.
 */
export function smoothScrollToSection(id) {
  if (typeof document === 'undefined') return false;
  const element = document.getElementById(id);
  if (!element) return false;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';

  let cancelled = false;
  let lastTop = null;
  const startedAt = performance.now();

  const cancel = () => {
    cancelled = true;
    teardown();
  };

  function teardown() {
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
  }

  // The moment the visitor takes over the scroll, stop fighting them for it.
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);

  const tick = () => {
    if (cancelled) return;

    const node = document.getElementById(id);
    if (!node) {
      teardown();
      return;
    }

    const top = node.getBoundingClientRect().top + window.scrollY;
    if (lastTop === null || Math.abs(top - lastTop) > 1) {
      lastTop = top;
      // `block: 'start'` honours the root's `scroll-padding-top`, which already
      // accounts for the fixed navbar.
      node.scrollIntoView({ behavior, block: 'start' });
    }

    if (performance.now() - startedAt > SETTLE_TIMEOUT_MS) {
      teardown();
      return;
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return true;
}

/** Pull the section id out of an in-page anchor href (`#pricing`, `/#pricing`). */
export function sectionIdFromHref(href) {
  if (!href) return null;
  const match = /^(?:\/)?#(.+)$/.exec(href);
  return match ? decodeURIComponent(match[1]) : null;
}
