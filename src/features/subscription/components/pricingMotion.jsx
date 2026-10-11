import React from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';

/**
 * Motion when the plan length switches. Secondary text crossfades in place;
 * the headline price rolls digit by digit (RollingPrice) so the learner sees
 * which way it moved. Nothing resizes and nothing else travels.
 *
 * Old and new share one grid cell, so they overlap for the fade instead of
 * leaving a blank beat, and the slot never changes height. 150ms ease-in-out,
 * the transitions.dev text swap timing, the same both ways.
 */
const CROSSFADE = { duration: 0.15, ease: 'easeInOut' };

const ALIGN = {
  start: 'justify-items-start',
  center: 'justify-items-center',
};

export function Crossfade({ children, as = 'span', className, slotClassName, align = 'start' }) {
  const reduce = useReducedMotion();
  const Tag = m[as];
  const content = children ?? null;
  const key = typeof content === 'string' || typeof content === 'number' ? content : 'content';

  return (
    <span
      className={`inline-grid ${ALIGN[align] || ALIGN.start} [&>*]:col-start-1 [&>*]:row-start-1 ${slotClassName || ''}`}
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

const ROLL = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };

// `custom` is the direction: 1 when the price rises, -1 when it drops.
const DIGIT = {
  enter: (direction) => ({ y: `${direction * 0.7}em`, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction) => ({ y: `${direction * -0.7}em`, opacity: 0 }),
};

function priceValue(text) {
  return Number(String(text).replace(/[^\d.]/g, '')) || 0;
}

/**
 * An odometer for a formatted price ("৳1,573", "$7.49"). Characters are keyed
 * by their place from the right, so only the digits that differ roll: up
 * like an odometer when the price rises, down when it drops. Tabular figures keep
 * every slot the same width, so the price never jumps sideways. Screen readers
 * get the whole value once, not a column of digits.
 */
export function RollingPrice({ value, className }) {
  const reduce = useReducedMotion();
  const previous = React.useRef(value);
  const direction = priceValue(value) >= priceValue(previous.current) ? 1 : -1;
  React.useEffect(() => {
    previous.current = value;
  }, [value]);

  const chars = String(value).split('');

  return (
    <span className={`relative inline-flex ${className || ''}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((char, index) => {
          const place = chars.length - index;
          return (
            <span
              key={place}
              className="inline-grid overflow-hidden [&>*]:col-start-1 [&>*]:row-start-1"
            >
              <AnimatePresence initial={false} custom={direction}>
                <m.span
                  key={char}
                  custom={direction}
                  variants={DIGIT}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduce ? { duration: 0 } : { ...ROLL, delay: index * 0.025 }}
                  className="inline-block"
                >
                  {char}
                </m.span>
              </AnimatePresence>
            </span>
          );
        })}
      </span>
    </span>
  );
}
