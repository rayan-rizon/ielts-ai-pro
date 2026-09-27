import React from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';

/**
 * The only motion when the plan length switches: text that changes in place
 * crossfades. Nothing counts, travels, blurs or resizes — switching plans is a
 * price comparison, and movement there reads as noise.
 *
 * Old and new share one grid cell, so they overlap for the fade instead of
 * leaving a blank beat, and the slot never changes height. 150ms ease-in-out,
 * the transitions.dev text swap timing, the same both ways.
 */
const CROSSFADE = { duration: 0.15, ease: 'easeInOut' };

export function Crossfade({ children, as = 'span', className, slotClassName, align = 'start' }) {
  const reduce = useReducedMotion();
  const Tag = m[as];
  const content = children ?? null;
  const key = typeof content === 'string' || typeof content === 'number' ? content : 'content';

  return (
    <span
      className={`inline-grid ${align === 'center' ? 'justify-items-center' : 'justify-items-start'} [&>*]:col-start-1 [&>*]:row-start-1 ${slotClassName || ''}`}
    >
      <AnimatePresence initial={false}>
        {content !== null && content !== '' && (
          <Tag
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0 } : CROSSFADE}
            className={className}
          >
            {content}
          </Tag>
        )}
      </AnimatePresence>
    </span>
  );
}

/** A full-width line that keeps its height whether or not it holds text. */
export function SwapLine({ children, className, align }) {
  return (
    <Crossfade as="p" className={className} slotClassName="grid min-h-5 w-full" align={align}>
      {children || null}
    </Crossfade>
  );
}
