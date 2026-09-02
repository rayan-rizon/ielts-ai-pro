const PLACEHOLDER_VALUE = /^%VITE_[A-Z0-9_]+%$/;
const PLACEHOLDER_TEXT = /^(?:your[-_]|change[-_]?me|replace[-_]?me|placeholder|example(?:\.|$))/i;
const PLACEHOLDER_MARKER = /(?:your[-_]?project|example\.supabase\.co|placeholder)/i;

const isPlaceholder = (value: string) =>
  PLACEHOLDER_VALUE.test(value) || PLACEHOLDER_TEXT.test(value) || PLACEHOLDER_MARKER.test(value);

const readPublicEnv = (name: string) => import.meta.env[name]?.trim();

export const requirePublicEnv = (name: string) => {
  const value = readPublicEnv(name);

  // Vitest imports browser services without a deployed Vite environment. Keep
  // that test-only contract explicit instead of shipping placeholders to users.
  if (import.meta.env.MODE === 'test' && (!value || isPlaceholder(value))) {
    if (name.endsWith('_URL') || name.includes('URL')) {
      return `https://test-${name.toLowerCase().replace(/_/g, '-')}.supabase.co`;
    }
    return `test-${name.toLowerCase()}`;
  }

  if (!value || isPlaceholder(value)) {
    throw new Error(`${name} is required; set it in .env or the Vercel project settings.`);
  }

  return value;
};

export const optionalPublicEnv = (name: string) => {
  const value = readPublicEnv(name);
  return value && !isPlaceholder(value) ? value : undefined;
};
