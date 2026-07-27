import React from 'react';
import { cn } from '@/lib/cn';

export function Logo({
  className,
  iconOnly = false,
  variant = 'auto', // 'auto' | 'light' | 'dark' | 'footer'
  size = 'md',
  animated = true,
}) {
  const sizeClasses = {
    sm: { height: 'h-6 sm:h-7', icon: 'w-7 h-7' },
    md: { height: 'h-8 sm:h-9', icon: 'w-9 h-9' },
    lg: { height: 'h-10 sm:h-11', icon: 'w-11 h-11' },
    xl: { height: 'h-12 sm:h-14', icon: 'w-14 h-14' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (iconOnly) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 transition-transform duration-300',
          animated && 'hover:scale-105 hover:rotate-3',
          currentSize.icon,
          className
        )}
      >
        <img
          src="/logo-icon.svg"
          alt="IELTS AI Pro Icon"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Force dark logo (footer.svg) for variant="dark" or variant="footer"
  if (variant === 'dark' || variant === 'footer') {
    return (
      <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
        <img
          src="/footer.svg"
          alt="IELTS AI Pro Logo"
          className={cn(
            'w-auto object-contain transition-transform duration-300',
            animated && 'group-hover:scale-[1.03]',
            currentSize.height
          )}
        />
      </div>
    );
  }

  // Force light logo (logo.svg) for variant="light"
  if (variant === 'light') {
    return (
      <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
        <img
          src="/logo.svg"
          alt="IELTS AI Pro Logo"
          className={cn(
            'w-auto object-contain transition-transform duration-300',
            animated && 'group-hover:scale-[1.03]',
            currentSize.height
          )}
        />
      </div>
    );
  }

  // Responsive / Theme-aware (auto): logo.svg on light theme, footer.svg on dark theme
  return (
    <div className={cn('inline-flex items-center group select-none cursor-pointer', className)}>
      <img
        src="/logo.svg"
        alt="IELTS AI Pro Logo"
        className={cn(
          'dark:hidden w-auto object-contain transition-transform duration-300',
          animated && 'group-hover:scale-[1.03]',
          currentSize.height
        )}
      />
      <img
        src="/footer.svg"
        alt="IELTS AI Pro Logo"
        className={cn(
          'hidden dark:block w-auto object-contain transition-transform duration-300',
          animated && 'group-hover:scale-[1.03]',
          currentSize.height
        )}
      />
    </div>
  );
}
