import { useEffect, useState } from 'react';

export function useActiveHeading(tableOfContents) {
  const [activeHeadingId, setActiveHeadingId] = useState('');

  useEffect(() => {
    if (!tableOfContents || tableOfContents.length === 0) return;

    const handleScroll = () => {
      const headingElements = tableOfContents
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);

      const scrollPosition = (typeof window !== 'undefined' ? window.scrollY : 0) + 140;
      let currentId = '';

      for (const el of headingElements) {
        if (el.offsetTop <= scrollPosition) {
          currentId = el.id;
        } else {
          break;
        }
      }

      if (currentId) {
        setActiveHeadingId(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  return activeHeadingId;
}
