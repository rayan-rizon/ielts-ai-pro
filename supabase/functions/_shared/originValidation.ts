declare const Deno: any;

export const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173';

const ALLOWED_ORIGINS = [
  DEFAULT_ALLOWED_ORIGIN,
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://ieltsai.pro',
  'https://www.ieltsai.pro',
];

/**
 * Hosted functions must never reflect a loopback origin. Local development can
 * opt in explicitly via ALLOW_LOOPBACK_ORIGINS=true in its local function
 * environment; this avoids making a deployment-stage assumption from a missing
 * environment variable.
 */
const allowsLoopbackOrigins = () =>
  typeof Deno !== 'undefined' && Deno.env.get('ALLOW_LOOPBACK_ORIGINS') === 'true';

export function isAllowedOrigin(origin: string, allowLoopback = allowsLoopbackOrigins()): boolean {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const isLoopback =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.protocol === 'http:';

    if (isLoopback) return allowLoopback;
  } catch {
    return false;
  }

  return ALLOWED_ORIGINS.includes(origin);
}
