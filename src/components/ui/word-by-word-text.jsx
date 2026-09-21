/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Word-by-word animation variants inspired by Rewamp UI.
 * Sequential reveal with subtle translateY (12px) and blur unmasking (4px -> 0px).
 */
export const wordVariants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  show: (custom = 0) => {
    const index = typeof custom === 'number' ? custom : custom?.index || 0;
    const stagger = typeof custom === 'object' && custom?.stagger != null ? custom.stagger : 0.075;
    const baseDelay = typeof custom === 'object' && custom?.delay != null ? custom.delay : 0;
    return {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        delay: baseDelay + index * stagger,
        duration: 0.55,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    };
  },
  visible: (custom = 0) => {
    const index = typeof custom === 'number' ? custom : custom?.index || 0;
    const stagger = typeof custom === 'object' && custom?.stagger != null ? custom.stagger : 0.075;
    const baseDelay = typeof custom === 'object' && custom?.delay != null ? custom.delay : 0;
    return {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        delay: baseDelay + index * stagger,
        duration: 0.55,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    };
  },
};

export const reducedWordVariants = {
  hidden: { opacity: 1, y: 0, filter: 'none' },
  show: { opacity: 1, y: 0, filter: 'none', transition: { duration: 0 } },
  visible: { opacity: 1, y: 0, filter: 'none', transition: { duration: 0 } },
};

/**
 * Split string into words while filtering empty tokens.
 */
export function splitWords(text) {
  if (typeof text !== 'string') return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * WordByWordText component
 *
 * @param {Object} props
 * @param {string} [props.text] - Plain text to animate word-by-word
 * @param {React.ReactNode} [props.children] - Children to animate (if string) or fallback
 * @param {React.ElementType} [props.as] - Root element or wrapper
 * @param {string} [props.className] - Wrapper className
 * @param {string} [props.wordClassName] - Individual word className
 * @param {'motion' | 'css'} [props.mode='motion'] - Motion engine ('motion' for framer-motion, 'css' for zero-JS CSS animation)
 * @param {number} [props.startIndex=0] - Offset index for chained word sequences
 * @param {number} [props.stagger=0.075] - Delay between words (seconds)
 * @param {number} [props.delay=0] - Base delay before sequence starts (seconds)
 * @param {Object} [props.viewport] - Viewport options for scroll triggering
 */
export function WordByWordText({
  text,
  children,
  as: Component = 'span',
  className,
  wordClassName,
  mode = 'motion',
  startIndex = 0,
  stagger = 0.075,
  delay = 0,
  viewport,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const rawText = text || (typeof children === 'string' ? children : '');
  const words = splitWords(rawText);

  if (words.length === 0 && children) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  if (mode === 'css') {
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

  const variants = shouldReduceMotion ? reducedWordVariants : wordVariants;
  const MotionWrapper = typeof Component === 'string' && m[Component] ? m[Component] : m.span;
  const hasIntersectionObserver =
    typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined';

  const motionProps = hasIntersectionObserver
    ? {
        initial: 'hidden',
        whileInView: 'show',
        viewport: viewport || { once: true, amount: 0.15 },
      }
    : {
        initial: 'hidden',
        animate: 'show',
      };

  return (
    <MotionWrapper className={cn('inline', className)} {...motionProps} {...props}>
      {words.map((word, i) => {
        const wordIndex = startIndex + i;
        return (
          <React.Fragment key={`${word}-${i}`}>
            <m.span
              custom={{ index: wordIndex, stagger, delay }}
              variants={variants}
              className={cn('inline-block will-change-[transform,opacity]', wordClassName)}
            >
              {word}
            </m.span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </MotionWrapper>
  );
}

export default WordByWordText;
