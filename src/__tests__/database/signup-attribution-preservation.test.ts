import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260913160244_preserve_signup_attribution.sql'),
  'utf8'
);

describe('signup attribution preservation migration', () => {
  it('persists first-touch fields in the auth trigger without using auth provider data', () => {
    expect(migration).not.toContain('signup_method');
    expect(migration).not.toContain("NEW.raw_app_meta_data->>'provider'");
    expect(migration).toContain("NEW.raw_user_meta_data->>'signup_channel'");
    expect(migration).toContain("NEW.raw_user_meta_data->>'signup_fbclid'");
  });

  it('scrubs auth credentials and exposes only acquisition fields to the overview', () => {
    expect(migration).toContain('token_hash|code|access_token|refresh_token|error_description');
    expect(migration).toContain(
      "COALESCE(NULLIF(signup_channel, ''), 'unknown') AS signup_channel"
    );
  });
});
