import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';

export function useTotpManagement({ factorName, run }) {
  const [pendingTotp, setPendingTotp] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [stepUpCode, setStepUpCode] = useState('');

  const beginTotpEnrollment = useCallback(
    () =>
      run(
        'enroll-totp',
        async () => {
          const data = await AdminSecurityService.enrollTotp(factorName);
          setPendingTotp(data);
        },
        'Scan the code, then verify it to finish adding this authenticator.'
      ),
    [factorName, run]
  );

  const verifyTotpEnrollment = useCallback(
    () =>
      run(
        'verify-totp',
        async () => {
          if (!pendingTotp?.id || !totpCode.trim()) {
            throw new Error('Enter the current authenticator code.');
          }
          await AdminSecurityService.verifyTotp(pendingTotp.id, totpCode);
          await AdminSecurityService.record('mfa_enrolled', { factor_id: pendingTotp.id });
          setPendingTotp(null);
          setTotpCode('');
        },
        'Authenticator verified. This session is now AAL2.'
      ),
    [pendingTotp, totpCode, run]
  );

  const verifyCurrentSession = useCallback(
    (factorId) =>
      run(
        `verify-session-${factorId}`,
        async () => {
          if (!stepUpCode.trim()) throw new Error('Enter the current authenticator code.');
          await AdminSecurityService.verifyTotp(factorId, stepUpCode);
          setStepUpCode('');
        },
        'This administrator session is now AAL2.'
      ),
    [stepUpCode, run]
  );

  return {
    pendingTotp,
    totpCode,
    stepUpCode,
    setTotpCode,
    setStepUpCode,
    beginTotpEnrollment,
    verifyTotpEnrollment,
    verifyCurrentSession,
  };
}

async function executePasskeyAction(action, factorId, code) {
  await AdminSecurityService.verifySensitiveAction(factorId, code);
  if (action?.type === 'add') {
    const registration = await AdminSecurityService.preparePasskeyRegistration();
    return { type: 'add', stage: 'register', registration };
  }
  if (action?.passkey?.id) {
    await AdminSecurityService.removePasskey(action.passkey.id);
  }
  return null;
}

export function usePasskeyManagement({ verifiedFactors, hasRecentPasskeyStepUp, run, setWorking }) {
  const [passkeyAction, setPasskeyAction] = useState(null);
  const [passkeyCode, setPasskeyCode] = useState('');

  const beginPasskeyAdd = useCallback(async () => {
    if (!hasRecentPasskeyStepUp) {
      setPasskeyAction({ type: 'add', stage: 'verify' });
      return;
    }

    setWorking('prepare-passkey');
    try {
      const registration = await AdminSecurityService.preparePasskeyRegistration();
      setPasskeyAction({ type: 'add', stage: 'register', registration });
    } catch (error) {
      toast.error(error.message || 'Passkey registration could not be prepared.');
    } finally {
      setWorking('');
    }
  }, [hasRecentPasskeyStepUp, setWorking]);

  const verifyPasskeyAction = useCallback(() => {
    const isAdd = passkeyAction?.type === 'add';
    const successMsg = isAdd ? undefined : 'Passkey removed.';
    return run(
      'add-passkey',
      async () => {
        const factorId = verifiedFactors[0]?.id;
        const nextAction = await executePasskeyAction(passkeyAction, factorId, passkeyCode);
        setPasskeyCode('');
        setPasskeyAction(nextAction);
      },
      successMsg
    );
  }, [passkeyAction, passkeyCode, verifiedFactors, run]);

  const registerPasskey = useCallback(() => {
    return run(
      'add-passkey',
      async () => {
        await AdminSecurityService.registerPreparedPasskey(passkeyAction?.registration);
        setPasskeyAction(null);
      },
      'Passkey added.'
    );
  }, [passkeyAction, run]);

  return {
    passkeyAction,
    passkeyCode,
    setPasskeyAction,
    setPasskeyCode,
    beginPasskeyAdd,
    verifyPasskeyAction,
    registerPasskey,
  };
}

export function useSessionSignOut({ run }) {
  const signOutSession = useCallback(
    (sessionId) => {
      if (window.confirm('Sign out this session? It will need to sign in again.')) {
        run(
          `signout-session-${sessionId}`,
          () => AdminSecurityService.signOutSession(sessionId),
          'Session signed out.'
        );
      }
    },
    [run]
  );

  const signOutEverywhere = useCallback(() => {
    if (window.confirm('Sign out all administrator sessions? You will need to sign in again.')) {
      run('signout-all', () => AdminSecurityService.signOutEverywhere());
    }
  }, [run]);

  return { signOutSession, signOutEverywhere };
}
