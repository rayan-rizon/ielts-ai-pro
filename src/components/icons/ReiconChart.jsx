import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Reicon Chart Bar Trend Up (Outline) icon for Analytics navigation.
 * Sourced from Reicon icon registry ("chart-bar-trend-up", Outline).
 */
export const ReiconChart = React.forwardRef(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        className={cn('inline-block shrink-0', className)}
        aria-hidden="true"
        {...props}
      >
        <rect x="17.6666" y="3.6667" width="3.3333" height="16.6666" rx="1.3333" ry="1.3333" />
        <rect x="10.3333" y="10.3333" width="3.3333" height="10" rx="1.3333" ry="1.3333" />
        <rect x="3" y="15.6666" width="3.3333" height="4.6667" rx="1.3333" ry="1.3333" />
        <polyline points="8.3333 3.6667 11.6666 3.6667 11.6666 7" />
        <line x1="11.3333" y1="4" x2="3.6667" y2="11.6666" />
      </svg>
    );
  }
);

ReiconChart.displayName = 'ReiconChart';
