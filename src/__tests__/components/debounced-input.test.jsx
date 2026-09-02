import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DebouncedInput from '@/components/ui/debounced-input';

describe('DebouncedInput', () => {
  it('flushes a pending value when its parent unmounts', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { unmount } = render(<DebouncedInput aria-label="Answer" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Answer'), { target: { value: 'last answer' } });
    unmount();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('last answer');
    act(() => vi.runOnlyPendingTimers());
    expect(onChange).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
