import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuestionHighlighter from '@/features/testing/shared/components/QuestionHighlighter';

function selectText(element, start, end) {
  const range = document.createRange();
  range.setStart(element.firstChild, start);
  range.setEnd(element.firstChild, end);
  act(() => {
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

function Fixture({ scope = 'reading:session-1:practice:0', mode = 'practice', answer = '' }) {
  return (
    <QuestionHighlighter scope={scope} mode={mode}>
      <p>Choose the correct answer</p>
      <input aria-label="Answer" value={answer} readOnly />
    </QuestionHighlighter>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  Range.prototype.getBoundingClientRect = vi
    .fn()
    .mockReturnValue({ left: 40, right: 150, top: 100, bottom: 120, width: 110, height: 20 });
  Range.prototype.getClientRects = vi
    .fn()
    .mockReturnValue([{ left: 40, right: 150, top: 100, bottom: 120 }]);
  vi.stubGlobal('CSS', { highlights: new Map() });
  vi.stubGlobal(
    'Highlight',
    class extends Set {
      constructor(...ranges) {
        super(ranges);
      }
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.getSelection().removeAllRanges();
});

describe('question highlighting', () => {
  it.each(['exam', 'practice'])(
    'highlights selected question words in %s without changing answers',
    (mode) => {
      const { rerender } = render(<Fixture mode={mode} />);
      selectText(screen.getByText('Choose the correct answer'), 11, 18);
      fireEvent.click(screen.getByRole('button', { name: 'Highlight in Yellow' }));
      const ranges = [...CSS.highlights.values()].flatMap((highlight) => [...highlight]);
      expect(ranges.map((range) => range.toString())).toEqual(['correct']);
      rerender(<Fixture mode={mode} answer="A" />);
      expect(screen.getByRole('textbox', { name: 'Answer' }).value).toBe('A');
      expect([...CSS.highlights.values()].flatMap((h) => [...h]).map((r) => r.toString())).toEqual([
        'correct',
      ]);
      fireEvent.click(screen.getByText('Choose the correct answer'), { clientX: 60, clientY: 110 });
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
      expect([...CSS.highlights.values()].flatMap((h) => [...h])).toEqual([]);
    }
  );

  it('restores highlights after remount and isolates other parts and sessions', () => {
    const view = render(<Fixture />);
    selectText(screen.getByText('Choose the correct answer'), 11, 18);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Yellow' }));
    view.unmount();
    expect(CSS.highlights.size).toBe(0);
    const next = render(<Fixture scope="reading:session-1:practice:1" />);
    expect([...CSS.highlights.values()].flatMap((h) => [...h])).toEqual([]);
    next.rerender(<Fixture scope="reading:session-1:practice:0" />);
    expect([...CSS.highlights.values()].flatMap((h) => [...h]).map((r) => r.toString())).toEqual([
      'correct',
    ]);
    next.rerender(<Fixture scope="listening:session-2:exam:0" />);
    expect([...CSS.highlights.values()].flatMap((h) => [...h])).toEqual([]);
  });

  it('ignores selections outside questions and replaces only overlapping highlights', () => {
    render(
      <>
        <p>Outside text</p>
        <Fixture />
      </>
    );
    selectText(screen.getByText('Outside text'), 0, 7);
    expect(screen.queryByRole('button', { name: 'Highlight in Yellow' })).toBeNull();
    expect(screen.queryByRole('toolbar')).toBeNull();
    const question = screen.getByText('Choose the correct answer');
    selectText(question, 0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Yellow' }));
    selectText(question, 11, 18);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Yellow' }));
    selectText(question, 0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Pink' }));
    expect(
      [...CSS.highlights.values()]
        .flatMap((h) => [...h])
        .map((r) => r.toString())
        .sort()
    ).toEqual(['Choose', 'correct']);
  });

  it('shows the existing five-color floating palette and supports changing a highlight color', () => {
    render(<Fixture />);
    expect(screen.queryByRole('button', { name: 'Highlight in Yellow' })).toBeNull();
    selectText(screen.getByText('Choose the correct answer'), 11, 18);
    for (const color of ['Yellow', 'Blue', 'Green', 'Pink', 'Red']) {
      expect(screen.getByRole('button', { name: `Highlight in ${color}` })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Red' }));
    fireEvent.click(screen.getByText('Choose the correct answer'), { clientX: 60, clientY: 110 });
    fireEvent.click(screen.getByRole('button', { name: 'Change Color' }));
    fireEvent.click(screen.getByRole('button', { name: 'Highlight in Blue' }));
    expect(
      [...CSS.highlights.entries()]
        .filter(([, h]) => h.size)
        .map(([name]) => name.split('-').at(-1))
    ).toEqual(['blue']);
  });
});

it.each(['exam', 'practice'])('only offers question assistance in practice mode (%s)', (mode) => {
  const request = vi.fn();
  render(
    <QuestionHighlighter
      scope={`actions:${mode}`}
      mode={mode}
      assistantEnabled
      onAssistantAction={request}
    >
      <p>Choose the correct answer</p>
    </QuestionHighlighter>
  );
  selectText(screen.getByText('Choose the correct answer'), 11, 18);
  for (const action of ['Simplify', 'Translate', 'Breakdown']) {
    if (mode === 'exam') expect(screen.queryByRole('button', { name: action })).toBeNull();
    else expect(screen.getByRole('button', { name: action })).toBeTruthy();
  }
  if (mode === 'practice') {
    fireEvent.click(screen.getByRole('button', { name: 'Simplify' }));
    expect(request).toHaveBeenCalledWith(
      'simplify',
      expect.objectContaining({ text: 'correct', source: 'question' })
    );
  }
});
