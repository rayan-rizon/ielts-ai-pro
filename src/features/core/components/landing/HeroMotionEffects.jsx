import { useEffect } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/**
 * Adds the continuous hero movement after the first paint. Keeping this in a
 * lazy chunk preserves the visual effect without making Framer Motion part of
 * the landing page's critical rendering path.
 */
export default function HeroMotionEffects() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return undefined;

    const root = document.querySelector('[data-hero-root]');
    const cards = root?.querySelectorAll('[data-hero-motion="float"]') || [];
    const controls = Array.from(cards).map((card, index) =>
      animate(
        card,
        { y: [0, -5, 0] },
        {
          duration: 5.4 + index * 0.35,
          delay: index * 0.12,
          repeat: Infinity,
          ease: 'easeInOut',
        }
      )
    );

    return () => controls.forEach((control) => control.stop());
  }, [reducedMotion]);

  return null;
}
