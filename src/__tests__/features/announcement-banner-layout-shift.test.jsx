import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementBanner from '@/components/shared/AnnouncementBanner';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import { announcementSignature, normalizeAnnouncement } from '@/lib/communications';
import { SystemSetting } from '@/features/admin/services/SystemSetting';

// Mock dependencies that AuthProvider imports
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('@/features/auth/services/User', () => ({
  User: {
    me: vi.fn().mockResolvedValue(null),
    updateLastActive: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/features/admin/services/SystemSetting', () => ({
  SystemSetting: {
    getAll: vi.fn().mockResolvedValue({}),
  },
}));

const sampleAnnouncement = {
  enabled: true,
  type: 'info',
  title: 'All-new IELTS AI Pro',
  message: 'Faster, cleaner, and more intuitive.',
  promo_code: 'FIRST30',
  dismissible: true,
};

describe('AnnouncementBanner layout shift prevention', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders immediately on initial render without being hidden or having height 0', () => {
    render(<AnnouncementBanner announcement={sampleAnnouncement} />);

    const titleEl = screen.getByText('All-new IELTS AI Pro');
    expect(titleEl).toBeInTheDocument();
    expect(screen.getByText('Faster, cleaner, and more intuitive.')).toBeInTheDocument();
    expect(screen.getByText('FIRST30')).toBeInTheDocument();

    const bannerContainer = screen.getByRole('status');
    expect(bannerContainer).toBeInTheDocument();
  });

  it('stays completely hidden on initial render if already dismissed in localStorage (no flash)', () => {
    const config = normalizeAnnouncement(sampleAnnouncement);
    const sig = announcementSignature(config);
    window.localStorage.setItem('dismissed_announcements', JSON.stringify([sig]));

    render(<AnnouncementBanner announcement={sampleAnnouncement} />);

    expect(screen.queryByText('All-new IELTS AI Pro')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('dismisses banner and persists signature to localStorage upon clicking dismiss', async () => {
    render(<AnnouncementBanner announcement={sampleAnnouncement} />);

    expect(screen.getByText('All-new IELTS AI Pro')).toBeInTheDocument();
    const dismissBtn = screen.getByRole('button', { name: 'Dismiss announcement' });

    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    await waitFor(() => {
      expect(screen.queryByText('All-new IELTS AI Pro')).not.toBeInTheDocument();
    });

    const stored = JSON.parse(window.localStorage.getItem('dismissed_announcements') || '[]');
    const config = normalizeAnnouncement(sampleAnnouncement);
    const sig = announcementSignature(config);
    expect(stored).toContain(sig);
  });
});

describe('AuthContext synchronous settings caching', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.clearAllMocks();
    SystemSetting.getAll.mockResolvedValue({});
  });

  it('restores cached globalSettings synchronously on the very first frame to prevent layout shift', () => {
    const cachedSettings = {
      public_announcement: sampleAnnouncement,
      maintenance_mode: { enabled: false },
    };
    window.localStorage.setItem('cached_global_settings', JSON.stringify(cachedSettings));

    let initialSettings = null;
    let initialAnnouncement = null;

    function TestConsumer() {
      const { globalSettings, announcement } = useAuth();
      if (initialSettings === null) {
        initialSettings = globalSettings;
        initialAnnouncement = announcement;
      }
      return <div>Settings ready</div>;
    }

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Assert that on the initial frame (synchronously before any async resolves),
    // globalSettings and announcement are already populated from localStorage cache
    expect(initialSettings).toEqual(cachedSettings);
    expect(initialAnnouncement.enabled).toBe(true);
    expect(initialAnnouncement.title).toBe('All-new IELTS AI Pro');
  });

  it('coalesces focus events and adopts cross-tab settings without a request fan-out', async () => {
    let complete;
    SystemSetting.getAll.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    let current;
    function Consumer() {
      current = useAuth();
      return <div>{current.settingsLoading ? 'loading' : 'ready'}</div>;
    }
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(SystemSetting.getAll).toHaveBeenCalledTimes(1));
    act(() => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'cached_global_settings',
          newValue: JSON.stringify({ maintenance_mode: true }),
        })
      );
    });
    expect(current.settingsLoading).toBe(true);
    expect(SystemSetting.getAll).toHaveBeenCalledTimes(1);
    await act(async () => complete({ maintenance_mode: false }));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(SystemSetting.getAll).toHaveBeenCalledTimes(1);
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'cached_global_settings',
          newValue: JSON.stringify({ maintenance_mode: true }),
        })
      )
    );
    expect(current.maintenance.enabled).toBe(true);
    expect(SystemSetting.getAll).toHaveBeenCalledTimes(1);
  });

  it('forces a fresh post-save read after an older request is already running', async () => {
    let complete;
    SystemSetting.getAll
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          })
      )
      .mockResolvedValueOnce({ maintenance_mode: true });
    let current;
    function Consumer() {
      current = useAuth();
      return null;
    }
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(SystemSetting.getAll).toHaveBeenCalledTimes(1));
    let refresh;
    act(() => {
      refresh = current.refreshGlobalSettings();
    });
    await act(async () => {
      complete({ maintenance_mode: false });
      await refresh;
    });
    expect(SystemSetting.getAll).toHaveBeenCalledTimes(2);
    expect(current.maintenance.enabled).toBe(true);
  });
});
