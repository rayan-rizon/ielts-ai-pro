import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MotionProvider from '@/components/shared/MotionProvider';
import QuickAddCard from '@/features/vocabulary/components/QuickAddCard';

const mocked = vi.hoisted(() => ({
  fetchDefinition: vi.fn(),
  clear: vi.fn(),
  suggest: vi.fn(),
  clearSuggestions: vi.fn(),
}));
vi.mock('@/features/vocabulary/hooks', () => ({
  useWordDefinition: () => ({
    fetchWordDetails: mocked.fetchDefinition,
    clearWordData: mocked.clear,
    isFetchingDef: false,
    error: null,
  }),
  useWordSuggestions: () => ({
    suggestions: [],
    fetchSuggestions: mocked.suggest,
    clearSuggestions: mocked.clearSuggestions,
  }),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function mount(onAddWord = vi.fn()) {
  render(
    <MotionProvider>
      <QuickAddCard user={{ id: 'test', subscription_tier: 'premium' }} onAddWord={onAddWord} />
    </MotionProvider>
  );
}
it('automatically displays the resolved meaning', async () => {
  vi.useFakeTimers();
  mocked.fetchDefinition.mockResolvedValue({ definition: 'Made something appear unimportant.' });
  mount();
  fireEvent.change(screen.getByPlaceholderText('Type a word to save...'), {
    target: { value: 'trivialized' },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(401);
  });
  expect(screen.getByText('Made something appear unimportant.')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Meaning' })).not.toBeInTheDocument();
});
it('preserves a manual meaning while an automatic lookup finishes', async () => {
  vi.useFakeTimers();
  let resolveLookup;
  mocked.fetchDefinition.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLookup = resolve;
      })
  );
  mount();
  fireEvent.change(screen.getByPlaceholderText('Type a word to save...'), {
    target: { value: 'trivialized' },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(401);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enter meaning' }));
  fireEvent.change(screen.getByLabelText('Meaning'), {
    target: { value: 'My meaning in context.' },
  });
  await act(async () => resolveLookup({ definition: 'Generic meaning.' }));
  expect(screen.getByLabelText('Meaning')).toHaveValue('My meaning in context.');
});
it('uses the lightning button to look up instead of save, and preserves a failed save', async () => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  mocked.fetchDefinition.mockResolvedValue({ definition: 'A dictionary meaning.' });
  const onAddWord = vi.fn().mockResolvedValue({ success: false });
  mount(onAddWord);
  fireEvent.change(screen.getByPlaceholderText('Type a word to save...'), {
    target: { value: 'example' },
  });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up meaning' })));
  expect(onAddWord).not.toHaveBeenCalled();
  expect(screen.getByText('A dictionary meaning.')).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  expect(onAddWord).toHaveBeenCalledWith(
    expect.objectContaining({ word: 'example', definition: 'A dictionary meaning.' })
  );
  expect(screen.getByPlaceholderText('Type a word to save...')).toHaveValue('example');
});
