import React from 'react';
import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  incidents: vi.fn(),
  releaseStuckReservations: vi.fn(),
}));

vi.mock('@/features/admin/services/PlatformHealth', () => ({
  HEALTH_WINDOWS: [
    { label: 'Last 24 hours', hours: 24 },
    { label: 'Last 7 days', hours: 168 },
  ],
  STATUS_LABEL: {
    down: 'Down',
    unconfigured: 'Not configured',
    degraded: 'Degraded',
    attention: 'Needs action',
    operational: 'Operational',
    idle: 'No traffic',
  },
  CATEGORY_LABEL: {
    ai: 'AI & Speech',
    payments: 'Payments',
    platform: 'Platform',
  },
  PlatformHealth: {
    get: mocks.get,
    incidents: mocks.incidents,
    releaseStuckReservations: mocks.releaseStuckReservations,
  },
}));

import PlatformHealthDashboard from '@/components/admin/settings/PlatformHealthDashboard';

const health = {
  generatedAt: '2026-08-02T01:00:00.000Z',
  services: [
    {
      key: 'speech_transcription',
      label: 'Speech-to-Text',
      category: 'ai',
      provider: 'Cloudflare Whisper → Gemini fallback',
      status: 'degraded',
      source: 'ai_api_usage transcription outcomes',
      impact: 'Two clips needed a fallback before the learner could receive a speaking score.',
      metrics: { attempts: 13, errors: 2, errorRate: 15.4, fallbacks: 2, unrecoverable: 0 },
    },
    {
      key: 'ai_quota_reservations',
      label: 'AI Quota Reservations',
      category: 'ai',
      provider: 'Internal quota lifecycle',
      status: 'attention',
      source: 'unsettled ai_api_usage reservations',
      impact: 'One learner has a request held by an unfinished reservation.',
      metrics: { stuck: 1, usersAffected: 1, oldestStuckMinutes: 168 },
    },
    {
      key: 'payments_stripe',
      label: 'Stripe Payments',
      category: 'payments',
      provider: 'Stripe webhooks',
      status: 'operational',
      source: 'stripe_events',
      impact: 'Payment events are being recorded normally.',
      metrics: { webhookEvents: 4, failedEvents: 0, eventFailureRate: 0 },
    },
    {
      key: 'database',
      label: 'Database',
      category: 'platform',
      provider: 'Supabase Postgres',
      status: 'operational',
      source: 'pg_stat_activity',
      impact: 'Connection use is within the safe operating range.',
      metrics: { connections: 12, maxConnections: 100, connectionUtilization: 12 },
    },
  ],
  activity: { signups: 3, activeUsers: 14, testSessions: 8 },
};

