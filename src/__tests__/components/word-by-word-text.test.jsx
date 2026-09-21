import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LazyMotion, domMax } from 'framer-motion';
import {
  WordByWordText,
  splitWords,
  wordVariants,
  reducedWordVariants,
} from '@/components/ui/word-by-word-text';

describe('WordByWordText', () => {
  it('splits sentences into individual words correctly', () => {
    expect(splitWords('  IELTS   Practice.   Smarter with AI.  ')).toEqual([
      'IELTS',
      'Practice.',
      'Smarter',
      'with',
      'AI.',
    ]);
    expect(splitWords('')).toEqual([]);
    expect(splitWords(null)).toEqual([]);
  });

  it('renders words in CSS mode with staggered delay variables', () => {
    const { container } = render(
      <WordByWordText
        mode="css"
        text="Practice. Review. Improve."
        delay={0.1}
        startIndex={2}
        stagger={0.08}
      />
    );

    const wordSpans = container.querySelectorAll('.animate-word-enter');
    expect(wordSpans).toHaveLength(3);
    expect(wordSpans[0].textContent).toBe('Practice.');
    // startIndex = 2, delay = 0.1s => (0.1 + 2 * 0.08) * 1000 = 260ms
    expect(wordSpans[0].style.getPropertyValue('--word-delay')).toBe('260ms');
    // next word: (0.1 + 3 * 0.08) * 1000 = 340ms
    expect(wordSpans[1].style.getPropertyValue('--word-delay')).toBe('340ms');
    // next word: (0.1 + 4 * 0.08) * 1000 = 420ms
    expect(wordSpans[2].style.getPropertyValue('--word-delay')).toBe('420ms');
  });

  it('renders words in Motion mode inside LazyMotion container', () => {
    const { container } = render(
      <LazyMotion features={domMax} strict>
        <WordByWordText text="Simple plans." />
      </LazyMotion>
    );

    expect(container.textContent).toContain('Simple');
    expect(container.textContent).toContain('plans.');
  });

  it('provides editorial variants matching Rewamp UI specifications', () => {
    expect(wordVariants.hidden).toEqual({ opacity: 0, y: 12, filter: 'blur(4px)' });
    const showTarget = wordVariants.show(2);
    expect(showTarget.opacity).toBe(1);
    expect(showTarget.y).toBe(0);
    expect(showTarget.filter).toBe('blur(0px)');
    expect(showTarget.transition.duration).toBe(0.55);
    expect(showTarget.transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);

    expect(reducedWordVariants.hidden).toEqual({ opacity: 1, y: 0, filter: 'none' });
  });
});
