/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Split text string into words while preserving spaces
 */
export function splitWords(text) {
  if (typeof text !== 'string') return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Pure CSS zero-runtime word-by-word animation component.
 * Deliberately imports zero JS animation libraries to keep the critical
 * landing hero bundle light, performant, and free of Framer Motion overhead.
 */
export function WordByWordTextCSS({
  text,
  children,
  as: Component = 'span',
  className,
  wordClassName,
  startIndex = 0,
  stagger = 0.075,
  delay = 0,
  ...props
}) {
  const rawText = text || (typeof children === 'string' ? children : '');
  const words = splitWords(rawText);

  if (words.length === 0 && children) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <Component className={cn('inline', className)} {...props}>
      {words.map((word, i) => {
        const wordIndex = startIndex + i;
        const wordDelayMs = Math.round((delay + wordIndex * stagger) * 1000);
        return (
          <React.Fragment key={`${word}-${i}`}>
            <span
              className={cn(
                'inline-block will-change-[transform,opacity] animate-word-enter',
                wordClassName
              )}
              style={{ '--word-delay': `${wordDelayMs}ms` }}
            >
              {word}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </Component>
  );
}

export default WordByWordTextCSS;
