/**
 * Shared vocabulary for everything the platform says to its users globally:
 * broadcast notifications, the site-wide banner, and maintenance mode.
 *
 * The admin panel writes these shapes, `AuthContext` reads them, and the
 * learner-facing surfaces render them — so the normalisers live here rather
 * than being re-derived (differently) in each place.
 *
 * Both `maintenance_mode` and `public_announcement` used to be stored in
 * looser shapes (`maintenance_mode` as a bare boolean, `public_announcement`
 * with only `enabled`/`message`/`type`). Every normaliser below accepts the old
 * shape, so a database that has not been migrated yet still behaves correctly.
 */

export const MAINTENANCE_KEY = 'maintenance_mode';
export const ANNOUNCEMENT_KEY = 'public_announcement';

export const DEFAULT_MAINTENANCE = Object.freeze({
  enabled: false,
  title: "We'll be right back",
  message:
    'IELTS AI Pro is undergoing scheduled maintenance. Your progress is safe and everything will be exactly where you left it.',
  starts_at: null,
  ends_at: null,
  auto_resume: false,
  allow_admins: true,
  allowed_emails: [],
  contact_email: '',
  status_url: '',
});

export const DEFAULT_ANNOUNCEMENT = Object.freeze({
  enabled: false,
  title: '',
  message: '',
  type: 'info',
  link_url: '',
  link_label: '',
  promo_code: '',
  dismissible: true,
  starts_at: null,
  ends_at: null,
  audience: 'all',
});

/** Severity vocabulary shared by the banner and by broadcast notifications. */
export const SEVERITIES = ['info', 'success', 'warning', 'critical'];

/**
 * The banner historically stored `error` for its most severe level while
 * notifications stored `warning`/`announcement`. One vocabulary now, with the
 * old values folded in so existing rows keep rendering.
 */
export const normalizeSeverity = (value) => {
  if (value === 'error' || value === 'danger') return 'critical';
  if (value === 'announcement') return 'info';
  return SEVERITIES.includes(value) ? value : 'info';
};

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'announcement'];
export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high'];

/** Who a banner or broadcast is aimed at. */
export const AUDIENCES = ['all', 'guests', 'authenticated', 'free', 'pro', 'premium'];
export const NOTIFICATION_AUDIENCES = ['all', 'free', 'pro', 'premium'];

export const AUDIENCE_LABEL = {
  all: 'Everyone',
  guests: 'Signed-out visitors',
  authenticated: 'Signed-in users',
  free: 'Free tier',
  pro: 'Pro users',
  premium: 'Premium users',
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toStringList = (value) => {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Accepts `true`, `false`, `{ enabled: true, ... }`, `null`, or anything else
 * that has ever been written to `system_settings.maintenance_mode`, and always
 * returns the full object shape.
 */
export const normalizeMaintenance = (raw) => {
  if (typeof raw === 'boolean') return { ...DEFAULT_MAINTENANCE, enabled: raw };
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_MAINTENANCE };

  return {
    ...DEFAULT_MAINTENANCE,
    ...raw,
    enabled: Boolean(raw.enabled),
    title: raw.title || DEFAULT_MAINTENANCE.title,
    message: raw.message || DEFAULT_MAINTENANCE.message,
    starts_at: toIsoOrNull(raw.starts_at),
    ends_at: toIsoOrNull(raw.ends_at),
    auto_resume: Boolean(raw.auto_resume),
    allow_admins: raw.allow_admins !== false,
    allowed_emails: toStringList(raw.allowed_emails).map((email) => email.toLowerCase()),
    contact_email: raw.contact_email || '',
    status_url: raw.status_url || '',
  };
};

export const normalizeAnnouncement = (raw) => {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ANNOUNCEMENT };

  return {
    ...DEFAULT_ANNOUNCEMENT,
    ...raw,
    enabled: Boolean(raw.enabled),
    title: raw.title || '',
    message: raw.message || '',
    type: normalizeSeverity(raw.type),
    link_url: raw.link_url || '',
    link_label: raw.link_label || '',
    promo_code: typeof raw.promo_code === 'string' ? raw.promo_code.trim() : '',
    dismissible: raw.dismissible !== false,
    starts_at: toIsoOrNull(raw.starts_at),
    ends_at: toIsoOrNull(raw.ends_at),
    audience: AUDIENCES.includes(raw.audience) ? raw.audience : 'all',
  };
};

/**
 * Whether a scheduling window is open right now. A null bound is open-ended.
 */
export const isWithinWindow = ({ starts_at, ends_at }, now = new Date()) => {
  const at = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (starts_at && at < new Date(starts_at).getTime()) return false;
  if (ends_at && at >= new Date(ends_at).getTime()) return false;
  return true;
};

