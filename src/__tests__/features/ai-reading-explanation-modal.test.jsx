import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiReadingExplanationModal from '@/components/admin/tests/ai/AiReadingExplanationModal';
import { generateReadingExplanations } from '@/lib/aiReadingDraftClient';
vi.mock('@/lib/aiReadingDraftClient', () => ({ generateReadingExplanations: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const sections = [
  { content: 'The library opened in 1999.', groups: [{ questions: [{ correct_answer: 'TRUE' }] }] },
];
const explanations = {
  1: {
    correct_answer: 'TRUE',
    why_correct: 'The opening date is explicitly stated in the passage.',
    passage_highlight: 'The library opened in 1999.',
    synonym_map: [],
    why_wrong: {},
  },
};
describe('AI explanation review flow', () => {
  it('applies generated explanations without a checklist', async () => {
    generateReadingExplanations.mockResolvedValue({ explanations, model: 'openai/gpt-6-luna' });
    const onApply = vi.fn(),
      onClose = vi.fn(),
      before = JSON.stringify(sections);
    render(
      <AiReadingExplanationModal
        sections={sections}
        selectedSection={0}
        onApply={onApply}
        onClose={onClose}
      />
    );
    expect(screen.getByRole('combobox', { name: 'Generate for' })).toHaveTextContent('Passage 1');
    fireEvent.click(screen.getByRole('button', { name: 'Generate explanations' }));
    const apply = await screen.findByRole('button', { name: 'Apply explanations' });
    expect(apply).toBeEnabled();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(apply);
    expect(onApply).toHaveBeenCalledWith(explanations);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(sections)).toBe(before);
  });
  it('keeps failed input and refuses to apply stale evidence after the source changes', async () => {
    generateReadingExplanations
      .mockRejectedValueOnce(new Error('Provider unavailable.'))
      .mockResolvedValue({ explanations });
    const onApply = vi.fn();
    const props = { sections, selectedSection: 0, onApply, onClose: vi.fn() };
    const view = render(<AiReadingExplanationModal {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate explanations' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Provider unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Generate explanations' }));
    await screen.findByRole('button', { name: 'Apply explanations' });
    view.rerender(
      <AiReadingExplanationModal
        {...props}
        sections={[{ ...sections[0], content: 'Edited passage' }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apply explanations' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('test changed'));
    expect(onApply).not.toHaveBeenCalled();
  });
});
