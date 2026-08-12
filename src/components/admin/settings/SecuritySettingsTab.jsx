import { useCallback, useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import {
  CircleAlert,
  Clock3,
  Copy,
  Fingerprint,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  BODY,
  Empty,
  MICRO,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
  SectionLabel,
  TILE,
  FADE_UP,
} from '@/components/admin/ui/primitives';
import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';
import { getPasswordStrength } from '@/lib/validations';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'mb-1.5 block text-stone-500 dark:text-stone-400');

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
};

const SESSION_METHOD_LABELS = {
  password: 'Password',
  totp: 'Authenticator',
  phone: 'Phone',
  passkey: 'Passkey',
  recovery: 'Recovery code',
};

const SESSION_METHOD_ORDER = ['password', 'totp', 'phone', 'passkey', 'recovery'];

const authMethodsLabel = (methods) => {
  const values = (methods || [])
    .flatMap((entry) => {
      const value = typeof entry === 'string' ? entry : entry?.method;
      return value ? String(value).split('+') : [];
    })
    .map((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '')
    )
    .filter(Boolean);
  const uniqueValues = [...new Set(values)].sort((left, right) => {
    const leftIndex = SESSION_METHOD_ORDER.indexOf(left);
    const rightIndex = SESSION_METHOD_ORDER.indexOf(right);
    return (
      (leftIndex === -1 ? SESSION_METHOD_ORDER.length : leftIndex) -
      (rightIndex === -1 ? SESSION_METHOD_ORDER.length : rightIndex)
    );
  });
  const labels = uniqueValues.map(
    (value) => SESSION_METHOD_LABELS[value] || `${value.charAt(0).toUpperCase()}${value.slice(1)}`
  );
  return labels.length ? labels.join(' + ') : 'Session observed';
};

const browserSessionLabel = (userAgent) => {
  if (!userAgent) return 'Unknown browser';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Safari\//.test(userAgent)
        ? 'Safari'
        : /Firefox\//.test(userAgent)
          ? 'Firefox'
          : 'Browser';
  const platform = /Macintosh|Mac OS X/.test(userAgent)
    ? 'macOS'
    : /Windows/.test(userAgent)
      ? 'Windows'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : null;
  return platform ? `${browser} on ${platform}` : browser;
};