/**
 * Maintenance is live when it is switched on and its start time has passed.
 * The end time only lifts it automatically when the admin opted into
 * `auto_resume` — an ETA is usually a best guess, and a site that un-breaks
 * itself on a guess is worse than one that waits for a human.
 */
export const isMaintenanceActive = (raw, now = new Date()) => {
  const config = normalizeMaintenance(raw);
  if (!config.enabled) return false;
  const at = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (config.starts_at && at < new Date(config.starts_at).getTime()) return false;
  if (config.auto_resume && config.ends_at && at >= new Date(config.ends_at).getTime())
    return false;
  return true;
};

/** Maintenance is switched on but its window has not opened yet. */
export const isMaintenanceScheduled = (raw, now = new Date()) => {
  const config = normalizeMaintenance(raw);
  if (!config.enabled || !config.starts_at) return false;
  const at = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return at < new Date(config.starts_at).getTime();
};

/**
 * Who still gets through while maintenance is on. Admins are exempt by default
 * so the panel stays reachable; individual emails can be allowlisted for
 * contractors or a support rota without granting admin rights.
 */
export const canBypassMaintenance = (raw, { isAdmin = false, email = '' } = {}) => {
  const config = normalizeMaintenance(raw);
  if (isAdmin && config.allow_admins) return true;
  if (!email) return false;
  return config.allowed_emails.includes(String(email).toLowerCase());
};

export const matchesAudience = (audience, { isAuthenticated = false, tier = null } = {}) => {
  switch (audience) {
    case 'all':
      return true;
    case 'guests':
      return !isAuthenticated;
    case 'authenticated':
      return isAuthenticated;
    case 'free':
    case 'pro':
    case 'premium':
      return isAuthenticated && (tier || 'free') === audience;
    default:
      return true;
  }
};

/** Whether the site-wide banner should render for this viewer, right now. */
export const isAnnouncementLive = (raw, viewer = {}, now = new Date()) => {
  const config = normalizeAnnouncement(raw);
  if (!config.enabled) return false;
  if (!config.message.trim() && !config.title.trim()) return false;
  if (!isWithinWindow(config, now)) return false;
  return matchesAudience(config.audience, viewer);
};

/**
 * Stable identity for a banner's *content*, so a dismissal sticks to the
 * message the user actually dismissed. Edit the copy and the banner returns.
 */
export const announcementSignature = (raw) => {
  const config = normalizeAnnouncement(raw);
  const source = [
    config.title,
    config.message,
    config.type,
    config.link_url,
    config.promo_code,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return `ann_${Math.abs(hash).toString(36)}`;
};

/** Lifecycle state for one broadcast row, used by admin history and learner feed. */
export const notificationState = (notification, now = new Date()) => {
  const at = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (notification?.is_active === false) return 'paused';
  if (notification?.starts_at && at < new Date(notification.starts_at).getTime())
    return 'scheduled';
  if (notification?.expires_at && at >= new Date(notification.expires_at).getTime())
    return 'expired';
  return 'live';
};

export const isNotificationVisible = (notification, viewer = {}, now = new Date()) =>
  notificationState(notification, now) === 'live' &&
  matchesAudience(notification?.target_audience || 'all', { isAuthenticated: true, ...viewer });

/**
 * "in 2 hours" / "3 days ago" without pulling in a date library.
 */
export const relativeTime = (value, now = new Date()) => {
  if (!value) return '';
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return '';
  const base = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const diff = target - base;
  const abs = Math.abs(diff);

  const units = [
    { limit: 60_000, divisor: 1000, unit: 'second' },
    { limit: 3_600_000, divisor: 60_000, unit: 'minute' },
    { limit: 86_400_000, divisor: 3_600_000, unit: 'hour' },
    { limit: 2_592_000_000, divisor: 86_400_000, unit: 'day' },
    { limit: 31_536_000_000, divisor: 2_592_000_000, unit: 'month' },
    { limit: Infinity, divisor: 31_536_000_000, unit: 'year' },
  ];

  const match = units.find((entry) => abs < entry.limit) || units[units.length - 1];
  const amount = Math.round(diff / match.divisor);

  try {
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(amount, match.unit);
  } catch {
    return `${Math.abs(amount)} ${match.unit}${Math.abs(amount) === 1 ? '' : 's'} ${diff < 0 ? 'ago' : 'from now'}`;
  }
};

/** `2026-08-02T14:30:00Z` -> `2026-08-02T14:30` for <input type="datetime-local">. */
export const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const fromLocalInputValue = (value) => (value ? new Date(value).toISOString() : null);
