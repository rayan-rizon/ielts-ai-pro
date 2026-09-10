import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WritingUpgradeDialog from '@/features/testing/writing/components/WritingTest/components/WritingUpgradeDialog';

const dialogsSource = readFileSync(
  resolve(
    process.cwd(),
    'src/features/testing/writing/components/WritingTest/components/WritingDialogs.jsx'
  ),
  'utf8'
);

describe('WritingUpgradeDialog', () => {
  it('receives current usage and the admin-configured Pro limit from its container', () => {
    expect(dialogsSource).toMatch(
      /<WritingUpgradeDialog[\s\S]*currentWritingUsage=\{usageStats\?\.ai\?\.writing\}[\s\S]*proWritingLimit=\{proWritingLimit\}/
    );
  });

  it('renders the limit reached modal with honest quota copy and 4 evaluation features', () => {
    render(
      <WritingUpgradeDialog
        open={true}
        onOpenChange={vi.fn()}
        isExiting={{ current: false }}
        navigate={vi.fn()}
        currentWritingUsage={{ used: 1.5, limit: 3 }}
        proWritingLimit={75}
      />
    );

    expect(screen.getByText('Limit Reached')).toBeInTheDocument();
    expect(screen.getByText('1.5 of 3 Used')).toBeInTheDocument();
    expect(
      screen.getByText(/You've used 1.5 of your 3 monthly Writing evaluations/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/75 EVALUATIONS \/ MO/i)).toBeInTheDocument();
    expect(screen.getByText(/any two Task 1 or Task 2 reviews/i)).toBeInTheDocument();

    expect(screen.getByText('Full IELTS Band Score (0–9)')).toBeInTheDocument();
    expect(screen.getByText('Detailed Criteria Analysis')).toBeInTheDocument();
    expect(screen.getByText('Sentence-by-Sentence Corrections')).toBeInTheDocument();
    expect(screen.getByText('Examiner Coaching & Focus Tips')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maybe later/i })).toBeInTheDocument();

    // Verify there is NO mention of "unlimited evaluations"
    expect(screen.queryByText(/unlimited evaluations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unlimited access/i)).not.toBeInTheDocument();
  });

  it('triggers navigation to /upgrade and sets isExiting flag when clicking Upgrade to Pro', () => {
    const navigate = vi.fn();
    const isExiting = { current: false };

    render(
      <WritingUpgradeDialog
        open={true}
        onOpenChange={vi.fn()}
        isExiting={isExiting}
        navigate={navigate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /upgrade to pro/i }));

    expect(isExiting.current).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/upgrade');
  });

  it('calls onOpenChange(false) when clicking Maybe Later', () => {
    const onOpenChange = vi.fn();

    render(
      <WritingUpgradeDialog
        open={true}
        onOpenChange={onOpenChange}
        isExiting={{ current: false }}
        navigate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
