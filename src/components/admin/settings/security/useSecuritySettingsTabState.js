import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';
import { getPasswordStrength } from '@/lib/validations';
import { hasRecentAuthenticatorVerification } from '@/features/admin/utils/adminSecurityState';
import { useTotpManagement, usePasskeyManagement, useSessionSignOut } from './useSecurityActions';

const EMPTY_SNAPSHOT_DATA = {
  status: null,
  aal: 'aal1',
  isAal2: false,
  mfaRequired: false,
  recoveryExpiresAt: null,
  currentSessionId: null,
  passkeysAvailable: true,
  passkeys: [],
  verifiedFactors: [],
  activeSessions: [],
};

const getVerifiedFactors = (factors) => {
  if (!Array.isArray(factors)) return [];
  return factors.filter((f) => f.status === 'verified');
};

const getActiveSessions = (sessions) => {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter((s) => !s.revoked_at);
};

function extractStatusMeta(status = {}) {
  const aal = status.aal || 'aal1';
  return {
    status,
    aal,
    isAal2: aal === 'aal2',
    mfaRequired: Boolean(status.mfa_required),
    recoveryExpiresAt: status.recovery_session_expires_at || null,
    currentSessionId: status.session_id || null,
  };
}

function extractSnapshotData(snapshot) {
  if (!snapshot) return EMPTY_SNAPSHOT_DATA;
  const statusMeta = extractStatusMeta(snapshot.status);

  return {
    ...statusMeta,
    passkeysAvailable: snapshot.passkeysAvailable !== false,
    passkeys: snapshot.passkeys || [],
    verifiedFactors: getVerifiedFactors(snapshot.factors),
    activeSessions: getActiveSessions(snapshot.sessions),
  };
}

export function useSecuritySnapshot() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [loadError, setLoadError] = useState('');

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

  const run = useCallback(
    async (name, action, successMessage) => {
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
    },
    [refresh]
  );

  return { snapshot, loading, working, setWorking, loadError, refresh, run };
}

export function useRecoveryCodesManagement(run) {
  const [recoveryCodes, setRecoveryCodes] = useState([]);

  const copyRecoveryCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      toast.success('Recovery codes copied. Store them offline now.');
    } catch {
      toast.error('Copy failed. Select the codes manually and store them offline.');
    }
  }, [recoveryCodes]);

  const rotateRecoveryCodes = useCallback(
    () =>
      run(
        'rotate-recovery',
        async () => setRecoveryCodes(await AdminSecurityService.rotateRecoveryCodes()),
        'New recovery codes generated.'
      ),
    [run]
  );

  return { recoveryCodes, copyRecoveryCodes, rotateRecoveryCodes };
}

function buildPasskeysProps({ meta, passkey, working, onRemovePasskey }) {
  const canManagePasskeys = meta.passkeysAvailable && meta.verifiedFactors.length > 0;
  const isCanonicalPasskeyOrigin =
    typeof window === 'undefined' || window.location.hostname === 'www.ieltsai.pro';
  const hasRecentPasskeyStepUp = hasRecentAuthenticatorVerification(meta.status);

  return {
    passkeys: meta.passkeys,
    passkeysAvailable: meta.passkeysAvailable,
    canManagePasskeys,
    isCanonicalPasskeyOrigin,
    hasRecentPasskeyStepUp,
    working,
    passkeyAction: passkey.passkeyAction,
    passkeyCode: passkey.passkeyCode,
    onPasskeyCodeChange: passkey.setPasskeyCode,
    onBeginPasskeyAdd: passkey.beginPasskeyAdd,
    onRemovePasskey,
    onVerifyPasskeyAction: passkey.verifyPasskeyAction,
    onRegisterPasskey: passkey.registerPasskey,
  };
}

function buildAuthenticatorsProps({
  meta,
  totp,
  factorName,
  setFactorName,
  working,
  removeFactor,
  enforceMfa,
}) {
  return {
    isAal2: meta.isAal2,
    mfaRequired: meta.mfaRequired,
    verifiedFactors: meta.verifiedFactors,
    working,
    pendingTotp: totp.pendingTotp,
    totpCode: totp.totpCode,
    stepUpCode: totp.stepUpCode,
    factorName,
    onTotpCodeChange: totp.setTotpCode,
    onStepUpCodeChange: totp.setStepUpCode,
    onFactorNameChange: setFactorName,
    onRemoveFactor: removeFactor,
    onVerifyTotpEnrollment: totp.verifyTotpEnrollment,
    onVerifyCurrentSession: totp.verifyCurrentSession,
    onBeginTotpEnrollment: totp.beginTotpEnrollment,
    onEnforceMfa: enforceMfa,
  };
}

function buildOverviewProps(meta) {
  return {
    aal: meta.aal,
    mfaRequired: meta.mfaRequired,
    verifiedFactorsCount: meta.verifiedFactors.length,
    recoveryExpiresAt: meta.recoveryExpiresAt,
  };
}

export function useSecuritySettingsTabState({ passwordData }) {
  const { snapshot, loading, working, setWorking, loadError, refresh, run } = useSecuritySnapshot();
  const [factorName, setFactorName] = useState('Authenticator app');

  const meta = useMemo(() => extractSnapshotData(snapshot), [snapshot]);
  const newPassword = passwordData ? passwordData.newPassword : '';
  const passwordStrength = getPasswordStrength(newPassword || '');
  const hasRecentPasskeyStepUp = hasRecentAuthenticatorVerification(meta.status);

  const totp = useTotpManagement({ factorName, run });
  const passkey = usePasskeyManagement({
    verifiedFactors: meta.verifiedFactors,
    hasRecentPasskeyStepUp,
    run,
    setWorking,
  });
  const { signOutSession, signOutEverywhere } = useSessionSignOut({ run });
  const { recoveryCodes, copyRecoveryCodes, rotateRecoveryCodes } = useRecoveryCodesManagement(run);

  const removeFactor = useCallback(
    (id) =>
      run(
        `remove-factor-${id}`,
        () => AdminSecurityService.removeFactor(id),
        'Authenticator removed.'
      ),
    [run]
  );
  const enforceMfa = useCallback(
    () =>
      run(
        'enforce-mfa',
        () => AdminSecurityService.enableMfaEnforcement(),
        'AAL2 is now required for administrator access.'
      ),
    [run]
  );
  const onRemovePasskey = useCallback(
    (item) => passkey.setPasskeyAction({ type: 'remove', passkey: item }),
    [passkey]
  );

  return {
    snapshot,
    loading,
    loadError,
    refresh,
    passwordStrength,
    overviewProps: buildOverviewProps(meta),
    passkeysProps: buildPasskeysProps({ meta, passkey, working, onRemovePasskey }),
    authenticatorsProps: buildAuthenticatorsProps({
      meta,
      totp,
      factorName,
      setFactorName,
      working,
      removeFactor,
      enforceMfa,
    }),
    recoveryProps: {
      recoveryCodes,
      isAal2: meta.isAal2,
      working,
      onCopyRecoveryCodes: copyRecoveryCodes,
      onRotateRecoveryCodes: rotateRecoveryCodes,
    },
    sessionsProps: {
      sessions: meta.activeSessions,
      currentSessionId: meta.currentSessionId,
      loading,
      working,
      onRefresh: refresh,
      onSignOutSession: signOutSession,
      onSignOutEverywhere: signOutEverywhere,
    },
  };
}
