import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let profile = null;
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ userProfile: profile }),
}));
const read = vi.fn();
const save = vi.fn();
vi.mock('@/features/testing/writing/report/reportLanguagePreference', () => ({
  readSavedReportLanguage: (...args) => read(...args),
  saveReportLanguage: (...args) => save(...args),
}));

const { ReportLanguageSetting } =
  await import('@/features/testing/writing/report/components/ReportLanguageSetting');
const { resetReportLanguageForTests } =
  await import('@/features/testing/writing/report/useReportLanguage');

const select = () => screen.getByRole('combobox', { name: 'Report language' });
const saveButton = () => screen.getByRole('button', { name: /save language/i });

describe('report language in profile settings', () => {
  beforeEach(() => {
    profile = { id: 'u1', settings: { report_language: 'hi' } };
    read.mockReset().mockResolvedValue(null);
    save.mockReset().mockResolvedValue({});
    resetReportLanguageForTests();
  });

  it('shows the saved language and has nothing to save until it changes', () => {
    render(<ReportLanguageSetting />);
    expect(select()).toHaveValue('hi');
    expect(saveButton()).toBeDisabled();
  });

  it('is English for a learner who has never chosen', () => {
    profile = { id: 'u1', settings: {} };
    render(<ReportLanguageSetting />);
    expect(select()).toHaveValue('en');
  });

  it('saves only when the learner presses save, and confirms it', async () => {
    render(<ReportLanguageSetting />);
    fireEvent.change(select(), { target: { value: 'bn' } });
    expect(save).not.toHaveBeenCalled();

    fireEvent.click(saveButton());

    expect(save).toHaveBeenCalledWith('bn');
    expect(await screen.findByText('Report language saved.')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('says when it was not saved and lets the learner try again', async () => {
    save.mockRejectedValueOnce(new Error('denied'));
    render(<ReportLanguageSetting />);
    fireEvent.change(select(), { target: { value: 'ur' } });
    fireEvent.click(saveButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Your language wasn’t saved');
    expect(saveButton()).toBeEnabled();

    fireEvent.click(saveButton());
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Report language saved.')).toBeInTheDocument();
  });

  it('shows a sentence in the language being considered, laid out for it', () => {
    render(<ReportLanguageSetting />);
    fireEvent.change(select(), { target: { value: 'fa' } });
    expect(screen.getByTestId('report-language-preview')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByTestId('report-language-preview')).toHaveAttribute('lang', 'fa');
  });

  it('sits in the profile settings tab', () => {
    const profileSection = readFileSync(
      resolve('src/features/settings/components/Sections/ProfileSection.jsx'),
      'utf8'
    );
    expect(profileSection).toContain('<ReportLanguageSetting />');
  });
});
