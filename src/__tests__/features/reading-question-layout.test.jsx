import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import ReadingStudentPreview from '@/components/admin/tests/preview/ReadingStudentPreview';
import { readingLayoutSections } from '../helpers/readingLayoutFixture';
import {
  readingInstructionParagraphs,
  readingNotesPresentation,
} from '@/features/testing/reading/utils/readingQuestionPresentation';
import { formatInstructionHTML } from '@/lib/utils';
import { aiReadingDraftSections } from '../../../supabase/functions/_shared/aiReadingDraft';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  );
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Reading source layout', () => {
  it('repairs existing imports in the real student preview without changing their data', () => {
    const sections = readingLayoutSections();
    const before = JSON.stringify(sections);
    render(<ReadingStudentPreview sections={sections} title="Layout check" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Facial Vision' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'List of Headings' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Questions \d/ })).not.toBeInTheDocument();
    expect(screen.queryByText('List of Features')).not.toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(9);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    const instruction = screen.getByText('Which paragraph contains the following information?');
    expect(instruction.tagName).toBe('P');
    expect(screen.getByText(/You may use any letter/).tagName).toBe('P');
    const summary = screen
      .getByRole('heading', { name: 'Facial Vision' })
      .parentElement.querySelector('[data-oid="il2kek2"]');
    expect(summary.querySelectorAll('p')).toHaveLength(1);
    expect(summary.querySelectorAll('input')).toHaveLength(4);
    expect(JSON.stringify(sections)).toBe(before);
  });
  it('keeps real named feature lists and custom titles', () => {
    const sections = readingLayoutSections();
    sections[0].question_groups[0].questions[0].matching_features = {
      ...sections[0].question_groups[0].questions[0].matching_features,
      box_title: 'Researchers',
      options: ['Alice', 'Ben', 'Claire', 'David', 'Emma'],
    };
    render(<ReadingStudentPreview sections={sections} title="Layout check" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Researchers' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
  it('preserves legacy rich text and sanitizes unsafe instruction markup', () => {
    const html = '<p>Choose <strong>ONE WORD ONLY</strong>.</p><p>Write your answer.</p>';
    expect(readingInstructionParagraphs(html)).toBe(html);
    const safe = formatInstructionHTML(
      readingInstructionParagraphs('<img src=x onerror="alert(1)"><script>alert(1)</script>')
    );
    expect(safe).not.toMatch(/onerror|<script/);
  });
  it('keeps ordinary sentences and existing notes headings intact', () => {
    expect(readingInstructionParagraphs('Read the passage. It describes bats.')).toBe(
      'Read the passage. It describes bats.'
    );
    expect(readingNotesPresentation('Research notes', 'Background\nA [1] result.')).toEqual({
      title: 'Research notes',
      text: 'Background\nA [1] result.',
    });
    expect(readingNotesPresentation('Questions 6–9', 'Blind people feel [6].')).toEqual({
      title: '',
      text: 'Blind people feel [6].',
    });
  });
  it('normalizes new imported summary and headings titles in the learner adapter', () => {
    const item = (number) => ({ number, text: 'Paragraph A', answer: 'i', explanation: {} });
    const draft = {
      sections: [
        {
          title: 'Source',
          content: 'Source text',
          highlights: [],
          groups: [
            {
              type: 'matching_headings',
              title: 'Questions 1–2',
              instructions: 'Choose a heading. Write the number.',
              style: 'ROMAN',
              options: ['Research', 'Discovery'],
              items: [item(1), item(2)],
            },
            {
              type: 'summary_completion',
              title: 'Questions 3–4',
              instructions: 'Complete the summary.',
              text: 'Facial Vision\n\nAn [3] result and [4].',
              items: [item(3), item(4)],
            },
          ],
        },
      ],
    };
    const groups = aiReadingDraftSections(draft)[0].question_groups;
    expect(groups[0].questions[0].matching_features.box_title).toBe('List of Headings');
    expect(groups[0].instructions).toContain('Choose a heading.\n\nWrite the number.');
    expect(groups[1].questions[0].gap_fill).toMatchObject({
      title: 'Facial Vision',
      structured_text: 'An [3] result and [4].',
      answers: { 3: 'i', 4: 'i' },
    });
  });
});
