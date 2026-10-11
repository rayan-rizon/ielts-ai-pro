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

// Vercel deployment hostnames are scoped by team. This project has both the
// stable `ielts-ai-pro` aliases and generated `ielts-ai-<deployment>` URLs.
// Keep the team suffix and project prefixes exact so look-alike public Vercel
// domains cannot pass the origin check.
const VERCEL_PROJECT_ORIGINS = [
  /^https:\/\/ielts-ai-pro(?:-[a-z0-9-]+)?-rayan-rizons-projects\.vercel\.app$/,
  /^https:\/\/ielts-ai-[a-z0-9-]+-rayan-rizons-projects\.vercel\.app$/,
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

  return (
    ALLOWED_ORIGINS.includes(origin) ||
    VERCEL_PROJECT_ORIGINS.some((pattern) => pattern.test(origin))
  );
}
