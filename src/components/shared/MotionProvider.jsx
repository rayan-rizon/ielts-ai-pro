import React from 'react';
import { LazyMotion, MotionConfig, domMax } from 'framer-motion';

/**
 * Loads Framer Motion only for routes and sections that actually animate.
 * The public landing hero deliberately stays CSS-only so animation code does
 * not delay its first meaningful paint.
 *
 * `reducedMotion="user"` makes every motion component honour the OS
 * "Reduce motion" setting: transform and layout animation is dropped while
 * opacity and colour still transition, so state changes stay legible. Only a
 * few dozen components check `useReducedMotion()` themselves; this covers the
 * other couple of hundred.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
