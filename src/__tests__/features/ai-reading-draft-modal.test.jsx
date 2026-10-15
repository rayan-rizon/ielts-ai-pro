import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiReadingDraftModal from '@/components/admin/tests/ai/AiReadingDraftModal';
import { aiListeningFixture, aiListeningInput } from '../helpers/aiListeningFixture';
import { aiReadingFixture, aiReadingInput } from '../helpers/aiReadingFixture';
import {
  generateReadingDraft,
  saveReadingAiDraft,
  generateListeningDraft,
  saveListeningAiDraft,
} from '@/lib/aiReadingDraftClient';

vi.mock('@/lib/aiReadingDraftClient', () => ({
  generateReadingDraft: vi.fn(),
  generateListeningDraft: vi.fn(),
  saveListeningAiDraft: vi.fn(),
  saveReadingAiDraft: vi.fn(),
  prepareReadingScreenshot: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const fillSources = () => {
  const input = aiReadingInput();
  fireEvent.change(screen.getByLabelText('Expected questions'), { target: { value: 13 } });
  fireEvent.change(screen.getByLabelText('Passages'), { target: { value: input.passageText } });
  fireEvent.change(screen.getByLabelText('Questions'), { target: { value: input.questionText } });
  fireEvent.change(screen.getByLabelText('Answer key'), { target: { value: input.answerText } });
};
const preview = async () => {
  generateReadingDraft.mockResolvedValue({
    draft: aiReadingFixture(),
    model: 'openai/gpt-6-luna',
    usage: { estimatedProviderCostUsd: 0.002 },
  });
  fillSources();
  fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
  await screen.findByText('Review your Reading draft');
};

describe('AI Reading creator review and save flow', () => {
  it('generates with no key and replaces the checklist with missing-answer warnings', async () => {
    generateReadingDraft.mockResolvedValue({
      draft: aiReadingFixture(),
      model: 'openai/gpt-6-luna',
      answerSource: 'inferred',
    });
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={vi.fn()} />);
    fillSources();
    fireEvent.change(screen.getByLabelText('Answer key'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
    expect(await screen.findByRole('note')).toHaveTextContent('No answer key was supplied');
    expect(generateReadingDraft.mock.calls[0][0].answerText).toBe('');
    const save = screen.getByRole('button', { name: 'Save inactive draft' });
    expect(save).toBeEnabled();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Correct answer · Q1'), {
      target: { value: '' },
    });
    expect(save).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Completeness warnings' })).toHaveTextContent(
      'Missing answers: Q1'
    );
    fireEvent.change(screen.getByLabelText('Correct answer · Q1'), { target: { value: 'TRUE' } });
    expect(save).toBeEnabled();
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
  });
  it('imports all four Listening parts in one request and saves only a new inactive draft', async () => {
    generateListeningDraft.mockResolvedValue({
      draft: aiListeningFixture(),
      model: 'openai/gpt-6-luna',
    });
    saveListeningAiDraft.mockResolvedValue('new-listening-draft');
    const onSaved = vi.fn();
    render(<AiReadingDraftModal testType="listening" onClose={vi.fn()} onSaved={onSaved} />);
    const input = aiListeningInput();
    fireEvent.change(screen.getByLabelText('Transcripts'), {
      target: { value: input.passageText },
    });
    fireEvent.change(screen.getByLabelText('Questions'), { target: { value: input.questionText } });
    fireEvent.change(screen.getByLabelText('Answer key'), { target: { value: input.answerText } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
    await screen.findByText('Review your Listening draft');
    expect(screen.getByRole('button', { name: 'Part 4 · 2 questions' })).toBeInTheDocument();
    expect(generateReadingDraft).not.toHaveBeenCalled();
    expect(saveListeningAiDraft).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save inactive draft' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('new-listening-draft'));
    expect(saveListeningAiDraft.mock.calls[0][0]).toMatchObject({
      expectedQuestions: 8,
      audioUrls: ['', '', '', ''],
    });
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
  });
  it('accepts all three passages and one complete answer key in a single batch', async () => {
    const draft = aiReadingFixture();
    const item = draft.sections[0].groups[0].items[0];
    draft.sections = [0, 1, 2].map((index) => ({
      title: `Passage ${index + 1}`,
      content: draft.sections[0].content,
      groups: [
        {
          type: 'true_false_not_given',
          instructions: 'TRUE, FALSE or NOT GIVEN',
          items: [
            { ...item, number: index * 2 + 1 },
            { ...item, number: index * 2 + 2, answer: 'FALSE' },
          ],
        },
      ],
    }));
    generateReadingDraft.mockResolvedValue({ draft, model: 'openai/gpt-6-luna' });
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={vi.fn()} />);
    expect(screen.queryByLabelText('Passage source options')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Passages'), {
      target: {
        value: 'Passage 1\nFirst source.\n\nPassage 2\nSecond source.\n\nPassage 3\nThird source.',
      },
    });
    fireEvent.change(screen.getByLabelText('Questions'), {
      target: { value: 'All questions 1–6.' },
    });
    fireEvent.change(screen.getByLabelText('Answer key'), {
      target: { value: '1. TRUE\n2. FALSE\n3. TRUE\n4. FALSE\n5. TRUE\n6. FALSE' },
    });
    expect(screen.getByLabelText('Expected questions')).toHaveValue(6);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
    await screen.findByText('Review your Reading draft');
    expect(generateReadingDraft).toHaveBeenCalledTimes(1);
    expect(generateReadingDraft.mock.calls[0][0]).toMatchObject({
      expectedQuestions: 6,
      answerText: '1. TRUE\n2. FALSE\n3. TRUE\n4. FALSE\n5. TRUE\n6. FALSE',
    });
    expect(screen.getByRole('button', { name: 'Passage 3 · 2 questions' })).toBeInTheDocument();
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
  });
  it('rejects missing input without calling AI or a save endpoint', async () => {
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('passage');
    expect(generateReadingDraft).not.toHaveBeenCalled();
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
  });
  it('generates a validated preview without writes and saves an inactive draft without a checklist', async () => {
    const onSaved = vi.fn();
    saveReadingAiDraft.mockResolvedValue('new-draft-id');
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={onSaved} />);
    await preview();
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
    const save = screen.getByRole('button', { name: 'Save inactive draft' });
    expect(save).toBeEnabled();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.click(save);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('new-draft-id'));
    const payload = saveReadingAiDraft.mock.calls[0][0];
    expect(payload).toMatchObject({
      expectedQuestions: 13,
      testFormat: 'Academic',
      accessTier: 'free',
    });
    expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload).not.toHaveProperty('passageId');
    expect(payload.draft).not.toHaveProperty('is_active');
  });
  it('keeps a failed save preview and uses the same idempotency key when retrying', async () => {
    saveReadingAiDraft
      .mockRejectedValueOnce(new Error('Could not save.'))
      .mockResolvedValueOnce('draft');
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={vi.fn()} />);
    await preview();
    fireEvent.click(screen.getByRole('button', { name: 'Save inactive draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save.');
    fireEvent.click(screen.getByRole('button', { name: 'Save inactive draft' }));
    await waitFor(() => expect(saveReadingAiDraft).toHaveBeenCalledTimes(2));
    expect(saveReadingAiDraft.mock.calls[0][0].requestId).toBe(
      saveReadingAiDraft.mock.calls[1][0].requestId
    );
    expect(screen.getByText('Review your Reading draft')).toBeInTheDocument();
  });
  it('blocks evidence that no longer matches the passage after edits', async () => {
    render(<AiReadingDraftModal onClose={vi.fn()} onSaved={vi.fn()} />);
    await preview();
    fireEvent.change(screen.getByLabelText('Passage text'), {
      target: { value: 'Changed source with no matching evidence.' },
    });
    expect(screen.getByRole('button', { name: 'Save inactive draft' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('actual passage');
  });
  it('preserves text when returning to source and never saves a dismissed generation', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<AiReadingDraftModal onClose={onClose} onSaved={onSaved} />);
    await preview();
    fireEvent.click(screen.getByRole('button', { name: 'Back to source' }));
    expect(screen.getByLabelText('Passages')).toHaveValue(aiReadingInput().passageText);
    let resolve;
    generateReadingDraft.mockImplementationOnce(
      () =>
        new Promise((next) => {
          resolve = next;
        })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Generate test and explanations' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close AI creator' }));
    expect(onClose).toHaveBeenCalled();
    resolve({ draft: aiReadingFixture() });
    await waitFor(() => expect(generateReadingDraft).toHaveBeenCalledTimes(2));
    expect(onSaved).not.toHaveBeenCalled();
    expect(saveReadingAiDraft).not.toHaveBeenCalled();
  });
});
