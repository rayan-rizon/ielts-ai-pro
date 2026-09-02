import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnnotatedText from '@/components/writing/AnnotatedText';

describe('AnnotatedText focus', () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('opens and scrolls to a requested annotation', () => {
    const annotation = {
      originalText: 'transport reduce',
      type: 'grammar',
      suggestion: 'transport reduces',
      explanation: 'A singular subject requires a singular verb.',
      severity: 'error',
    };

    render(
      <AnnotatedText
        text="Public transport reduce congestion when services are reliable."
        annotations={[annotation]}
        focusAnnotation={{ ...annotation, requestId: 1 }}
      />
    );

    expect(screen.getByText('Correction')).toBeInTheDocument();
    expect(screen.getByText('transport reduces')).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });
});
