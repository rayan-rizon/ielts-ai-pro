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

// Vercel deployment hostnames are scoped by team. Restrict preview access to
// this project's deployment naming scheme instead of accepting every hostname
// beginning with `ielts-ai-pro` on the public Vercel domain.
const VERCEL_PROJECT_ORIGIN =
  /^https:\/\/ielts-ai-pro-[a-z0-9-]+-rayan-rizons-projects\.vercel\.app$/;

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

  return ALLOWED_ORIGINS.includes(origin) || VERCEL_PROJECT_ORIGIN.test(origin);
}
