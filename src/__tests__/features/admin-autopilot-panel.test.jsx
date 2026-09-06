import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutopilotPanel from '@/components/admin/marketing/AutopilotPanel';
import MarketingService from '@/features/admin/services/MarketingService';

vi.mock('@/features/admin/services/MarketingService', () => ({
  default: {
    runAutopilot: vi.fn(),
    analyzeAutopilot: vi.fn(),
    updateAutopilotPolicy: vi.fn(),
    updateRecommendation: vi.fn(),
    updateIntervention: vi.fn(),
    generateAutopilotCopy: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const policy = (playbook_key, name, allowed_channels = ['in_app']) => ({
  id: playbook_key,
  playbook_key,
  name,
  objective: 'retention',
  enabled: false,
  mode: 'review',
  allowed_channels,
  config: { channel_priority: allowed_channels },
});

const policies = [
  policy('first_practice', 'First practice guide', ['in_app', 'email']),
  policy('next_practice', 'Next practice suggestion'),
  policy('subscriber_feature_help', 'Subscriber feature guide'),
  policy('quota_upgrade', 'AI feedback limit help', ['in_app', 'banner']),
  policy('re_engagement', 'Return to practice', ['push', 'email', 'in_app']),
  policy('cancellation_support', 'Plan ending support', ['in_app', 'email']),
  policy('referral_bonus_reminder', 'Referral bonus reminder'),
  policy('score_plateau', 'Score improvement support', ['in_app', 'email']),
  policy('incomplete_test', 'Saved test reminder', ['push', 'in_app']),
  policy('exam_countdown', 'Exam-day study plan', ['in_app', 'email']),
  policy('checkout_recovery', 'Checkout follow-up', ['in_app', 'email']),
];

describe('Admin AI Autopilot panel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the complete automation set as one-channel strategies', () => {
    render(
      <AutopilotPanel
        autopilot={{ policies, recommendations: [], interventions: [], channels: [], counts: {} }}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Focus on one weak area')).toBeInTheDocument();
    expect(screen.getByText('Support a plan ending')).toBeInTheDocument();
    expect(screen.getAllByText(/Active: Bottom-right suggestion/)).not.toHaveLength(0);
    expect(screen.getAllByText(/Away: Email/)).not.toHaveLength(0);
    expect(screen.getByText(/One helpful message at a time/)).toBeInTheDocument();
  });

  it('renders a privacy-safe preview report and does not reconcile', async () => {
    MarketingService.runAutopilot.mockResolvedValue({
      dry_run: true,
      learners_scanned: 120,
      matched: 8,
      suppressed: 4,
      automation_preview: [
        {
          playbook_key: 'score_plateau',
          name: 'Score improvement support',
          enabled: false,
          matched: 3,
          selected_channels: { in_app: 3 },
        },
      ],
      suppressed_by_reason: { contact_limit: 4 },
    });

    render(
      <AutopilotPanel
        autopilot={{ policies, recommendations: [], interventions: [], channels: [], counts: {} }}
        onRefresh={vi.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

    await waitFor(() => expect(screen.getByText('Preview results')).toBeInTheDocument());
    expect(screen.getByText(/No messages were sent/)).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Bottom-right suggestion · 3')).toBeInTheDocument();
    expect(MarketingService.runAutopilot).toHaveBeenCalledWith({ dryRun: true });
    expect(MarketingService.runAutopilot).toHaveBeenCalledTimes(1);
  });

  it('previews each automation as a learner-facing message without queueing it', async () => {
    render(
      <AutopilotPanel
        autopilot={{ policies, recommendations: [], interventions: [], channels: [], counts: {} }}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[1]);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Message preview' })).toBeInTheDocument()
    );
    expect(screen.getByText(/No learner is selected, queued, or contacted/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /email/i }));
    expect(screen.getByText('Inbox subject')).toBeInTheDocument();
  });
});
