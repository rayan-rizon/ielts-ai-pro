import React, { memo } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Draggable handle for resizing panels in split-view layouts.
 * Used between panels (e.g., passage and questions) in test pages.
 *
 * @param {Object} props
 * @param {Function} props.onMouseDown - Mouse down handler to start resizing
 * @param {string} [props.className] - Additional classes for the container
 */
const ResizeHandle = memo(function ResizeHandle({ onMouseDown, onKeyDown, className, ...props }) {
  return (
    <div
      className={cn(
        'w-2 bg-transparent hover:bg-primary/5 cursor-col-resize flex items-center justify-center group transition-colors relative z-50 -ml-1 focus:outline-none focus:bg-primary/10',
        className
      )}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      style={{ minWidth: '8px' }}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize panels"
      {...props}
    >
      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-border group-hover:bg-primary/50 transition-colors h-full" />

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-border shadow-sm rounded-md p-0.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200">
        <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary group-focus:text-primary" />
      </div>
    </div>
  );
});

ResizeHandle.displayName = 'ResizeHandle';

export default ResizeHandle;
