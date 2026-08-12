import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  Lock,
  Fingerprint,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  clearAdminAccess,
  getAuthUserId,
  grantAdminAccess,
  hasAdminAccess,
} from '@/features/auth/utils/adminAccess';
import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mfaFactor, setMfaFactor] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [authMethod, setAuthMethod] = useState('password');
  const navigate = useNavigate();
  const { user, signIn, signInWithPasskey, isAdmin, loading, adminCheckComplete, checkIsAdmin } =
    useAuth();
  const hasActiveAdminAccess = isAdmin && hasAdminAccess(getAuthUserId(user));
  const isLoading = Boolean(loadingAction);

  useEffect(() => {
    // Only redirect once loading is finished and we have a definitive auth state
    // AND we are not currently in the process of a manual login (which handles its own redirect)
    if (!loading && adminCheckComplete && user && !isLoggingIn) {
      if (hasActiveAdminAccess) {
        // A database-authorized admin already completed this tab's admin login.
        navigate(createPageUrl('AdminPanel'), { replace: true });
      } else if (!isAdmin) {
        clearAdminAccess();
        navigate(createPageUrl('Dashboard'), { replace: true });
      }
    }
  }, [user, isAdmin, hasActiveAdminAccess, navigate, loading, adminCheckComplete, isLoggingIn]);

  const completeAdminEntry = async (
    signedInUser,
    method,
    destination = createPageUrl('AdminPanel')
  ) => {
    const isUserAdmin = await checkIsAdmin(getAuthUserId(signedInUser));
    if (!isUserAdmin) {
      clearAdminAccess();
      setError('Access denied. You do not have administrator privileges.');
      navigate(createPageUrl('Dashboard'), { replace: true });
      return;
    }

    grantAdminAccess(getAuthUserId(signedInUser));
    await AdminSecurityService.record(
      method === 'passkey' ? 'admin_passkey_sign_in' : 'admin_sign_in'
    ).catch((auditError) =>
      console.warn('Admin security audit event could not be recorded:', auditError)
    );
    navigate(destination, { replace: true });
  };

  const continueAfterFirstFactor = async (signedInUser, method) => {
    const isUserAdmin = await checkIsAdmin(getAuthUserId(signedInUser));
    if (!isUserAdmin) {
      clearAdminAccess();
      setError('Access denied. You do not have administrator privileges.');
      navigate(createPageUrl('Dashboard'), { replace: true });
      return;
    }

    const [{ data: assurance, error: assuranceError }, { data: factorData, error: factorsError }] =
      await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
    if (assuranceError) throw assuranceError;
    if (factorsError) throw factorsError;

    const factors = [...(factorData?.totp || []), ...(factorData?.phone || [])].filter(
      (factor) => factor.status === 'verified'
    );
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2' && factors.length) {
      setMfaFactor(factors[0]);
      setAuthMethod(method);
      setLoadingAction(null);
      return;
    }

    const securitySetupDestination =
      factors.length === 0
        ? `${createPageUrl('AdminPanel')}?tab=settings&section=security`
        : createPageUrl('AdminPanel');
    await completeAdminEntry(signedInUser, method, securitySetupDestination);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoadingAction('password');
    setIsLoggingIn(true); // Prevent useEffect redirect
    clearAdminAccess();
    try {
      const signedInUser = await signIn(email, password);
      await continueAfterFirstFactor(signedInUser, 'password');
    } catch (err) {
      clearAdminAccess();
      console.error('Admin sign-in failed:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoadingAction(null);
      setIsLoggingIn(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError('');
    setLoadingAction('passkey');
    setIsLoggingIn(true);
    clearAdminAccess();
    try {
      const signedInUser = await signInWithPasskey();
      if (!signedInUser) throw new Error('No passkey session was created.');
      await continueAfterFirstFactor(signedInUser, 'passkey');
    } catch (err) {
      clearAdminAccess();
      setError(err.message || 'Passkey authentication failed.');
      setLoadingAction(null);
      setIsLoggingIn(false);
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    if (!mfaFactor || !mfaCode.trim()) return;
    setError('');
    setLoadingAction('mfa');
    try {
      await AdminSecurityService.verifyTotp(mfaFactor.id, mfaCode);
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('The session expired before MFA could be verified.');
      await completeAdminEntry(data.user, authMethod);
    } catch (err) {
      setError(err.message || 'The verification code was not accepted.');
      setLoadingAction(null);
    }
  };

  const isResolvingExistingSession =
    !isLoggingIn &&
    (loading || Boolean(user && (!adminCheckComplete || !isAdmin || hasActiveAdminAccess)));

  if (isResolvingExistingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-[#0b0b0c]">
        <Loader2
          className="w-8 h-8 animate-spin text-stone-800 dark:text-stone-200"
          aria-label="Verifying admin access"
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-stone-50 dark:bg-[#0b0b0c] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none"
      data-oid="iw8q45n"
    >
      {/* Background Grid Pattern & Subtle Instrument Ambient Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" data-oid="t4v:f43">
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"
          data-oid="o:708-2"
        />
        <div
          className="absolute top-[-25%] right-[-15%] w-[70vh] h-[70vh] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[130px]"
          data-oid="k.1-9se"
        />
        <div
          className="absolute bottom-[-20%] left-[-15%] w-[60vh] h-[60vh] rounded-full bg-stone-400/5 dark:bg-white/3 blur-[120px]"
          data-oid=":j:e5no"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
        data-oid="696cvjl"
      >
        {/* Back to Home */}
        <Link
          to={createPageUrl('Index')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors mb-5 group"
          data-oid="d8gz8vc"
        >
          <ArrowLeft
            className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            data-oid="zupq7ky"
          />
          Back to home
        </Link>

        <Card
          className="rounded-xl border border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315] overflow-hidden"
          data-oid="4ya:7w_"
        >
          {/* Header */}
          <CardHeader
            className="text-center pb-6 border-b border-stone-200/70 dark:border-white/6 bg-stone-50/50 dark:bg-white/2"
            data-oid="o5mzr30"
          >
            {/* Status indicators bar */}
            <div className="flex items-center justify-between mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--signal-ok))] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--signal-ok))]" />
                </span>
                <span>System Online</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/6 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300">
                Restricted Access
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-14 h-14 bg-stone-900 dark:bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-stone-900/10 dark:shadow-none text-white dark:text-stone-900"
              data-oid="cmtlqpa"
            >
              <Shield className="w-7 h-7" data-oid="mu54v1x" />
            </motion.div>

            <CardTitle
              className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50"
              data-oid="3o.nr3x"
            >
              Admin Access
            </CardTitle>
            <CardDescription
              className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1"
              data-oid="4vi64kw"
            >
              Authentication required for system management
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6" data-oid=".k9wttd">
            <AnimatePresence mode="wait" data-oid="i6:9par">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                  data-oid="7zze2c-wrap"
                >
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 text-xs font-semibold text-[rgb(var(--signal-fault))] bg-[rgb(var(--signal-fault)/0.08)] p-3.5 rounded-xl border border-[rgb(var(--signal-fault)/0.25)]"
                    data-oid="7zze2c-"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" data-oid="p4.fri1" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mfaFactor ? (
              <form
                onSubmit={handleMfaVerification}
                className="space-y-4"
                data-oid="admin-mfa-form"
              >
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/8">
                  <div className="flex items-start gap-2.5">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                    <div>
                      <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                        Verify your authenticator
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                        Enter the current code from{' '}
                        {mfaFactor.friendly_name || 'your authenticator app'}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-mfa-code"
                    className="ml-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400"
                  >
                    Verification code
                  </Label>
                  <Input
                    id="admin-mfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value.replace(/\s/g, ''))}
                    placeholder="123456"
                    className="h-11 rounded-lg border-stone-200 bg-stone-50 font-mono text-center text-lg tracking-[0.32em] dark:border-white/10 dark:bg-white/3"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !mfaCode.trim()}
                  className="mt-2 h-11 w-full rounded-lg bg-[#5a63df] font-extrabold text-white hover:bg-[#4d56ce] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                >
                  {loadingAction === 'mfa' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Verify and enter
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMfaFactor(null);
                    setMfaCode('');
                    setLoadingAction(null);
                    setIsLoggingIn(false);
                  }}
                  className="w-full text-center text-[11px] font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  Use a different sign-in method
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4" data-oid=".otl2sq">
                <div className="space-y-1.5" data-oid="qgk0:na">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 ml-1"
                    data-oid="zgivt-o"
                  >
                    Admin Email
                  </Label>
                  <div className="relative" data-oid="a6u.yjr">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ieltsai.pro"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-stone-50/50 dark:bg-white/3 border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus-visible:ring-stone-400/20 dark:focus-visible:ring-white/10 rounded-xl text-sm transition-all"
                      autoComplete="email"
                      data-oid="dpc2i50"
                    />

                    <Mail
                      className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                      data-oid="cg-_afw"
                    />
                  </div>
                </div>

                <div className="space-y-1.5" data-oid="pom2q.4">
                  <Label
                    htmlFor="password"
                    title="password"
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 ml-1"
                    data-oid="sryvhm3"
                  >
                    Access Password
                  </Label>
                  <div className="relative" data-oid="w5jcx07">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-stone-50/50 dark:bg-white/3 border-stone-200 dark:border-white/10 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus-visible:ring-stone-400/20 dark:focus-visible:ring-white/10 rounded-xl text-sm transition-all"
                      autoComplete="current-password"
                      data-oid="9g-e7lo"
                    />

                    <Lock
                      className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2"
                      data-oid="rjq794t"
                    />

                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200 transition-colors p-0.5 rounded"
                      onClick={() => setShowPassword(!showPassword)}
                      data-oid="5au2s18"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" data-oid="2t10rj8" />
                      ) : (
                        <Eye className="w-4 h-4" data-oid="q74h3-h" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim() || !password.trim()}
                  className="w-full h-11 bg-stone-900 hover:bg-stone-800 dark:bg-stone-50 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-extrabold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none mt-2"
                  data-oid="j74tubc"
                >
                  {loadingAction === 'password' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid="dljqh_v" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" data-oid=":5x2jor" />
                      Enter Command Center
                    </>
                  )}
                </Button>
              </form>
            )}

            {!mfaFactor && (
              <>
                <div className="relative py-0.5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-stone-200 dark:border-white/[0.07]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:bg-[#131315] dark:text-stone-500">
                      or
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="h-11 w-full rounded-lg border-stone-200 bg-white font-extrabold text-stone-800 hover:bg-stone-50 dark:border-white/10 dark:bg-[#131315] dark:text-stone-100 dark:hover:bg-white/5"
                >
                  {loadingAction === 'passkey' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="mr-2 h-4 w-4" />
                  )}
                  Use a passkey
                </Button>
              </>
            )}

            <div
              className="bg-stone-50 dark:bg-white/3 p-3.5 rounded-xl border border-stone-200/70 dark:border-white/6 text-center"
              data-oid="9_aed-3"
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 leading-relaxed"
                data-oid="dkysza9"
              >
                Authorized personnel only. All access attempts are logged & monitored.
              </p>
            </div>
          </CardContent>
        </Card>

        <p
          className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500 mt-6"
          data-oid="t2g-oaw"
        >
          © 2026 IELTS Ai Pro • Admin Instrument Panel
        </p>
      </motion.div>
    </div>
  );
}
