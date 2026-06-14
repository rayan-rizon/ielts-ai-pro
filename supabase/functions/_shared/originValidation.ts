export const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173';

const ALLOWED_ORIGINS = [
  DEFAULT_ALLOWED_ORIGIN,
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://ieltsai.pro',
  'https://www.ieltsai.pro',
  'https://ielts-ai-pro*.vercel.app',
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    const isLoopback =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.protocol === 'http:';

    if (isLoopback) return true;
  } catch {
    return false;
  }

  return ALLOWED_ORIGINS.some((allowed) => {
    if (!allowed.includes('*')) return allowed === origin;

    const pattern = allowed
      .split('*')
      .map((part) => escapeRegex(part))
      .join('[a-zA-Z0-9-]*');
    return new RegExp(`^${pattern}$`).test(origin);
  });
}
