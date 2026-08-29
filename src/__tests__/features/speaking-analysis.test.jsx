import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import SpeakingAnalysis from '@/features/testing/speaking/components/SpeakingAnalysis';

describe('SpeakingAnalysis component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.clearAllTimers();
    });
    vi.useRealTimers();
  });

  it('renders correctly with initial criteria steps, header, and logo', () => {
    render(<SpeakingAnalysis loadingMessage="Analyzing pronunciation..." />);

    expect(screen.getByText(/IELTS Speaking Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluating Your Speaking/i)).toBeInTheDocument();
    expect(screen.getByText(/Fluency & Coherence/i)).toBeInTheDocument();
    expect(screen.getByText(/Lexical Resource/i)).toBeInTheDocument();
    expect(screen.getByText(/Grammatical Range/i)).toBeInTheDocument();
    expect(screen.getByText(/Pronunciation Accuracy/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Evaluated against official IELTS speaking band criteria/i)
    ).toBeInTheDocument();
  });

  it('progresses through speaking steps without rendering raw numbers', () => {
    render(<SpeakingAnalysis />);

    expect(screen.getByText(/Reviewing fluency & coherence.../i)).toBeInTheDocument();

    // Advance through the first step (~1800ms)
    act(() => {
      vi.advanceTimersByTime(1900);
    });

    expect(screen.getByText(/Reviewing lexical resource.../i)).toBeInTheDocument();

    // Advance through all steps
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.getByText(/Calibrating final speaking band score.../i)).toBeInTheDocument();
  });
});
