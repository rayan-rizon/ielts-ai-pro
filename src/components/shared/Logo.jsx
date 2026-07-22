import React from 'react';
import { cn } from '@/lib/cn';

export function Logo({ className, iconOnly = false, size = 'md', animated = true }) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-sm' },
    md: { icon: 'h-8 w-8', text: 'text-base md:text-lg' },
    lg: { icon: 'h-10 w-10 md:h-12 md:w-12', text: 'text-xl md:text-2xl' },
    xl: { icon: 'h-14 w-14 md:h-16 md:w-16', text: 'text-2xl md:text-3xl' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 sm:gap-3 group select-none cursor-pointer',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden',
          animated && 'transition-all duration-300 group-hover:scale-105 group-hover:rotate-6',
          currentSize.icon
        )}
      >
        <img
          src="/favicon-64.webp"
          alt="IELTS Ai Pro Logo"
          width="64"
          height="64"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {!iconOnly && (
        <span
          className={cn(
            'font-black tracking-tight text-current transition-colors duration-300',
            currentSize.text
          )}
        >
          IELTS <span className="text-primary italic font-black">Ai</span> Pro
        </span>
      )}
    </div>
  );
}
