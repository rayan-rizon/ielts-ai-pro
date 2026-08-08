import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  clearAdminAccess,
  getAuthUserId,
  grantAdminAccess,
  hasAdminAccess,
} from '@/features/auth/utils/adminAccess';

describe('admin access context', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('is denied until the dedicated admin login grants access', () => {
    expect(hasAdminAccess('admin-1')).toBe(false);

    expect(grantAdminAccess('admin-1')).toBe(true);
    expect(hasAdminAccess('admin-1')).toBe(true);
  });

  it('is scoped to the authenticated user', () => {
    grantAdminAccess('admin-1');

    expect(hasAdminAccess('admin-2')).toBe(false);
  });

  it('survives a browser restart on the same device', () => {
    grantAdminAccess('admin-1');

    // Closing a browser clears tab session storage but retains persistent
    // browser storage, where Supabase also keeps its refreshable session.
    window.sessionStorage.clear();

    expect(hasAdminAccess('admin-1')).toBe(true);
  });

  it('promotes an existing tab-only marker during the upgrade', () => {
    window.sessionStorage.setItem('admin_access_user_id', 'admin-1');

    expect(hasAdminAccess('admin-1')).toBe(true);
    expect(window.localStorage.getItem('admin_access_user_id')).toBe('admin-1');
    expect(window.sessionStorage.getItem('admin_access_user_id')).toBeNull();
  });

  it('uses the Supabase Auth ID from a merged public profile', () => {
    expect(
      getAuthUserId({
        id: 'public-profile-id',
        auth_id: 'supabase-auth-id',
      })
    ).toBe('supabase-auth-id');
    expect(getAuthUserId({ id: 'supabase-auth-id' })).toBe('supabase-auth-id');
  });

  it('is removed when the login context is cleared', () => {
    grantAdminAccess('admin-1');
    clearAdminAccess();

    expect(hasAdminAccess('admin-1')).toBe(false);
  });

  it('does not persist invalid identifiers', () => {
    expect(grantAdminAccess('')).toBe(false);
    expect(hasAdminAccess('')).toBe(false);
  });
});

describe('admin database authorization migration', () => {
  const migration = readFileSync(
    resolve(
      process.cwd(),
      'supabase/migrations/20260729143821_harden_admin_authorization_20260729143524.sql'
    ),
    'utf8'
  );

  it('authorizes admins only through the database role', () => {
    expect(migration).toContain("role = 'admin'");
    expect(migration).not.toContain('auth.jwt()');
    expect(migration).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it('removes anonymous execution from admin authorization helpers', () => {
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.is_admin() FROM anon');
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role'
    );
  });
});