export default function SecuritySettingsTab({
  passwordData,
  onChangePasswordData,
  changingPassword,
  onPasswordChange,
}) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [factorName, setFactorName] = useState('Authenticator app');
  const [pendingTotp, setPendingTotp] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [stepUpCode, setStepUpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [passkeyAction, setPasskeyAction] = useState(null);
  const [passkeyCode, setPasskeyCode] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setSnapshot(await AdminSecurityService.getSnapshot());
    } catch (error) {
      const message = error.message || 'Failed to load security controls';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifiedFactors = snapshot?.factors?.filter((factor) => factor.status === 'verified') || [];
  const canManagePasskeys = useMemo(
    () => snapshot?.passkeysAvailable !== false && verifiedFactors.length > 0,
    [snapshot, verifiedFactors.length]
  );
  const isRecoverySession = Boolean(snapshot?.status?.recovery_session_expires_at);
  const isCanonicalPasskeyOrigin =
    typeof window === 'undefined' || window.location.hostname === 'www.ieltsai.pro';
  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const activeSessions = snapshot?.sessions?.filter((session) => !session.revoked_at) || [];

  const run = async (name, action, successMessage) => {
    setWorking(name);
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await refresh();
    } catch (error) {
      toast.error(error.message || 'The security action could not be completed.');
    } finally {
      setWorking('');
    }
  };

  const beginTotpEnrollment = () =>
    run(
      'enroll-totp',
      async () => {
        const data = await AdminSecurityService.enrollTotp(factorName);
        setPendingTotp(data);
      },
      'Scan the code, then verify it to finish adding this authenticator.'
    );

  const verifyTotpEnrollment = () =>
    run(
      'verify-totp',
      async () => {
        if (!pendingTotp?.id || !totpCode.trim())
          throw new Error('Enter the current authenticator code.');
        await AdminSecurityService.verifyTotp(pendingTotp.id, totpCode);
        await AdminSecurityService.record('mfa_enrolled', { factor_id: pendingTotp.id });
        setPendingTotp(null);
        setTotpCode('');
      },
      'Authenticator verified. This session is now AAL2.'
    );

  const verifyCurrentSession = (factorId) =>
    run(
      `verify-session-${factorId}`,
      async () => {
        if (!stepUpCode.trim()) throw new Error('Enter the current authenticator code.');
        await AdminSecurityService.verifyTotp(factorId, stepUpCode);
        setStepUpCode('');
      },
      'This administrator session is now AAL2.'
    );

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast.success('Recovery codes copied. Store them offline now.');
    } catch {
      toast.error('Copy failed. Select the codes manually and store them offline.');
    }
  };

  if (loading && !snapshot) {
    return (
      <div className="grid max-w-6xl grid-cols-12 gap-3 animate-pulse">
        <div className="col-span-12 h-48 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
        <div className="col-span-12 lg:col-span-7 h-80 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
        <div className="col-span-12 lg:col-span-5 h-80 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
      </div>
    );
  }

  if (loadError && !snapshot) {
    return (
      <section className={cn(PANEL, 'max-w-6xl overflow-hidden')}>
        <PanelHeader
          label="Admin security"
          title="Security controls could not be loaded"
          description="No authenticator or session totals are shown until the live security state can be verified."
          accent="fault"
        />
        <div className="flex flex-wrap items-center gap-3 p-4">
          <CircleAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
          <p className={cn(BODY, 'min-w-0 flex-1 text-rose-700 dark:text-rose-200')}>{loadError}</p>
          <AdminButton onClick={refresh} loading={loading}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </AdminButton>
        </div>
      </section>
    );
  }

  return (
    <m.div variants={FADE_UP} className="grid max-w-6xl grid-cols-12 gap-3">
      <section className={cn(PANEL, 'col-span-12 overflow-hidden')}>
        <PanelHeader
          label="Admin security"
          title="Protected administrator access"
          description="Passkeys and MFA protect administrator access."
          accent={snapshot?.status?.aal === 'aal2' ? 'ok' : 'warn'}
        >
          <Pill tone={snapshot?.status?.aal === 'aal2' ? 'ok' : 'warn'}>
            {snapshot?.status?.aal?.toUpperCase() || 'AAL1'}
          </Pill>
        </PanelHeader>
        <div className="grid grid-cols-1 gap-px bg-stone-200/70 dark:bg-white/[0.07] sm:grid-cols-3">
          <div className="bg-white px-4 py-3 dark:bg-[#131315]">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>MFA enforcement</p>
            <p className="mt-1 text-xs font-extrabold text-stone-900 dark:text-stone-50">
              {snapshot?.status?.mfa_required ? 'Required for admin work' : 'Setup pending'}
            </p>
          </div>
          <div className="bg-white px-4 py-3 dark:bg-[#131315]">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
              Verified authenticators
            </p>
            <p className={cn(NUM, 'mt-1 text-sm font-bold text-stone-900 dark:text-stone-50')}>
              {verifiedFactors.length}
            </p>
          </div>
          <div className="bg-white px-4 py-3 dark:bg-[#131315]">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Recovery status</p>
            <p className="mt-1 text-xs font-extrabold text-stone-900 dark:text-stone-50">
              {isRecoverySession
                ? `Temporary until ${formatDate(snapshot.status.recovery_session_expires_at)}`
                : 'No temporary grant'}
            </p>
          </div>
        </div>
      </section>

      <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-7')}>
        <PanelHeader
          label="Passkeys"
          title="Phishing-resistant sign-in"
          description="Add a passkey for phishing-resistant sign-in."
          accent="accent"
        />
        <div className="space-y-3 p-4">
          {!isCanonicalPasskeyOrigin && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/8 dark:text-amber-200">
              Add and use passkeys at www.ieltsai.pro. WebAuthn intentionally rejects preview and
              alternate domains.
            </div>
          )}
          {snapshot?.passkeysAvailable === false ? (
            <div className={cn(TILE, 'flex items-start gap-3 p-3')}>
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                  Passkeys are unavailable for this project
                </p>
                <p className={cn(BODY, 'mt-1')}>
                  Supabase Auth rejected the passkey request. MFA authenticators and session records
                  remain available while the project setting is corrected.
                </p>
              </div>
            </div>
          ) : snapshot?.passkeys?.length ? (
            snapshot.passkeys.map((passkey) => (
              <div key={passkey.id} className={cn(TILE, 'flex items-center gap-3 p-3')}>
                <Fingerprint className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
                    {passkey.friendly_name || 'Passkey'}
                  </p>
                  <p
                    className={cn(
                      MICRO,
                      'mt-0.5 normal-case tracking-normal text-stone-500 dark:text-stone-400'
                    )}
                  >
                    Added {formatDate(passkey.created_at)}
                    {passkey.last_used_at ? ` · Last used ${formatDate(passkey.last_used_at)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canManagePasskeys || working === `delete-passkey-${passkey.id}`}
                  onClick={() => setPasskeyAction({ type: 'remove', passkey })}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:text-rose-300"
                  aria-label={`Remove ${passkey.friendly_name || 'passkey'}`}
                >
                  {working === `delete-passkey-${passkey.id}` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))
          ) : (
            <Empty icon={Fingerprint} title="No passkey enrolled yet" className="py-7">
              Add one to this device or password manager.
            </Empty>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3 dark:border-white/[0.07]">
            <p className={cn(BODY, 'max-w-md')}>
              Confirm with your authenticator before changing passkeys.
            </p>
            <AdminButton
              disabled={
                !canManagePasskeys || !isCanonicalPasskeyOrigin || working === 'add-passkey'
              }
              loading={working === 'add-passkey'}
              onClick={() => setPasskeyAction({ type: 'add' })}
            >
              <Plus className="h-3.5 w-3.5" /> Add passkey
            </AdminButton>
          </div>
          {passkeyAction && passkeyAction.stage !== 'register' && (
            <div className={cn(TILE, 'space-y-3 p-3')}>
              <SectionLabel accent="accent">
                {passkeyAction.type === 'add'
                  ? 'Verify to add a passkey'
                  : 'Verify to remove a passkey'}
              </SectionLabel>
              <div className="max-w-sm">
                <div>
                  <Label className={FIELD_LABEL} htmlFor="passkey-code">
                    Authenticator code
                  </Label>
                  <Input
                    id="passkey-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={passkeyCode}
                    onChange={(event) => setPasskeyCode(event.target.value.replace(/\s/g, ''))}
                    className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
                    placeholder="123456"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <AdminButton
                  disabled={!passkeyCode}
                  loading={working === 'add-passkey'}
                  onClick={() =>
                    run(
                      'add-passkey',
                      async () => {
                        if (passkeyAction.type === 'add') {
                          await AdminSecurityService.verifySensitiveAction(
                            verifiedFactors[0].id,
                            passkeyCode
                          );
                          setPasskeyCode('');
                          const registration =
                            await AdminSecurityService.preparePasskeyRegistration();
                          setPasskeyAction({ type: 'add', stage: 'register', registration });
                        } else {
                          await AdminSecurityService.verifySensitiveAction(
                            verifiedFactors[0].id,
                            passkeyCode
                          );
                          await AdminSecurityService.removePasskey(passkeyAction.passkey.id);
                          setPasskeyCode('');
                          setPasskeyAction(null);
                        }
                      },
                      passkeyAction.type === 'add' ? undefined : 'Passkey removed.'
                    )
                  }
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  {passkeyAction.type === 'add' ? 'Verify identity' : 'Verify and remove'}
                </AdminButton>
              </div>
            </div>
          )}
          {passkeyAction?.type === 'add' && passkeyAction.stage === 'register' && (
            <div className={cn(TILE, 'flex flex-wrap items-center justify-between gap-3 p-3')}>
              <div>
                <SectionLabel accent="accent">Ready to add a passkey</SectionLabel>
                <p className={cn(BODY, 'mt-1')}>
                  Keep this window active, then start the device prompt.
                </p>
              </div>
              <AdminButton
                loading={working === 'add-passkey'}
                onClick={() =>
                  run(
                    'add-passkey',
                    async () => {
                      await AdminSecurityService.registerPreparedPasskey(
                        passkeyAction.registration
                      );
                      setPasskeyAction(null);
                    },
                    'Passkey added.'
                  )
                }
              >
                <Fingerprint className="h-3.5 w-3.5" /> Start passkey registration
              </AdminButton>
            </div>
          )}
        </div>
      </section>

      <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-5')}>
        <PanelHeader
          label="Authenticator"
          title="Second factor"
          description="Use an authenticator to verify sensitive actions."
          accent={verifiedFactors.length ? 'ok' : 'warn'}
        />
        <div className="space-y-3 p-4">
          {verifiedFactors.map((factor) => (
            <div key={factor.id} className={cn(TILE, 'flex items-center gap-3 p-3')}>
              <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-stone-900 dark:text-stone-50">
                  {factor.friendly_name || 'Authenticator app'}
                </p>
                <p
                  className={cn(
                    MICRO,
                    'mt-0.5 normal-case tracking-normal text-stone-500 dark:text-stone-400'
                  )}
                >
                  Verified {formatDate(factor.created_at)}
                </p>
              </div>
              <button
                type="button"
                disabled={
                  verifiedFactors.length <= 1 ||
                  snapshot?.status?.aal !== 'aal2' ||
                  working === `remove-factor-${factor.id}`
                }
                onClick={() =>
                  run(
                    `remove-factor-${factor.id}`,
                    () => AdminSecurityService.removeFactor(factor.id),
                    'Authenticator removed.'
                  )
                }
                className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:text-rose-300"
                aria-label={`Remove ${factor.friendly_name || 'authenticator'}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {pendingTotp ? (
            <div className={cn(TILE, 'space-y-3 p-3')}>
              <SectionLabel accent="accent">Verify new authenticator</SectionLabel>
              <img
                src={pendingTotp.totp.qr_code}
                alt="Scan this QR code with your authenticator app"
                className="mx-auto h-36 w-36 rounded-md border border-stone-200 bg-white p-2"
              />
              <p className={cn(BODY, 'text-center')}>
                Scan the code, then enter the current six-digit code. The secret is never stored by
                this app.
              </p>
              <Input
                aria-label="New authenticator verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/\s/g, ''))}
                className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
                placeholder="123456"
              />
              <AdminButton
                className="w-full"
                loading={working === 'verify-totp'}
                onClick={verifyTotpEnrollment}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Verify authenticator
              </AdminButton>
            </div>
          ) : (
            <>
              {verifiedFactors.length > 0 && snapshot?.status?.aal !== 'aal2' && (
                <div className={cn(TILE, 'mb-3 p-3')}>
                  <p className={cn(BODY, 'mb-2')}>
                    You already have a verified authenticator. Enter its current code to upgrade
                    this session to AAL2 and unlock passkeys and recovery codes.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      aria-label="Current authenticator code"
                      value={stepUpCode}
                      onChange={(event) => setStepUpCode(event.target.value.replace(/\s/g, ''))}
                      className={cn(FIELD_INPUT, 'font-mono tracking-[0.22em]')}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                    />
                    <AdminButton
                      loading={working === `verify-session-${verifiedFactors[0].id}`}
                      onClick={() => verifyCurrentSession(verifiedFactors[0].id)}
                    >
                      Verify
                    </AdminButton>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor="factor-name" className={FIELD_LABEL}>
                    New authenticator name
                  </Label>
                  <Input
                    id="factor-name"
                    value={factorName}
                    onChange={(event) => setFactorName(event.target.value)}
                    className={FIELD_INPUT}
                    maxLength={80}
                  />
                </div>
                <AdminButton loading={working === 'enroll-totp'} onClick={beginTotpEnrollment}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </AdminButton>
              </div>
            </>
          )}

          {!snapshot?.status?.mfa_required && verifiedFactors.length > 0 && (
            <div className="border-t border-stone-200/80 pt-3 dark:border-white/[0.07]">
              <p className={cn(BODY, 'mb-2')}>
                Your authenticator is ready. Turn on enforcement to require AAL2 for every protected
                admin query and action.
              </p>
              <AdminButton
                className="w-full"
                disabled={snapshot?.status?.aal !== 'aal2'}
                loading={working === 'enforce-mfa'}
                onClick={() =>
                  run(
                    'enforce-mfa',
                    () => AdminSecurityService.enableMfaEnforcement(),
                    'AAL2 is now required for administrator access.'
                  )
                }
              >
                <Lock className="h-3.5 w-3.5" /> Require MFA for admin access
              </AdminButton>
            </div>
          )}
        </div>
      </section>

      <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-7')}>
        <PanelHeader
          label="Recovery"
          title="Backup recovery codes"
          description="Use one at sign-in if your authenticator is unavailable."
          accent="warn"
        />
        <div className="space-y-3 p-4">
          {recoveryCodes.length > 0 ? (
            <div className={cn(TILE, 'p-3')}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                  Save these codes offline now
                </p>
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {recoveryCodes.map((code) => (
                  <code
                    key={code}
                    className={cn(
                      NUM,
                      'rounded-md bg-stone-100 px-2.5 py-2 text-center text-[11px] font-bold text-stone-800 dark:bg-white/[0.06] dark:text-stone-100'
                    )}
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>
          ) : (
            <div className={cn(TILE, 'p-3')}>
              <p className={cn(BODY, 'mb-3')}>
                Each code works once. Creating a new set invalidates every unused old code.
              </p>
              <AdminButton
                disabled={snapshot?.status?.aal !== 'aal2'}
                loading={working === 'rotate-recovery'}
                onClick={() =>
                  run(
                    'rotate-recovery',
                    async () => setRecoveryCodes(await AdminSecurityService.rotateRecoveryCodes()),
                    'New recovery codes generated.'
                  )
                }
              >
                <RefreshCw className="h-3.5 w-3.5" /> Generate recovery codes
              </AdminButton>
            </div>
          )}
        </div>
      </section>

      <section className={cn(PANEL, 'col-span-12 overflow-hidden lg:col-span-5')}>
        <PanelHeader
          label="Password"
          title="Change password"
          description="Use a unique 12-character password."
          accent="idle"
        />
        <div className="space-y-3 p-4">
          <div>
            <Label className={FIELD_LABEL} htmlFor="current-password">
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(event) =>
                onChangePasswordData({ ...passwordData, currentPassword: event.target.value })
              }
              className={FIELD_INPUT}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className={FIELD_LABEL} htmlFor="new-password">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(event) =>
                  onChangePasswordData({ ...passwordData, newPassword: event.target.value })
                }
                className={FIELD_INPUT}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label className={FIELD_LABEL} htmlFor="confirm-password">
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(event) =>
                  onChangePasswordData({ ...passwordData, confirmPassword: event.target.value })
                }
                className={FIELD_INPUT}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordData.newPassword && (
            <div className={cn(TILE, 'p-3')}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className={FIELD_LABEL}>Password strength</span>
                <span className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200">
                  {passwordStrength.label}
                </span>
              </div>
              <div
                className="grid grid-cols-5 gap-1"
                aria-label={`Password strength: ${passwordStrength.label}`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1.5 rounded-full',
                      index < passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-stone-200 dark:bg-white/10'
                    )}
                  />
                ))}
              </div>
              <p className={cn(BODY, 'mt-2')}>
                Use upper- and lowercase letters, a number, and a symbol.
              </p>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <AdminButton
              onClick={onPasswordChange}
              loading={changingPassword}
              disabled={!passwordData.currentPassword || !passwordData.newPassword}
            >
              <Save className="h-3.5 w-3.5" /> Update password
            </AdminButton>
          </div>
        </div>
      </section>

      <section className={cn(PANEL, 'col-span-12 overflow-hidden')}>
        <PanelHeader
          label="Sessions"
          title="Active sessions"
          description="Review and revoke administrator sign-ins."
          accent="ok"
        >
          <button
            type="button"
            onClick={refresh}
            className="rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-50"
            aria-label="Refresh security sessions"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </button>
        </PanelHeader>
        <div className="divide-y divide-stone-100 dark:divide-white/[0.07]">
          {activeSessions.length ? (
            activeSessions.map((session) => {
              const isCurrent = session.session_id === snapshot.status.session_id;
              return (
                <div key={session.session_id} className="flex items-center gap-3 px-4 py-3">
                  <Laptop className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                        {browserSessionLabel(session.user_agent)}
                      </p>
                      {isCurrent && <Pill tone="ok">Current</Pill>}
                    </div>
                    <p
                      className={cn(
                        MICRO,
                        'mt-0.5 truncate normal-case tracking-normal text-stone-500 dark:text-stone-400'
                      )}
                    >
                      {authMethodsLabel(session.authentication_methods)} · Last active{' '}
                      {formatDate(session.last_seen_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      NUM,
                      'hidden text-right text-[10px] font-bold text-stone-500 sm:block dark:text-stone-400'
                    )}
                  >
                    {session.session_id.slice(0, 8)}
                  </span>
                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={working === `signout-session-${session.session_id}`}
                      onClick={() => {
                        if (
                          window.confirm('Sign out this session? It will need to sign in again.')
                        ) {
                          run(
                            `signout-session-${session.session_id}`,
                            () => AdminSecurityService.signOutSession(session.session_id),
                            'Session signed out.'
                          );
                        }
                      }}
                      className="rounded-md border border-stone-200 px-2 py-1 text-[10px] font-extrabold text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:border-white/[0.1] dark:text-stone-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                    >
                      {working === `signout-session-${session.session_id}`
                        ? 'Signing out…'
                        : 'Sign out'}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <Empty icon={Clock3} title="No active administrator sessions">
              New sign-ins will appear here.
            </Empty>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-4 py-3 dark:border-white/[0.07]">
          <p className={cn(BODY, 'max-w-2xl')}>
            Sign out every session if your account may be compromised.
          </p>
          <AdminButton
            variant="destructive"
            loading={working === 'signout-all'}
            onClick={() => {
              if (
                window.confirm(
                  'Sign out all administrator sessions? You will need to sign in again.'
                )
              ) {
                run('signout-all', () => AdminSecurityService.signOutEverywhere());
              }
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out everywhere
          </AdminButton>
        </div>
      </section>
    </m.div>
  );
}
