import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CheckerWorkspace from '@/features/core/pages/checker/CheckerWorkspace';

const mocks = vi.hoisted(() => ({
  runAnalysis: vi.fn(),
  clearCheckerDraft: vi.fn(),
  loadCheckerDraft: vi.fn(),
  loadPendingTaskImage: vi.fn(),
  saveCheckerDraft: vi.fn(),
  savePendingTaskImage: vi.fn(),
}));

vi.mock('@/features/core/pages/checker/analyseHelper', () => ({
  runAnalysis: mocks.runAnalysis,
}));

vi.mock('@/features/core/pages/checker/checkerDraftStorage', () => ({
  clearCheckerDraft: mocks.clearCheckerDraft,
  loadCheckerDraft: mocks.loadCheckerDraft,
  loadPendingTaskImage: mocks.loadPendingTaskImage,
  saveCheckerDraft: mocks.saveCheckerDraft,
  savePendingTaskImage: mocks.savePendingTaskImage,
}));

vi.mock('@/lib/tracking', () => ({ trackAppEvent: vi.fn() }));

vi.mock('@/features/core/pages/checker/WritingForm', () => ({
  default: (props) => (
    <form onSubmit={props.onSubmit}>
      <button type="button" onClick={props.onLoadDemo}>
        Load demo
      </button>
      {props.showTaskImageField && (
        <input aria-label="Task 1 image" type="file" onChange={props.onImageChange} />
      )}
      {props.showPromptField && (
        <input
          aria-label="Task prompt"
          value={props.currentDraft.prompt}
          onChange={(event) => props.onUpdateDraft('prompt', event.target.value)}
        />
      )}
      <button type="submit">Analyse</button>
      {props.error && <p role="alert">{props.error}</p>}
    </form>
  ),
}));

vi.mock('@/features/core/pages/checker/DemoResultPanel', () => ({
  default: ({ showSignupGate, onSignUp }) =>
    showSignupGate ? <button onClick={onSignUp}>Create account</button> : null,
}));

function renderWorkspace(props = { user: null, authLoading: false }) {
  return render(
    <MemoryRouter initialEntries={['/ielts-writing-checker']}>
      <Routes>
        <Route path="*" element={<CheckerWorkspace {...props} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('public writing checker signup handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    mocks.loadCheckerDraft.mockReturnValue(null);
    mocks.loadPendingTaskImage.mockResolvedValue(null);
    mocks.savePendingTaskImage.mockResolvedValue(undefined);
  });

  it('requires the Task 1 visual before opening the signup gate and preserves it', async () => {
    renderWorkspace();
    expect(screen.getByLabelText('Task 1 image')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load demo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyse' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Add the original Task 1');
    expect(screen.queryByRole('button', { name: 'Create account' })).not.toBeInTheDocument();

    const image = new File(['chart'], 'chart.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Task 1 image'), { target: { files: [image] } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(mocks.savePendingTaskImage).toHaveBeenCalledWith(image));
    expect(mocks.saveCheckerDraft).toHaveBeenCalledWith(
      expect.objectContaining({ activeTask: 'Task 1', pendingAnalysis: true }),
      { pendingAuth: true }
    );
  });

  it('restores the Task 1 file before auto-submitting after signup', async () => {
    const image = new File(['chart'], 'restored-chart.png', { type: 'image/png' });
    mocks.loadCheckerDraft.mockReturnValue({
      activeTask: 'Task 1',
      drafts: {
        'Task 1': { prompt: 'Summarise the chart.', essay: 'A sufficiently long response.' },
        'Task 2': { prompt: '', essay: '' },
      },
      pendingAnalysis: true,
      savedAt: Date.now(),
    });
    mocks.loadPendingTaskImage.mockResolvedValue(image);

    renderWorkspace({ user: { id: 'user-1' }, authLoading: false });

    await waitFor(() => expect(mocks.runAnalysis).toHaveBeenCalledTimes(1));
    expect(mocks.runAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        taskImageFile: image,
        user: { id: 'user-1' },
        submission: expect.objectContaining({ pendingAnalysis: true }),
      })
    );
  });
});
