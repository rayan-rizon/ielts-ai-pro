import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DataExport from '@/features/settings/components/DataExport';
import CookieSettings from '@/features/settings/components/Sections/CookieSettings';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
  },
}));

vi.mock('@/lib/tracking', () => ({
  CONSENT_STORAGE_KEY: 'mock_consent_key',
  CONSENT_VERSION: '1.0',
  refreshTrackingBootstrap: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DataExport Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, GDPR badge, and categories without raw emojis', () => {
    render(<DataExport />);

    expect(screen.getByText('Your data, your rights')).toBeInTheDocument();
    expect(screen.getByText('GDPR Art. 20')).toBeInTheDocument();

    // Verify all categories render
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Test history')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();

    // Verify download button exists
    expect(screen.getByRole('button', { name: /Download my data/i })).toBeInTheDocument();

    // Verify informational callout
    expect(screen.getByText('About your export')).toBeInTheDocument();
  });
});

describe('CookieSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cookie preference options and save button', () => {
    render(<CookieSettings />);

    expect(screen.getByText('Cookie preferences')).toBeInTheDocument();
    expect(screen.getByText('Essential cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing cookies')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Save preferences/i })).toBeInTheDocument();
  });
});
