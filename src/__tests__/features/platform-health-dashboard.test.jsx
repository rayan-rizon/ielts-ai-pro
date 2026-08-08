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
