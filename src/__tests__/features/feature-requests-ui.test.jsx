import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  learnerPage: vi.fn(),
  adminPage: vi.fn(),
  submit: vi.fn(),
  toggleVote: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('@/features/feature-requests/featureRequestService', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    featureRequestService: mocks,
  };
});

import FeatureRequestManagement from '@/components/admin/FeatureRequestManagement';
import FeatureRequests from '@/features/feature-requests/pages/FeatureRequests';

const approvedRequest = {
  id: 'request-one',
  title: 'Add a focused pronunciation review',
  description: 'Let learners revisit pronunciation issues after completing a speaking practice.',
  category: 'speaking',
  status: 'approved',
  created_at: '2026-09-17T00:00:00Z',
  updated_at: '2026-09-17T00:00:00Z',
  vote_count: 7,
  has_voted: false,
  is_mine: false,
  admin_note: null,
};

describe('feature request learner page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.learnerPage.mockResolvedValue({
      items: [approvedRequest],
      total: 1,
      remaining: 1,
      limit: 1,
      period: 'lifetime',
    });
    mocks.toggleVote.mockResolvedValue(true);
    mocks.submit.mockResolvedValue('new-request-id');
  });

  it('renders approved ideas, quota copy, and sends a vote through the service', async () => {
    render(
      <MemoryRouter>
        <FeatureRequests />
      </MemoryRouter>
    );

    expect(await screen.findByText(approvedRequest.title)).toBeInTheDocument();
    expect(screen.getByLabelText('1 of 1 requests remaining for this account')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `Upvote ${approvedRequest.title}` }));
    await waitFor(() => expect(mocks.toggleVote).toHaveBeenCalledWith('request-one'));
  });

  it('submits the selected feature area with the request', async () => {
    render(
      <MemoryRouter>
        <FeatureRequests />
      </MemoryRouter>
    );

    await screen.findByText(approvedRequest.title);
    fireEvent.click(screen.getByRole('radio', { name: 'Speaking' }));
    fireEvent.change(screen.getByPlaceholderText('What should we add?'), {
      target: { value: 'Speaking replay controls' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Describe the problem and the outcome you want.'),
      {
        target: { value: 'Let learners replay one answer while reviewing speaking feedback.' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

    await waitFor(() =>
      expect(mocks.submit).toHaveBeenCalledWith(
        'Speaking replay controls',
        'Let learners replay one answer while reviewing speaking feedback.',
        'speaking'
      )
    );
  });

  it('prevents the requester from voting on their own idea', async () => {
    mocks.learnerPage.mockResolvedValue({
      items: [{ ...approvedRequest, is_mine: true }],
      total: 1,
      remaining: 0,
      limit: 1,
      period: 'lifetime',
    });

    render(
      <MemoryRouter>
        <FeatureRequests />
      </MemoryRouter>
    );

    const vote = await screen.findByRole('button', { name: `Upvote ${approvedRequest.title}` });
    expect(vote).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send request' })).toBeDisabled();
  });
});

describe('feature request admin queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.adminPage.mockResolvedValue({
      items: [
        {
          ...approvedRequest,
          status: 'pending',
          requester_name: 'Learner One',
          requester_email: 'learner@example.invalid',
          requester_tier: 'free',
          admin_note: null,
        },
      ],
      total: 1,
    });
    mocks.updateStatus.mockResolvedValue(null);
  });

  it('approves a pending request with the reviewer note', async () => {
    render(<FeatureRequestManagement />);

    expect(await screen.findByText(approvedRequest.title)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Learner update'), {
      target: { value: 'Useful for speaking practice.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(mocks.updateStatus).toHaveBeenCalledWith(
        'request-one',
        'approved',
        'Useful for speaking practice.'
      )
    );
  });
});
