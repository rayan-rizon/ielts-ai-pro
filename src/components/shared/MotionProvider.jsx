import React from 'react';
import { LazyMotion, domMax } from 'framer-motion';

/**
 * Loads Framer Motion only for routes and sections that actually animate.
 * The public landing hero deliberately stays CSS-only so animation code does
 * not delay its first meaningful paint.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
