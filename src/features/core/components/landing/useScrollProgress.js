import { useState, useEffect } from 'react';

/**
 * Tracks whether the page has scrolled past a threshold
 * and computes scroll progress as a percentage (0–100).
 */
export function useScrollProgress(threshold = 20) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > threshold);

        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height =
          document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (height > 0) {
          setScrollProgress((winScroll / height) * 100);
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isScrolled, scrollProgress };
}
