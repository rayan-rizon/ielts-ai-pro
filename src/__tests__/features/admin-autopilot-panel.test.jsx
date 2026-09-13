import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AutopilotPanel from '@/components/admin/marketing/AutopilotPanel';
import MarketingService from '@/features/admin/services/MarketingService';
import { toast } from 'sonner';

vi.mock('@/features/admin/services/MarketingService', () => ({
  default: {
    getCopilotState: vi.fn(),
    prepareCopilotActions: vi.fn(),
    approveIntervention: vi.fn(),
    dismissIntervention: vi.fn(),
    generateInterventionCopy: vi.fn(),
    updateAutopilotPolicy: vi.fn(),
    updateRecommendation: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
const item = {
  id: 'action-1234',
  updated_at: 'revision-1',
  playbook_key: 'checkout_recovery',
  objective: 'paid_conversion',
  recommended_channel: 'in_app',
  expires_at: '2099-01-01',
  rationale: 'Checkout is still incomplete.',
  content: {
    title: 'Need a hand?',
    message: 'Review your plan whenever you are ready.',
    cta_label: 'View plans',
  },
  evidence: [{ metric: 'checkout', value: 'incomplete' }],
  destination: '/pricing',
};
const state = { queue: [item], history: [], total: 1, monitor: null };
function setup() {
  return render(
    <AutopilotPanel
      autopilot={{ policies: [], recommendations: [] }}
      onRefresh={vi.fn()}
      onNavigate={vi.fn()}
    />
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  MarketingService.getCopilotState.mockResolvedValue(state);
});
afterEach(cleanup);

describe('Copilot action workspace', () => {
  it('loads concrete messages without preparing or approving anything', async () => {
    setup();
    expect(await screen.findByText('Need a hand?')).toBeInTheDocument();
    expect(screen.getByText('In-app message')).toBeInTheDocument();
    expect(MarketingService.prepareCopilotActions).not.toHaveBeenCalled();
    expect(MarketingService.approveIntervention).not.toHaveBeenCalled();
  });
  it('prepares actions without implicitly approving them', async () => {
    MarketingService.prepareCopilotActions.mockResolvedValue({ created: 2, drafted: 2 });
    setup();
    await screen.findByText('Need a hand?');
    fireEvent.click(screen.getByRole('button', { name: 'Prepare actions' }));
    await waitFor(() => expect(MarketingService.prepareCopilotActions).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/2 prepared · 2 AI drafts/)).toBeInTheDocument();
    expect(MarketingService.approveIntervention).not.toHaveBeenCalled();
  });
  it('approves only the displayed revision and reports failure honestly', async () => {
    MarketingService.approveIntervention.mockResolvedValue({
      status: 'failed',
      reason: 'Provider unavailable',
    });
    setup();
    await screen.findByText('Need a hand?');
    fireEvent.click(screen.getByRole('button', { name: 'Approve message' }));
    await waitFor(() =>
      expect(MarketingService.approveIntervention).toHaveBeenCalledWith('action-1234', 'revision-1')
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Provider unavailable'));
    expect(toast.success).not.toHaveBeenCalled();
  });
  it('prevents duplicate clicks while approval is in progress', async () => {
    let resolve;
    MarketingService.approveIntervention.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    setup();
    await screen.findByText('Need a hand?');
    const button = screen.getByRole('button', { name: 'Approve message' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(MarketingService.approveIntervention).toHaveBeenCalledTimes(1);
    resolve({ status: 'sent' });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
  it('blocks actions when the worker is unavailable', async () => {
    MarketingService.getCopilotState.mockRejectedValue(new Error('Worker update needed'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Worker update needed');
    expect(screen.getByRole('button', { name: 'Prepare actions' })).toBeDisabled();
  });
  it('keeps the queue visible in review mode while live actions wait for deployment', async () => {
    MarketingService.getCopilotState.mockResolvedValue({
      ...state,
      available: false,
      setupPending: true,
    });
    setup();
    expect(await screen.findByText('Copilot actions need the worker update.')).toBeInTheDocument();
    expect(screen.getByText('Need a hand?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review setup' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Approve message' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('turns investigations into evidence-backed action cards with working controls', async () => {
    const onRefresh = vi.fn();
    const onNavigate = vi.fn();
    const recommendation = {
      id: 'recommendation-1',
      category: 'channel',
      severity: 'attention',
      status: 'new',
      source: 'ai',
      title: 'Email visibility needs review',
      summary: 'Email acceptance is recorded, but confirmed views are limited.',
      proposed_action: 'Check delivery tracking before changing email volume.',
      evidence: [{ metric: 'Confirmed views', value: 4 }],
    };
    MarketingService.getCopilotState.mockResolvedValue({
      queue: [],
      history: [],
      total: 0,
      monitor: null,
      available: false,
      setupPending: true,
    });
    MarketingService.updateRecommendation.mockResolvedValue({ status: 'measuring' });
    render(
      <AutopilotPanel
        autopilot={{ policies: [], recommendations: [recommendation] }}
        onRefresh={onRefresh}
        onNavigate={onNavigate}
      />
    );

    expect(await screen.findByText('Email visibility needs review')).toBeInTheDocument();
    expect(
      screen.getByText('Check delivery tracking before changing email volume.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Why this action/));
    expect(
      screen.getByText('Email acceptance is recorded, but confirmed views are limited.')
    ).toBeInTheDocument();
    expect(screen.getByText('Confirmed views').nextSibling).toHaveTextContent('4');

    fireEvent.click(screen.getByRole('button', { name: 'Compare channels' }));
    expect(onNavigate).toHaveBeenCalledWith('performance');

    fireEvent.click(screen.getByRole('button', { name: 'Track this' }));
    await waitFor(() =>
      expect(MarketingService.updateRecommendation).toHaveBeenCalledWith(
        'recommendation-1',
        'measuring'
      )
    );
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });
  it('shows observed outcomes alongside approvals, without a second tab', async () => {
    MarketingService.getCopilotState.mockResolvedValue({
      ...state,
      history: [
        { ...item, status: 'sent', sent_at: '2026-09-13', outcome: { settled_purchase: true } },
      ],
    });
    setup();
    expect(await screen.findByText('Payment recorded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve message' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
  it('previews the real personalized learner card and every configured channel', async () => {
    render(
      <AutopilotPanel
        autopilot={{
          policies: [
            {
              id: 'policy-1',
              name: 'Resume a saved test',
              playbook_key: 'incomplete_test',
              enabled: true,
              allowed_channels: ['in_app', 'email', 'push'],
            },
          ],
          recommendations: [],
        }}
        onRefresh={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    await screen.findByText('Need a hand?');
    // Automations are a standing panel now, not a drawer — every policy card and
    // its Preview button is on screen without an expand step.
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(
      await screen.findByRole('heading', { name: 'Your 18 answers are still waiting' })
    ).toBeInTheDocument();
    expect(screen.getByText('Why this fits')).toBeInTheDocument();
    expect(screen.getByText('Answered questions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Email' }));
    expect(screen.getByText('Hi Alex,')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Push reminder' }));
    expect(screen.getByText('IELTS AI Pro · now')).toBeInTheDocument();
    expect(screen.getByText(/without starting over/)).toBeInTheDocument();
  });
});
