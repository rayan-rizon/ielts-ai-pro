import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260913141857_correct_google_auth_signup_attribution.sql'
  ),
  'utf8'
).toLowerCase();

describe('Google authentication signup attribution correction', () => {
  it('corrects only organic-search rows produced by the Google account chooser', () => {
    expect(migration).toContain("signup_channel = 'direct'");
    expect(migration).toContain("signup_channel = 'organic_search'");
    expect(migration).toContain(
      "signup_referrer ~* '^https?://accounts\\.google\\.com(?:[/:?#]|$)'"
    );
    expect(migration).toContain('signup_referrer = null');
    expect(migration).toContain('signup_landing_page = null');
  });

  it('preserves rows carrying independent marketing evidence', () => {
    for (const field of [
      'signup_utm_source',
      'signup_utm_medium',
      'signup_utm_campaign',
      'signup_utm_content',
      'signup_utm_term',
      'signup_gclid',
      'signup_fbclid',
    ]) {
      expect(migration).toContain(`nullif(btrim(${field}), '') is null`);
    }
  });
});
