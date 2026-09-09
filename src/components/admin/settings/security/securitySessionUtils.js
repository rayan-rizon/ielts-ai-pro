const SESSION_METHOD_LABELS = {
  password: 'Password',
  totp: 'Authenticator',
  phone: 'Phone',
  passkey: 'Passkey',
  recovery: 'Recovery code',
};

const SESSION_METHOD_ORDER = ['password', 'totp', 'phone', 'passkey', 'recovery'];

const BROWSER_PATTERNS = [
  { test: /Edg\//, name: 'Edge' },
  { test: /Chrome\//, name: 'Chrome' },
  { test: /Safari\//, name: 'Safari' },
  { test: /Firefox\//, name: 'Firefox' },
];

const PLATFORM_PATTERNS = [
  { test: /Macintosh|Mac OS X/, name: 'macOS' },
  { test: /Windows/, name: 'Windows' },
  { test: /Android/, name: 'Android' },
  { test: /iPhone|iPad/, name: 'iOS' },
];

export const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
};

const extractMethodNames = (entry) => {
  const value = typeof entry === 'string' ? entry : entry?.method;
  return value ? String(value).split('+') : [];
};

const normalizeMethod = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const getMethodRank = (method) => {
  const index = SESSION_METHOD_ORDER.indexOf(method);
  return index === -1 ? SESSION_METHOD_ORDER.length : index;
};

const formatMethodLabel = (method) =>
  SESSION_METHOD_LABELS[method] || `${method.charAt(0).toUpperCase()}${method.slice(1)}`;

export const authMethodsLabel = (methods = []) => {
  const values = (methods || []).flatMap(extractMethodNames).map(normalizeMethod).filter(Boolean);

  const uniqueValues = [...new Set(values)].sort(
    (left, right) => getMethodRank(left) - getMethodRank(right)
  );

  const labels = uniqueValues.map(formatMethodLabel);
  return labels.length ? labels.join(' + ') : 'Session observed';
};

const detectBrowser = (ua) => BROWSER_PATTERNS.find(({ test }) => test.test(ua))?.name || 'Browser';

const detectPlatform = (ua) => PLATFORM_PATTERNS.find(({ test }) => test.test(ua))?.name || null;

export const browserSessionLabel = (userAgent) => {
  if (!userAgent) return 'Unknown browser';
  const browser = detectBrowser(userAgent);
  const platform = detectPlatform(userAgent);
  return platform ? `${browser} on ${platform}` : browser;
};
