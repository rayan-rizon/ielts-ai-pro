import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WritingEditor } from '@/features/testing/writing/components/WritingTest/components/WritingEditor';
import { flushPendingWritingDrafts } from '@/features/testing/writing/writingDraftFlush';

vi.mock('react-quill-new', () => ({
  default: React.forwardRef(function TestEditor({ value, onChange }, _ref) {
    return (
      <textarea
        aria-label="Writing response"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }),
}));

describe('Writing editor submission flush', () => {
  afterEach(() => vi.useRealTimers());

  it('flushes the final keystrokes before the debounce and cancels the delayed write', async () => {
    const setWriting = vi.fn();
    const rendered = render(<WritingEditor writing="" setWriting={setWriting} wordCount={0} />);
    const editor = await screen.findByRole('textbox', { name: 'Writing response' });
    vi.useFakeTimers();
    fireEvent.change(editor, { target: { value: 'The final sentence must be submitted.' } });
    expect(setWriting).not.toHaveBeenCalled();
    act(() => flushPendingWritingDrafts());
    expect(setWriting).toHaveBeenCalledExactlyOnceWith('The final sentence must be submitted.');
    act(() => vi.advanceTimersByTime(600));
    expect(setWriting).toHaveBeenCalledTimes(1);
    rendered.unmount();
    setWriting.mockClear();
    act(() => flushPendingWritingDrafts());
    expect(setWriting).not.toHaveBeenCalled();
  });
});
