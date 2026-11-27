const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const readsRightToLeft = (element) => element.closest('[dir]')?.getAttribute('dir') === 'rtl';

/** The tab an arrow key moves to, or null. Left and right mirror in RTL text. */
export function nextTabIndex(event, index, count) {
  const step = STEP[event.key];
  if (!step) return null;
  const horizontal = /Left|Right$/.test(event.key);
  const mirrored = horizontal && readsRightToLeft(event.currentTarget);
  return (index + (mirrored ? -step : step) + count) % count;
}
