export const PUBLIC_BUILD_SETTINGS = [
  'VITE_GA4_SERVER_PURCHASE', 'VITE_PRACTICE_LIBRARY_ENABLED', 'VITE_SKILL_LAB_ENABLED',
  'VITE_POSTHOG_UI_HOST', 'VITE_POSTHOG_HOST', 'VITE_POSTHOG_PROJECT_TOKEN',
  'VITE_SENTRY_DSN', 'VITE_META_PIXEL_ID', 'VITE_GOOGLE_CLIENT_ID',
  'VITE_R2_PUBLIC_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_URL',
  'VITE_STRIPE_PUBLISHABLE_KEY',
];

export function selectProfile(args) {
  const option = args.find(arg => arg.startsWith('--profile='));
  const profile = option?.slice('--profile='.length) || 'production';
  if (!['staging', 'production'].includes(profile)) throw new Error('Unknown Cloudflare build profile');
  return profile;
}

export function buildOutput(profile) {
  return profile === 'production' ? 'cloudflare/dist-production' : 'cloudflare/dist';
}

export function validateProductionSettings(env) {
  const missing = PUBLIC_BUILD_SETTINGS.filter(name => !env[name]);
  if (missing.length) throw new Error(`Missing production public settings: ${missing.join(', ')}`);
  if (env.VITE_GA4_SERVER_PURCHASE !== 'true') throw new Error('Supabase reports purchases; VITE_GA4_SERVER_PURCHASE must be true');
  if (!env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) throw new Error('Production Stripe public key must use live mode');
  const dsn = URL.canParse(env.VITE_SENTRY_DSN) ? new URL(env.VITE_SENTRY_DSN) : null;
  if (!dsn || dsn.protocol !== 'https:' || !dsn.username || !dsn.hostname.endsWith('.sentry.io')) throw new Error('Production Sentry DSN must be a real HTTPS DSN, not a masked placeholder');
}

// Stage alone never enables indexing or measurement on a workers.dev candidate.
export function isMeasuredRequest(url, stage) {
  return stage === 'production' && url.protocol === 'https:' &&
    ['ieltsai.pro', 'www.ieltsai.pro'].includes(url.host);
}
