import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SecuritySettingsTab from '@/components/admin/settings/SecuritySettingsTab';
import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';

vi.mock('@/features/admin/services/AdminSecurityService', () => ({
  AdminSecurityService: {
    getSnapshot: vi.fn(),
    enrollTotp: vi.fn(),
    verifyTotp: vi.fn(),
    record: vi.fn(),
    removeFactor: vi.fn(),
    enableMfaEnforcement: vi.fn(),
    rotateRecoveryCodes: vi.fn(),
    preparePasskeyRegistration: vi.fn(),
    registerPreparedPasskey: vi.fn(),
    removePasskey: vi.fn(),
    verifySensitiveAction: vi.fn(),
    signOutSession: vi.fn(),
    signOutEverywhere: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSnapshot = {
  status: {
    aal: 'aal2',
    mfa_required: true,
    session_id: 'session-12345678',
    recovery_session_expires_at: null,
  },
  factors: [
    {
      id: 'factor-1',
      friendly_name: 'Work Authenticator',
      status: 'verified',
      created_at: '2026-01-01T10:00:00Z',
    },
  ],
  passkeys: [
    {
      id: 'passkey-1',
      friendly_name: 'MacBook Touch ID',
      created_at: '2026-01-02T10:00:00Z',
      last_used_at: '2026-01-03T10:00:00Z',
    },
  ],
  passkeysAvailable: true,
  sessions: [
    {
      session_id: 'session-12345678',
      user_agent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      last_seen_at: '2026-01-05T12:00:00Z',
      authentication_methods: ['password', 'totp'],
    },
    {
      session_id: 'session-87654321',
      user_agent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      last_seen_at: '2026-01-04T12:00:00Z',
      authentication_methods: ['password'],
    },
  ],
};

const defaultPasswordData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

describe('SecuritySettingsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading skeleton initially', () => {
    AdminSecurityService.getSnapshot.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <SecuritySettingsTab
        passwordData={defaultPasswordData}
        onChangePasswordData={vi.fn()}
        changingPassword={false}
        onPasswordChange={vi.fn()}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error panel when snapshot fetch fails', async () => {
    AdminSecurityService.getSnapshot.mockRejectedValue(new Error('Network error'));

    render(
      <SecuritySettingsTab
        passwordData={defaultPasswordData}
        onChangePasswordData={vi.fn()}
        changingPassword={false}
        onPasswordChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Security controls could not be loaded')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders security settings overview and sections when snapshot loads', async () => {
    AdminSecurityService.getSnapshot.mockResolvedValue(mockSnapshot);

    render(
      <SecuritySettingsTab
        passwordData={defaultPasswordData}
        onChangePasswordData={vi.fn()}
        changingPassword={false}
        onPasswordChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Protected administrator access')).toBeInTheDocument();
    });

    // Overview metrics
    expect(screen.getByText('AAL2')).toBeInTheDocument();
    expect(screen.getByText('Verified authenticators')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Passkeys section
    expect(screen.getByText('Phishing-resistant sign-in')).toBeInTheDocument();
    expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();

    // Authenticator section
    expect(screen.getByText('Second factor')).toBeInTheDocument();
    expect(screen.getByText('Work Authenticator')).toBeInTheDocument();

    // Backup recovery section
    expect(screen.getByText('Backup recovery codes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate recovery codes/i })).toBeInTheDocument();

    // Password change section
    expect(screen.getByText('Change password')).toBeInTheDocument();

    // Active sessions section
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('Firefox on Windows')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
});
