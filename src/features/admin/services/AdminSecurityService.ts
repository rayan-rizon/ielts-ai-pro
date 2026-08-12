import { supabase } from '@/lib/supabase';

export type AdminSecuritySession = {
  session_id: string;
  first_seen_at: string;
  last_seen_at: string;
  last_event: string;
  authentication_methods: Array<{ method?: string; timestamp?: number }> | string[];
  user_agent: string | null;
  revoked_at: string | null;
};

export type AdminSecurityEvent = {
  id: string;
  session_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminSecurityStatus = {
  mfa_required: boolean;
  recovery_session_expires_at: string | null;
  session_id: string | null;
  aal: 'aal1' | 'aal2';
  authentication_methods: Array<{ method?: string; timestamp?: number }> | string[];
};

export type AdminSecuritySnapshot = {
  status: AdminSecurityStatus;
  factors: Array<{
    id: string;
    factor_type: string;
    friendly_name?: string;
    status: string;
    created_at: string;
  }>;
  passkeys: Array<{
    id: string;
    friendly_name?: string;
    created_at: string;
    last_used_at?: string;
  }>;
  passkeysAvailable: boolean;
  passkeysError: string | null;
  sessions: AdminSecuritySession[];
  events: AdminSecurityEvent[];
};

const browserLabel = () => {
  if (typeof navigator === 'undefined') return null;
  return navigator.userAgent || null;
};

const throwOnError = (error: { message?: string } | null) => {
  if (error) throw new Error(error.message || 'The security request could not be completed.');
};

export const AdminSecurityService = {
  async record(eventType: string, metadata: Record<string, unknown> = {}) {
    const { error } = await supabase.rpc('record_admin_security_event', {
      p_event_type: eventType,
      p_metadata: metadata,
      p_user_agent: browserLabel(),
    });
    throwOnError(error);
  },

  async getSnapshot(): Promise<AdminSecuritySnapshot> {
    // A current session is logged before it is displayed. These are observed
    // admin sessions, not an assertion that Auth has every session still live.
    await this.record('admin_session_observed').catch(() => {});

    const [
      statusResult,
      factorsResult,
      fallbackFactorsResult,
      passkeysResult,
      sessionsResult,
      eventsResult,
    ] = await Promise.all([
      supabase.rpc('get_admin_security_status'),
      supabase.auth.mfa.listFactors(),
      supabase.rpc('get_admin_security_factors'),
      supabase.auth.passkey.list(),
      supabase
        .from('admin_security_sessions')
        .select(
          'session_id, first_seen_at, last_seen_at, last_event, authentication_methods, user_agent, revoked_at'
        )
        .order('last_seen_at', { ascending: false })
        .limit(12),
      supabase
        .from('admin_security_events')
        .select('id, session_id, event_type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(24),
    ]);

    throwOnError(statusResult.error);
    // Auth factors are the authority. The database inventory is only a
    // just-verified fallback, so one successful source is enough to render the
    // security console. Likewise, passkey availability must never hide MFA or
    // observed-session data.
    if (factorsResult.error && fallbackFactorsResult.error) {
      throwOnError(factorsResult.error);
    }
    throwOnError(sessionsResult.error);
    throwOnError(eventsResult.error);

    const status = statusResult.data as AdminSecurityStatus | null;
    if (!status) throw new Error('Your administrator role could not be confirmed.');

    const authFactors = factorsResult.error
      ? []
      : [...(factorsResult.data?.totp || []), ...(factorsResult.data?.phone || [])];
    const fallbackFactors = fallbackFactorsResult.error
      ? []
      : ((fallbackFactorsResult.data || []) as AdminSecuritySnapshot['factors']);

    return {
      status,
      // The Auth endpoint remains primary. The database-backed inventory only
      // covers the rare just-verified-session race where it returns no factors.
      factors: authFactors.length ? authFactors : fallbackFactors,
      passkeys: passkeysResult.error ? [] : passkeysResult.data || [],
      passkeysAvailable: !passkeysResult.error,
      passkeysError: passkeysResult.error?.message || null,
      sessions: (sessionsResult.data || []) as AdminSecuritySession[],
      events: (eventsResult.data || []) as AdminSecurityEvent[],
    };
  },

  async enrollTotp(friendlyName: string) {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: friendlyName.trim() || 'Authenticator app',
    });
    throwOnError(error);
    return data;
  },

  async verifyTotp(factorId: string, code: string) {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    throwOnError(error);

    // Challenge verification returns an AAL2 token. Save it explicitly before
    // any security RPC runs so no request can reuse the pre-MFA AAL1 token.
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    throwOnError(sessionError);

    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    throwOnError(assuranceError);
    if (assurance?.currentLevel !== 'aal2') {
      throw new Error(
        'Authenticator verification succeeded, but the AAL2 session was not established. Try again.'
      );
    }
    await this.record('mfa_verified');
    return assurance;
  },

  async removeFactor(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    throwOnError(error);
  },

  async registerPasskey() {
    // Safari checks focus at the point the WebAuthn ceremony starts. Registration
    // must therefore be started from its own explicit click, after—not during—an
    // asynchronous password and TOTP verification sequence.
    if (typeof window !== 'undefined') window.focus();
    if (typeof document !== 'undefined' && !document.hasFocus()) {
      throw new Error(
        'Keep this browser window active, then click Start passkey registration again.'
      );
    }
    const { data, error } = await supabase.auth.registerPasskey();
    if (error?.message && /document is not focused/i.test(error.message)) {
      throw new Error(
        'Keep this browser window active, then click Start passkey registration again.'
      );
    }
    throwOnError(error);
    await this.record('passkey_registered', { passkey_id: data?.id || null });
    return data;
  },

  async reverifySensitiveAction(password: string, factorId: string, code: string) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    throwOnError(userError);
    if (!user?.email) throw new Error('Your administrator identity could not be verified.');

    // A passkey can become a first factor, so require a fresh password and TOTP
    // verification in this same interaction rather than trusting an old tab.
    const { data: passwordSession, error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    throwOnError(passwordError);
    if (passwordSession.user?.id !== user.id) {
      throw new Error('The password belongs to a different account.');
    }

    await this.verifyTotp(factorId, code);
  },

  async removePasskey(passkeyId: string) {
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    throwOnError(error);
    await this.record('passkey_removed', { passkey_id: passkeyId });
  },

  async enableMfaEnforcement() {
    const { error } = await supabase.rpc('enable_admin_mfa_enforcement');
    throwOnError(error);
  },

  async rotateRecoveryCodes(): Promise<string[]> {
    const { data, error } = await supabase.rpc('rotate_admin_recovery_codes');
    throwOnError(error);
    return (data || []) as string[];
  },

  async redeemRecoveryCode(code: string): Promise<string> {
    const { data, error } = await supabase.rpc('redeem_admin_recovery_code', { p_code: code });
    throwOnError(error);
    if (!data) throw new Error('Invalid recovery code, or recovery is temporarily locked.');
    return String(data);
  },

  async signOutEverywhere() {
    const { error: auditError } = await supabase.rpc('end_all_admin_sessions');
    throwOnError(auditError);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    throwOnError(error);
  },

  async signOutSession(sessionId: string) {
    const { error } = await supabase.rpc('revoke_admin_security_session', {
      p_session_id: sessionId,
    });
    throwOnError(error);
  },
};
