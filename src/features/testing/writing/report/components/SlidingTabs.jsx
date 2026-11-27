import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { FOCUS_RING } from './reportStyles';
import { nextTabIndex } from './tabKeys';

const sameBox = (a, b) => ['x', 'y', 'w', 'h'].every((side) => a?.[side] === b[side]);

const boxOf = (tab) => ({
  x: tab.offsetLeft,
  y: tab.offsetTop,
  w: tab.offsetWidth,
  h: tab.offsetHeight,
});

/** Where the chosen tab sits, re-measured whenever labels or width change. */
function useIndicatorBox(listRef, value) {
  const [box, setBox] = useState(null);
  const measure = useCallback(() => {
    const tab = listRef.current?.querySelector('[data-active="true"]');
    if (!tab) return;
    const next = boxOf(tab);
    setBox((current) => (sameBox(current, next) ? current : next));
  }, [listRef]);

  // Every render: a new language or word count changes the tab widths.
  useLayoutEffect(() => {
    measure();
  });
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !listRef.current) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [listRef, measure, value]);
  return box;
}

function Indicator({ box, glide, className }) {
  if (!box) return null;
  return (
    <span
      data-indicator
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute left-0 top-0',
        glide &&
          'transition-[transform,width,height] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
        className
      )}
      style={{
        transform: `translate3d(${box.x}px, ${box.y}px, 0)`,
        width: box.w,
        height: box.h,
      }}
    />
  );
}

const tabState = (role, active) =>
  role === 'tab' ? { 'aria-selected': active } : { 'aria-checked': active };

/**
 * Tabs with one indicator that slides to the choice. It glides only after a tap
 * or click: arrow keys are used repeatedly, so they move it at once, and it
 * never flies in when the tabs first appear.
 */
export function SlidingTabs({ label, options, value, onChange, role = 'radiogroup', ...styles }) {
  const listRef = useRef(null);
  const [glide, setGlide] = useState(false);
  const box = useIndicatorBox(listRef, value);
  const tabRole = role === 'tablist' ? 'tab' : 'radio';

  const choose = (next, animated) => {
    if (next === value) return;
    setGlide(animated);
    onChange(next);
  };
  const onKeyDown = (event, index) => {
    const next = nextTabIndex(event, index, options.length);
    if (next === null) return;
    event.preventDefault();
    choose(options[next].value, false);
    listRef.current?.querySelectorAll(`[role="${tabRole}"]`)[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role={role}
      aria-label={label}
      className={cn('relative flex', styles.className)}
    >
      <Indicator box={box} glide={glide} className={styles.indicatorClassName} />
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role={tabRole}
            {...tabState(tabRole, active)}
            data-active={active}
            tabIndex={active ? 0 : -1}
            onClick={() => choose(option.value, true)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 cursor-pointer transition-[color,scale] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100',
              styles.tabClassName,
              active ? styles.activeClassName : styles.idleClassName,
              FOCUS_RING
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