// The maintenance status card links through to Admin -> Communications, so the
// dashboard needs a router in scope.
const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe('PlatformHealthDashboard operations console', () => {
  it('keeps recovered provider evidence visible and distinguishes it from an unresolved failure', async () => {
    mocks.incidents.mockResolvedValueOnce([
      {
        service: 'speech_transcription',
        message: 'Recovered provider error',
        outcome: 'recovered',
        occurrences: 3,
        last_seen: '2026-08-02T00:00:00Z',
      },
      {
        service: 'speech_transcription',
        message: 'Unresolved provider error',
        outcome: 'unresolved',
        occurrences: 1,
        last_seen: '2026-08-02T00:00:00Z',
      },
    ]);
    render(<PlatformHealthDashboard />);
    expect(await screen.findByText('Recovered provider error')).toBeInTheDocument();
    expect(screen.getByText('Unresolved provider error')).toBeInTheDocument();
    expect(screen.getAllByText('Recovered — a fallback returned a usable result.')).toHaveLength(1);
  });

  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue(health);
    mocks.incidents.mockReset().mockResolvedValue([
      {
        service: 'speech_transcription',
        message: 'Cloudflare returned no intelligible speech; Gemini recovered the transcript.',
        occurrences: 2,
        first_seen: '2026-08-02T00:15:00.123Z',
        last_seen: '2026-08-02T00:30:00.000Z',
      },
    ]);
  });

  it('puts impact, resolution, ownership and evidence in the action queue', async () => {
    render(<PlatformHealthDashboard />);

    expect(await screen.findByText('Action queue')).toBeInTheDocument();
    expect(screen.getAllByText('Speech-to-Text').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Learner impact').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Repair steps').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI runtime').length).toBeGreaterThan(0);
    expect(screen.getByText('2 incidents')).toBeInTheDocument();
    expect(screen.getByText(/retry Whisper without voice-activity detection/i)).toBeInTheDocument();
  });

  it('keeps recovered provider evidence out of the action queue when the service is operational', async () => {
    mocks.get.mockResolvedValueOnce({
      ...health,
      services: [
        {
          key: 'ai_text_providers',
          label: 'Text AI Providers',
          category: 'ai',
          provider: 'OpenRouter (Luna, DeepSeek) → Direct DeepSeek → Gemini',
          status: 'operational',
          source: 'ai_api_usage provider and recovery outcomes',
          impact:
            '2 request(s) recovered automatically. No learner was blocked and no action is required.',
          metrics: { attempts: 7, errors: 0, recoveredFallbacks: 2 },
        },
      ],
    });
    mocks.incidents.mockResolvedValueOnce([
      {
        service: 'ai_text_providers',
        message: 'Two text AI requests recovered automatically.',
        occurrences: 2,
        first_seen: '2026-08-19T13:10:54.938Z',
        last_seen: '2026-08-19T13:39:27.647Z',
      },
    ]);

    render(<PlatformHealthDashboard />);

    expect(await screen.findByText('Service directory')).toBeInTheDocument();
    expect(screen.queryByText('Action queue')).not.toBeInTheDocument();
    expect(screen.getByText('Incident evidence')).toBeInTheDocument();
    expect(screen.getByText('Two text AI requests recovered automatically.')).toBeInTheDocument();
  });

  it('says an unrecorded provider cost is unrecorded instead of printing $0.000000', async () => {
    // The live card summed seven calls that carried no cost metadata and
    // rendered "$0.000000" as though it were measured. A null cost must read
    // as absent, and a real cost must still render.
    mocks.get.mockResolvedValueOnce({
      ...health,
      services: [
        {
          key: 'ai_text_providers',
          label: 'Text AI Providers',
          category: 'ai',
          provider: 'OpenRouter (Luna, DeepSeek) -> Direct DeepSeek -> Gemini',
          status: 'operational',
          source: 'ai_api_usage provider and recovery outcomes',
          impact: 'Text AI requests completed without a recorded provider failure.',
          metrics: {
            attempts: 7,
            errors: 0,
            errorRate: 0,
            servedCalls: 4,
            geminiCalls: 0,
            openrouterLunaCalls: 4,
            estimatedCostUsd: null,
            costedCalls: 0,
          },
        },
      ],
    });
    mocks.incidents.mockResolvedValueOnce([]);

    render(<PlatformHealthDashboard />);

    expect(await screen.findByText('Service directory')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false, name: /Text AI Providers/ }));
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.queryByText('$0.000000')).not.toBeInTheDocument();
    // `costedCalls` qualifies the cost tile; it is not a tile of its own.
    expect(screen.queryByText('costedCalls')).not.toBeInTheDocument();
  });

  it('renders a recorded provider cost normally', async () => {
    mocks.get.mockResolvedValueOnce({
      ...health,
      services: [
        {
          key: 'ai_text_providers',
          label: 'Text AI Providers',
          category: 'ai',
          provider: 'OpenRouter (Luna, DeepSeek) -> Direct DeepSeek -> Gemini',
          status: 'operational',
          source: 'ai_api_usage provider and recovery outcomes',
          impact: 'Text AI requests completed without a recorded provider failure.',
          metrics: { attempts: 4, errors: 0, estimatedCostUsd: 0.015378, costedCalls: 4 },
        },
      ],
    });
    mocks.incidents.mockResolvedValueOnce([]);

    render(<PlatformHealthDashboard />);

    expect(await screen.findByText('Service directory')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: false, name: /Text AI Providers/ }));
    expect(screen.getByText('$0.015378')).toBeInTheDocument();
    expect(screen.queryByText('Not recorded')).not.toBeInTheDocument();
  });

  it('shows personalized coach budget and lifecycle health in the central directory', async () => {
    mocks.get.mockResolvedValueOnce({
      ...health,
      services: [
        {
          key: 'personalized_ai_coach',
          label: 'Personalized AI Coach',
          category: 'ai',
          provider: 'OpenRouter GPT-OSS 120B -> GPT-5.6 Luna',
          status: 'attention',
          source: 'ai_coach_private operations and budget ledger',
          impact: 'Daily coach spend has crossed the $2.40 warning threshold.',
          metrics: {
            dailySpendUsd: 2.41,
            dailyBudgetUsd: 3,
            budgetUtilization: 80.3,
            pendingReservations: 1,
            stuckReservations: 0,
            completedReplies: 492,
            failedRequests: 2,
            p95LatencyMs: 7400,
            featureEnabled: true,
          },
        },
      ],
    });
    mocks.incidents.mockResolvedValueOnce([]);

    render(<PlatformHealthDashboard />);

    expect((await screen.findAllByText('Personalized AI Coach')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('80.3%').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { expanded: false, name: /Personalized AI Coach/ }));
    expect(screen.getAllByText('Today spend').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$2.4100').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending coach replies').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Enabled').length).toBeGreaterThan(0);
  });

  it('filters and searches the full provider directory without hiding incident context', async () => {
    render(<PlatformHealthDashboard />);

    await screen.findByText('Service directory');
    fireEvent.click(screen.getByRole('button', { name: /Payments 1/i }));

    expect(screen.getByText('Stripe Payments')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Speech-to-Text/i })).not.toBeInTheDocument();
    expect(screen.getByText('No recorded incidents match this service view.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search services' }), {
      target: { value: 'does not exist' },
    });
    expect(screen.getByText('No services match')).toBeInTheDocument();
  });

  it('loads health and incident telemetry together and reports loading completion', async () => {
    const onLoadingChange = vi.fn();
    render(<PlatformHealthDashboard onLoadingChange={onLoadingChange} />);

    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith(24));
    expect(mocks.incidents).toHaveBeenCalledWith(24);
    await waitFor(() => expect(onLoadingChange).toHaveBeenLastCalledWith(false));
  });

  it('shows exact generated, first-observed and latest-observed timestamps', async () => {
    render(<PlatformHealthDashboard />);

    expect(await screen.findByText(/Updated/i)).toBeInTheDocument();
    expect(screen.getAllByText(/First observed/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Latest observed/i).length).toBeGreaterThan(0);
    expect(document.querySelector('time[datetime="2026-08-02T01:00:00.000Z"]')).toBeTruthy();
    expect(document.querySelector('time[datetime="2026-08-02T00:15:00.123Z"]')).toBeTruthy();
    expect(document.querySelector('time[datetime="2026-08-02T00:30:00.000Z"]')).toBeTruthy();
  });
});
