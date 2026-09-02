import { useState, useEffect, useRef } from 'react';

export function useListeningTestLayout({ activePart, showAnswerSheet, isFinished }) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 40
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Sync isMobile on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const isSplitView = leftPanelWidth !== 0 && leftPanelWidth !== 100;
      const isFullWidthView = leftPanelWidth === 0 || leftPanelWidth === 100;
      if (mobile && isSplitView) {
        setLeftPanelWidth(0); // Default to Questions on mobile
      } else if (!mobile && isFullWidthView) {
        setLeftPanelWidth(40); // Restore split view on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [leftPanelWidth]);

  // Auto-scroll questions to top when switching parts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePart]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const constrainedWidth = Math.min(70, Math.max(20, newWidth));
      setLeftPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Accessibility: Keyboard resize support
  const handleResizeKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLeftPanelWidth((w) => Math.max(20, w - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLeftPanelWidth((w) => Math.min(70, w + 5));
    }
  };

  return {
    leftPanelWidth,
    setLeftPanelWidth,
    isResizing,
    setIsResizing,
    isMobile,
    containerRef,
    scrollContainerRef,
    handleResizeKeyDown,
  };
}
