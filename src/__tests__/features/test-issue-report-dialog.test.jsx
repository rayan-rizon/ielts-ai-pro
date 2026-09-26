import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TestIssueReportDialog from '@/features/testing/shared/components/TestIssueReportDialog';
import { testIssueReportsService } from '@/features/testing/shared/services/testIssueReportsService';
import { toast } from 'sonner';

vi.mock('@/features/testing/shared/services/testIssueReportsService', () => ({
  testIssueReportsService: {
    submit: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TestIssueReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and opens dialog upon click', () => {
    render(
      <TestIssueReportDialog
        testType="reading"
        testId="cambridge-21-test-2"
        testTitle="IELTS 21 Academic Test 2"
        sectionLabel="Passage 1"
        testMode="practice"
      />
    );

    const triggerBtn = screen.getByRole('button', { name: 'Report a test issue' });
    expect(triggerBtn).toBeInTheDocument();

    // Dialog is initially closed
    expect(screen.queryByText('Report a test issue')).not.toBeInTheDocument();

    // Click trigger to open
    fireEvent.click(triggerBtn);

    expect(screen.getByRole('heading', { name: 'Report a test issue' })).toBeInTheDocument();
    expect(screen.getByText('reading')).toBeInTheDocument();
    expect(screen.getByText('IELTS 21 Academic Test 2')).toBeInTheDocument();
    expect(screen.getByText('Passage 1')).toBeInTheDocument();
    expect(screen.getByText('practice')).toBeInTheDocument();
  });

  it('renders reading category options and handles selection', () => {
    render(
      <TestIssueReportDialog
        testType="reading"
        testId="reading-101"
        testTitle="Reading Test"
        sectionLabel="Passage 2"
        testMode="exam"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report a test issue' }));

    const questionOption = screen.getByRole('radio', { name: /question \/ prompt/i });
    const answerOption = screen.getByRole('radio', { name: /answer key/i });
    const typoOption = screen.getByRole('radio', { name: /typo \/ formatting/i });
    const otherOption = screen.getByRole('radio', { name: /something else/i });

    expect(questionOption).toBeInTheDocument();
    expect(answerOption).toBeInTheDocument();
    expect(typoOption).toBeInTheDocument();
    expect(otherOption).toBeInTheDocument();

    // Audio glitch should NOT be present in reading test
    expect(screen.queryByText(/audio glitch/i)).not.toBeInTheDocument();

    // Default selected is question_error
    expect(questionOption).toHaveAttribute('aria-checked', 'true');
    expect(answerOption).toHaveAttribute('aria-checked', 'false');

    // Click to select Answer Key
    fireEvent.click(answerOption);
    expect(answerOption).toHaveAttribute('aria-checked', 'true');
    expect(questionOption).toHaveAttribute('aria-checked', 'false');
  });

  it('includes audio glitch option when testType is listening', () => {
    render(
      <TestIssueReportDialog
        testType="listening"
        testId="listening-202"
        testTitle="Listening Test 1"
        sectionLabel="Part 3"
        testMode="practice"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report a test issue' }));

    expect(screen.getByRole('radio', { name: /audio glitch/i })).toBeInTheDocument();
  });

  it('validates description length before enabling submit', () => {
    render(
      <TestIssueReportDialog
        testType="reading"
        testId="reading-101"
        testTitle="Reading Test"
        sectionLabel="Passage 1"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report a test issue' }));

    const submitBtn = screen.getByRole('button', { name: /send report/i });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/describe what looks wrong/i);

    // Type less than 10 characters
    fireEvent.change(textarea, { target: { value: 'Too short' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/please provide at least 10 characters/i)).toBeInTheDocument();

    // Type 10 or more characters
    fireEvent.change(textarea, {
      target: { value: 'Question 12 seems to have two correct answers.' },
    });
    expect(submitBtn).not.toBeDisabled();
    expect(screen.queryByText(/please provide at least 10 characters/i)).not.toBeInTheDocument();
  });

  it('successfully submits report and resets form', async () => {
    testIssueReportsService.submit.mockResolvedValueOnce({ id: 'report-123' });

    render(
      <TestIssueReportDialog
        testType="reading"
        testId="reading-101"
        testTitle="Academic Test 4"
        sectionLabel="Passage 3"
        testMode="practice"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Report a test issue' }));

    // Select category
    fireEvent.click(screen.getByRole('radio', { name: /typo \/ formatting/i }));

    // Fill location
    const locationInput = screen.getByLabelText(/question or location/i);
    fireEvent.change(locationInput, { target: { value: 'Passage 3 Paragraph D' } });

    // Fill description
    const textarea = screen.getByPlaceholderText(/describe what looks wrong/i);
    fireEvent.change(textarea, {
      target: { value: 'There is a misspelling in line 4: teh instead of the.' },
    });

    const submitBtn = screen.getByRole('button', { name: /send report/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(testIssueReportsService.submit).toHaveBeenCalledWith({
        testType: 'reading',
        issueType: 'typo',
        description: 'There is a misspelling in line 4: teh instead of the.',
        testId: 'reading-101',
        testTitle: 'Academic Test 4',
        sectionLabel: 'Passage 3',
        questionReference: 'Passage 3 Paragraph D',
        testMode: 'practice',
      });
      expect(toast.success).toHaveBeenCalledWith('Report sent', expect.any(Object));
    });
  });
});
