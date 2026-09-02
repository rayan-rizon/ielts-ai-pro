import { describe, expect, it } from 'vitest';
import {
  announcementSignature,
  canBypassMaintenance,
  isAnnouncementLive,
  isMaintenanceActive,
  isMaintenanceScheduled,
  isNotificationVisible,
  matchesAudience,
  normalizeAnnouncement,
  normalizeMaintenance,
  notificationState,
} from '@/lib/communications';

const NOW = new Date('2026-08-02T12:00:00.000Z');
const iso = (offsetMs) => new Date(NOW.getTime() + offsetMs).toISOString();
const HOUR = 3_600_000;

describe('maintenance configuration', () => {
  it('reads the legacy bare-boolean value without losing the enabled state', () => {
    expect(normalizeMaintenance(true).enabled).toBe(true);
    expect(normalizeMaintenance(false).enabled).toBe(false);
    // The old value carried no copy, so the defaults have to fill in.
    expect(normalizeMaintenance(true).title).toBeTruthy();
    expect(normalizeMaintenance(true).message).toBeTruthy();
  });

  it('treats null, undefined and junk as "site online" rather than throwing', () => {
    expect(isMaintenanceActive(null)).toBe(false);
    expect(isMaintenanceActive(undefined)).toBe(false);
    expect(isMaintenanceActive('yes')).toBe(false);
  });

  it('never reports an object shape as active just because it is truthy', () => {
    // The regression the object shape could have introduced: `{enabled:false}`
    // is a truthy object, so a bare truthiness check would black out the site.
    expect(isMaintenanceActive({ enabled: false })).toBe(false);
  });

  it('holds a scheduled window closed until its start time', () => {
    const config = { enabled: true, starts_at: iso(2 * HOUR) };
    expect(isMaintenanceActive(config, NOW)).toBe(false);
    expect(isMaintenanceScheduled(config, NOW)).toBe(true);
    expect(isMaintenanceActive(config, new Date(NOW.getTime() + 3 * HOUR))).toBe(true);
  });

  it('only lifts maintenance at the end time when auto-resume is on', () => {
    const past = { enabled: true, ends_at: iso(-HOUR) };
    expect(isMaintenanceActive(past, NOW)).toBe(true);
    expect(isMaintenanceActive({ ...past, auto_resume: true }, NOW)).toBe(false);
  });

  it('lets admins and allowlisted emails through, and nobody else', () => {
    const config = normalizeMaintenance({
      enabled: true,
      allowed_emails: 'Ops@Example.com, qa@example.com',
    });

    expect(canBypassMaintenance(config, { isAdmin: true })).toBe(true);
    expect(canBypassMaintenance(config, { email: 'ops@example.com' })).toBe(true);
    expect(canBypassMaintenance(config, { email: 'OPS@EXAMPLE.COM' })).toBe(true);
    expect(canBypassMaintenance(config, { email: 'learner@example.com' })).toBe(false);
    expect(canBypassMaintenance(config, {})).toBe(false);
  });

  it('can lock admins out too when allow_admins is turned off', () => {
    const config = { enabled: true, allow_admins: false };
    expect(canBypassMaintenance(config, { isAdmin: true })).toBe(false);
  });
});

describe('announcement banner', () => {
  it('maps the legacy "error" severity onto the shared vocabulary', () => {
    expect(normalizeAnnouncement({ type: 'error' }).type).toBe('critical');
    expect(normalizeAnnouncement({ type: 'nonsense' }).type).toBe('info');
  });

  it('stays hidden when enabled but empty', () => {
    expect(isAnnouncementLive({ enabled: true, message: '   ' })).toBe(false);
  });

  it('respects its schedule window', () => {
    const config = { enabled: true, message: 'Hi', starts_at: iso(HOUR), ends_at: iso(2 * HOUR) };
    expect(isAnnouncementLive(config, {}, NOW)).toBe(false);
    expect(isAnnouncementLive(config, {}, new Date(NOW.getTime() + 90 * 60_000))).toBe(true);
    expect(isAnnouncementLive(config, {}, new Date(NOW.getTime() + 3 * HOUR))).toBe(false);
  });

  it('targets audiences', () => {
    const guests = { enabled: true, message: 'Sign up', audience: 'guests' };
    expect(isAnnouncementLive(guests, { isAuthenticated: false }, NOW)).toBe(true);
    expect(isAnnouncementLive(guests, { isAuthenticated: true, tier: 'free' }, NOW)).toBe(false);

    expect(matchesAudience('pro', { isAuthenticated: true, tier: 'pro' })).toBe(true);
    expect(matchesAudience('pro', { isAuthenticated: true, tier: 'free' })).toBe(false);
    expect(matchesAudience('authenticated', { isAuthenticated: true })).toBe(true);
  });

  it('changes its dismissal signature when the copy changes', () => {
    const a = { enabled: true, message: 'Scheduled downtime tonight' };
    const b = { enabled: true, message: 'Downtime moved to tomorrow' };
    expect(announcementSignature(a)).toBe(announcementSignature({ ...a }));
    expect(announcementSignature(a)).not.toBe(announcementSignature(b));
  });
});

describe('broadcast delivery', () => {
  const base = {
    is_active: true,
    target_audience: 'all',
    starts_at: iso(-HOUR),
    expires_at: iso(HOUR),
  };

  it('classifies lifecycle state', () => {
    expect(notificationState(base, NOW)).toBe('live');
    expect(notificationState({ ...base, is_active: false }, NOW)).toBe('paused');
    expect(notificationState({ ...base, starts_at: iso(HOUR) }, NOW)).toBe('scheduled');
    expect(notificationState({ ...base, expires_at: iso(-1) }, NOW)).toBe('expired');
  });

  it('treats an open-ended broadcast as live', () => {
    expect(notificationState({ is_active: true }, NOW)).toBe('live');
  });

  it('only shows a tier-targeted broadcast to that tier', () => {
    const proOnly = { ...base, target_audience: 'pro' };
    expect(isNotificationVisible(proOnly, { tier: 'pro' }, NOW)).toBe(true);
    expect(isNotificationVisible(proOnly, { tier: 'free' }, NOW)).toBe(false);
    expect(isNotificationVisible(base, { tier: 'free' }, NOW)).toBe(true);
  });

  it('hides paused, scheduled and expired broadcasts from learners', () => {
    expect(isNotificationVisible({ ...base, is_active: false }, { tier: 'free' }, NOW)).toBe(false);
    expect(isNotificationVisible({ ...base, starts_at: iso(HOUR) }, { tier: 'free' }, NOW)).toBe(
      false
    );
    expect(isNotificationVisible({ ...base, expires_at: iso(-1) }, { tier: 'free' }, NOW)).toBe(
      false
    );
  });
});
