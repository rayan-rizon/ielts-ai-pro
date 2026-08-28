import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { Logo } from '@/components/shared/Logo';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  validateField,
  emailSchema,
  usernameSchema,
  getPasswordStrength,
  signUpSchema,
} from '@/lib/validations';
import { cn } from '@/lib/cn';
import { User } from '@/features/auth/services/User';
import DocumentHead from '@/components/shared/DocumentHead';
import { AuthLeftPanel } from '@/features/auth/components/AuthLeftPanel';
import { VerificationView } from '@/features/auth/components/VerificationView';
import { trackAppEvent } from '@/lib/tracking';
import { clearAdminAccess } from '@/features/auth/utils/adminAccess';
import {
  getAuthRateLimitWaitSeconds,
  isAuthRateLimitError,
} from '@/features/auth/utils/authRateLimit';
import {
  clearRequestedDestination,
  getRequestedDestination,
  saveRequestedDestination,
} from '@/features/auth/utils/authDestination';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  // Track if we are in the middle of a Google OAuth flow to prevent flickering
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(
    window.location.hash.includes('id_token=')
  );
  const [isLoading, setIsLoading] = useState(false);
  const emailAuthInFlight = useRef(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, authCheckComplete } = useAuth();

  const [authMode, setAuthMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin'); // 'signin' or 'signup'
  const [isResending, setIsResending] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const [lockoutTime, setLockoutTime] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    // The standard learner login must never inherit elevated UI intent from
    // an earlier admin flow in the same browser tab.
    clearAdminAccess();
  }, []);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
      // Clear ref from URL to avoid confusion while staying on current path
      window.history.replaceState({}, '', location.pathname);
    }

    // Check if we just returned from Google OAuth redirect with fragments
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      setIsLoading(true);
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');

      // Clean up the URL hash to avoid token leaking
      window.history.replaceState(null, null, window.location.pathname + window.location.search);

      if (idToken) {
        const nonce = sessionStorage.getItem('google_oauth_nonce');

        User.signInWithGoogle(idToken, nonce)
          .then(() => {
            const dest = getRequestedDestination(null, '/dashboard');
            clearRequestedDestination();
            sessionStorage.removeItem('google_oauth_nonce');
            navigate(dest, { replace: true });
          })
          .catch((err) => {
            setError(err.message || 'Google sign in failed');
            setIsOAuthProcessing(false);
            setIsLoading(false);
          });
      } else {
        setIsOAuthProcessing(false);
        setIsLoading(false);
      }
    } else if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorMsg = params.get('error');
      setError(`Google sign in error: ${errorMsg}`);
      setIsOAuthProcessing(false);
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }, [searchParams, location.pathname, navigate]);
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const validateOnChange = (field, value) => {
    let result = { valid: true, error: null };
    if (field === 'email') result = validateField(emailSchema, value);
    else if (field === 'username' && authMode === 'signup')
      result = validateField(usernameSchema, value);
    setFieldErrors((prev) => ({ ...prev, [field]: result.error }));
  };

  const handleBlur = (field) => {
    const value = field === 'email' ? email : field === 'username' ? username : '';
    // Only mark as touched if the field has some content.
    // This prevents "Required" errors from popping up just because a user clicked in and out.
    if (value.trim() !== '') {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateOnChange(field, value);
    }
  };

  const passwordStrength = authMode === 'signup' ? getPasswordStrength(password) : null;

  useEffect(() => {
    if (user && authCheckComplete) {
      const destination = getRequestedDestination(location);
      clearRequestedDestination();
      navigate(destination, { replace: true });
    }
  }, [user, authCheckComplete, location, navigate]);

  useEffect(() => {
    setAuthMode(location.pathname === '/signup' ? 'signup' : 'signin');
  }, [location.pathname]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (emailAuthInFlight.current) return;
    if (lockoutTime && Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${remaining} seconds.`);
      return;
    }
    setTouched({ email: true, password: true, username: true });
    setError('');
    setInfo('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    if (authMode === 'signup') {
      if (!username.trim()) {
        setError('Please enter a username.');
        return;
      }

      const passwordValidation = validateField(signUpSchema.shape.password, password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error);
        return;
      }
    }

    emailAuthInFlight.current = true;
    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        clearAdminAccess();
        const data = await signIn(email, password);
        if (data) {
          trackAppEvent('signin_success', {
            method: 'email',
            path: location.pathname,
          });

          const destination = getRequestedDestination(location);

          clearRequestedDestination();
          navigate(destination, { replace: true });
          return;
        }
        setError('Authentication failed. Please verify your email and password.');
      } else {
        const requestedDestination = getRequestedDestination(location);
        saveRequestedDestination(requestedDestination);
        const referralCode = localStorage.getItem('referral_code');
        const data = await signUp(email, password, username, referralCode);
        if (data?.session) {
          // The registration itself is reported from User.me(), at the single
          // point a new profile row is created, so that Google OAuth signups
          // are counted too. Firing it here as well would double-count.
          clearRequestedDestination();
          navigate(requestedDestination, { replace: true });
        } else {
          trackAppEvent('signup_verification_sent', {
            method: 'email',
            path: location.pathname,
            has_referral: Boolean(referralCode),
          });

          setInfo('Verify your email with the link we just sent to your inbox.');
          setShowVerification(true);
        }
      }
    } catch (err) {
      console.error('Authentication failed:', err);
      const msg = (err?.message || 'Authentication failed. Please try again.').toLowerCase();
      if (isAuthRateLimitError(err)) {
        const waitSeconds = getAuthRateLimitWaitSeconds(err);
        setLockoutTime(Date.now() + waitSeconds * 1000);
        setError(`Too many requests. Please wait ${waitSeconds} seconds before trying again.`);
      } else if (msg.includes('email not confirmed')) {
        setLockoutTime(null);
        setError('Please confirm your email. Check your inbox or spam folder.');
      } else if (msg.includes('invalid login credentials')) {
        setLockoutTime(null);
        setError('Invalid email or password. Please try again.');
      } else {
        setLockoutTime(null);
        setError(err.message || 'Error occurred. Please try again.');
      }

      trackAppEvent('auth_failed', {
        method: authMode === 'signup' ? 'signup_email' : 'signin_email',
        path: location.pathname,
        reason: msg,
      });
    } finally {
      setIsLoading(false);
      emailAuthInFlight.current = false;
    }
  };

  const handleGoogleAuth = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID is missing or misconfigured in environment variables.');
      return;
    }

    // Setup for manual redirect flow to avoid popup and force English
    const redirectUri = `${window.location.origin}/login`;

    // Generate a simple nonce
    const rawNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Hash the nonce (SHA-256) as expected by Supabase for ID tokens
    const encoder = new TextEncoder();
    const data = encoder.encode(rawNonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Save RAW nonce to session storage (Supabase needs to verify against this)
    sessionStorage.setItem('google_oauth_nonce', rawNonce);

    // Save destination so we can redirect appropriately after login
    const destination = getRequestedDestination(location);
    saveRequestedDestination(destination);

    trackAppEvent('signin_started', {
      method: 'google',
      path: location.pathname,
      auth_mode: authMode,
    });

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'id_token');
    // Request OpenID scopes required by Supabase auth mapping
    url.searchParams.append('scope', 'email profile openid');
    url.searchParams.append('nonce', hashedNonce); // Send fully hashed nonce to Google
    url.searchParams.append('hl', 'en'); // Force English language rendering
    url.searchParams.append('prompt', 'select_account');

    // Redirect current tab to Google Consent UI directly
    window.location.href = url.toString();
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setError('');
    setInfo('');
    setShowVerification(false);
    setUsername('');
    setFieldErrors({});
    setTouched({});
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (resendError) throw resendError;
      setInfo('Confirmation email resent. Please check your inbox.');
      setResendTimer(60);
    } catch (e) {
      setError(e.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  // Full-page loader during:
  // 1. Google OAuth callback processing
  // 2. Initial Supabase session check (loading = true, guaranteed to resolve via finally)
  // 3. User is already authenticated and pending redirect
  //
  // We use `loading` (not `!authCheckComplete`) as the primary gate because
  // `loading` is always set to false in getUser()'s finally block, whereas
  // `authCheckComplete` can remain false if getSession() returns an error.
  if (isOAuthProcessing || loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb] dark:bg-[#070913]">
        <Loader2 className="h-9 w-9 animate-spin text-slate-400" />
      </div>
    );
  }

  const isSignupMode = authMode === 'signup';

  return (
    <>
      <DocumentHead
        title={isSignupMode ? 'Sign Up' : 'Login'}
        description={
          isSignupMode
            ? 'Create your IELTS Ai Pro account to access AI-powered IELTS practice, writing and speaking feedback, and progress analytics.'
            : 'Sign in to your IELTS Ai Pro account to continue your personalized IELTS practice and band score improvement plan.'
        }
        canonicalUrl={
          isSignupMode ? 'https://www.ieltsai.pro/signup' : 'https://www.ieltsai.pro/login'
        }
        noIndex={true}
        noFollow={true}
        data-oid="8px.i4k"
      />

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8fb] p-4 font-sans transition-colors duration-500 selection:bg-slate-400/20 dark:bg-[#070913]"
        data-oid="14nvn2e"
      >
        {/* Quiet instrument-panel backdrop — the same dot grid the admin
            console and dashboard use, instead of blurred mesh orbs and a
            grain texture that appear nowhere else in the app. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          data-oid="tvd0j8i"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.25)_1px,transparent_0)] opacity-60 bg-size-[22px_22px] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.06)_1px,transparent_0)] dark:opacity-30" />
        </div>

        <div
          className="relative z-10 grid w-full max-w-5xl grid-cols-1 items-stretch gap-0 overflow-hidden rounded-2xl border border-[#e4e2f0] bg-white shadow-xl dark:border-white/10 dark:bg-[#131315] lg:grid-cols-5"
          data-oid=":-4q___"
        >
          {/* Left Panel: Feature Highlights (3/5 width) */}
          <AuthLeftPanel />

          {/* Right Panel: Auth Form (2/5 width) */}
          <div
            className="relative flex flex-col justify-center border-l border-[#e4e2f0] p-6 dark:border-white/10 lg:col-span-2 lg:p-8"
            data-oid="d5v9mk6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto w-full max-w-[300px]"
              data-oid="uem-pj2"
            >
              {/* Navigation back */}
              <Link
                to={createPageUrl('Index')}
                className="group mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-slate-900 dark:text-slate-500 dark:hover:text-white"
                data-oid="dh.ssa3"
              >
                <ArrowLeft
                  className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                  data-oid="w9_yl9q"
                />
                Return home
              </Link>

              <div className="mb-5 text-center lg:text-left" data-oid="30o1_of">
                <div className="mb-4 flex justify-center lg:hidden" data-oid="6j7gtso">
                  <Logo iconOnly={false} size="lg" />
                </div>
                <h2
                  className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-50"
                  data-oid="xnuv4c-"
                >
                  {authMode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p
                  className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400"
                  data-oid="0i_qno6"
                >
                  {authMode === 'signin'
                    ? 'Sign in to access your personalized IELTS dashboard'
                    : 'Join IELTS Ai Pro and experience the future of learning'}
                </p>
              </div>

              <LayoutGroup data-oid="e4.lytt">
                <div className="space-y-4" data-oid="mo_ms5c">
                  <AnimatePresence mode="wait">
                    {!showVerification ? (
                      <motion.div
                        key="auth-form"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        {/* Social Login */}
                        <Button
                          variant="outline"
                          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-[#e4e2f0] bg-white transition-colors duration-200 hover:bg-[#f7f6fd] active:scale-[0.98] dark:border-white/10 dark:bg-[#131315] dark:hover:bg-white/6"
                          disabled={isLoading}
                          onClick={handleGoogleAuth}
                          type="button"
                          data-oid=".i:d5y:"
                        >
                          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" data-oid="ajrjrer">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              data-oid="1dxrfft"
                            />

                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              data-oid="614zk34"
                            />

                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              data-oid="-vptn5y"
                            />

                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              data-oid="wrmm2r2"
                            />
                          </svg>
                          <span
                            className="text-sm font-bold tracking-wide text-slate-700 dark:text-slate-200"
                            data-oid="-n2ge4o"
                          >
                            Continue with Google
                          </span>
                        </Button>

                        <div className="relative" data-oid="grajcf5">
                          <div className="absolute inset-0 flex items-center" data-oid="ot59rl:">
                            <Separator
                              className="w-full bg-[#e4e2f0] dark:bg-white/10"
                              data-oid="5d_rny8"
                            />
                          </div>
                          <div className="relative flex justify-center" data-oid="k19y48v">
                            <span
                              className="whitespace-nowrap bg-white px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors dark:bg-[#131315] dark:text-slate-500"
                              data-oid="rtcp3x_"
                            >
                              Or continue with email
                            </span>
                          </div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-3" data-oid="c8_-x0z">
                          <AnimatePresence mode="wait" data-oid="-_crrvk">
                            {error && (
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                role="alert"
                                className="flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs font-medium leading-relaxed text-rose-900 dark:border-rose-800/30 dark:bg-rose-500/8 dark:text-rose-100"
                                data-oid="g-p0fth"
                              >
                                <AlertCircle
                                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400"
                                  data-oid="m1mz93p"
                                />
                                <span data-oid="wg7u86l">{error}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-3" data-oid=".0y:ls2">
                            {authMode === 'signup' && (
                              <motion.div layout className="space-y-1.5" data-oid="zjc-3mz">
                                <Label
                                  htmlFor="username"
                                  className="ml-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                                  data-oid="yx-bcrt"
                                >
                                  Username
                                </Label>
                                <div className="relative group" data-oid="qqv87pk">
                                  <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => {
                                      setUsername(e.target.value);
                                      if (touched.username)
                                        validateOnChange('username', e.target.value);
                                    }}
                                    onBlur={() => handleBlur('username')}
                                    className={cn(
                                      'h-10 rounded-lg border border-[#e4e2f0] bg-white pl-10 transition-colors duration-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10 dark:border-white/10 dark:bg-[#131315] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500',
                                      touched.username &&
                                        fieldErrors.username &&
                                        'border-rose-300 focus:ring-rose-500/10 dark:border-rose-800/60'
                                    )}
                                    data-oid="nx6_::y"
                                  />

                                  <UserIcon
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900 dark:text-slate-500 dark:group-focus-within:text-white"
                                    data-oid="gg:xg-t"
                                  />
                                </div>
                                {touched.username && fieldErrors.username && (
                                  <p
                                    role="alert"
                                    className="ml-1 text-[10px] font-bold text-rose-600 dark:text-rose-400"
                                    data-oid="u5vdrl2"
                                  >
                                    {fieldErrors.username}
                                  </p>
                                )}
                              </motion.div>
                            )}

                            <motion.div layout className="space-y-2" data-oid="9uyjebf">
                              <Label
                                htmlFor="email"
                                className="ml-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                                data-oid="7f3u2oz"
                              >
                                Email address
                              </Label>
                              <div className="relative group" data-oid="1x4vykk">
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="Enter your email address"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (touched.email) validateOnChange('email', e.target.value);
                                  }}
                                  onBlur={() => handleBlur('email')}
                                  className={cn(
                                    'h-10 rounded-lg border border-[#e4e2f0] bg-white pl-10 transition-colors duration-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10 dark:border-white/10 dark:bg-[#131315] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500',
                                    touched.email &&
                                      fieldErrors.email &&
                                      'border-rose-300 focus:ring-rose-500/10 dark:border-rose-800/60'
                                  )}
                                  data-oid="bkj3_um"
                                />

                                <Mail
                                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900 dark:text-slate-500 dark:group-focus-within:text-white"
                                  data-oid="awn_i.l"
                                />
                              </div>
                              {touched.email && fieldErrors.email && (
                                <p
                                  role="alert"
                                  className="ml-1 text-[10px] font-bold text-rose-600 dark:text-rose-400"
                                  data-oid="ld4hbc-"
                                >
                                  {fieldErrors.email}
                                </p>
                              )}
                            </motion.div>

                            <motion.div layout className="space-y-2" data-oid="zo90:rt">
                              <div
                                className="ml-1 flex items-center justify-between"
                                data-oid="8q8u37o"
                              >
                                <Label
                                  htmlFor="password"
                                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                                  data-oid="ngen74_"
                                >
                                  Password
                                </Label>
                                {authMode === 'signin' && (
                                  <Link
                                    to={createPageUrl('ForgotPassword')}
                                    className="text-[10px] font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    data-oid="3dw52e7"
                                  >
                                    Forgot?
                                  </Link>
                                )}
                              </div>
                              <div className="relative group" data-oid="d3ru84t">
                                <Input
                                  id="password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Enter your password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="h-10 rounded-lg border border-[#e4e2f0] bg-white pl-10 pr-10 transition-colors duration-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10 dark:border-white/10 dark:bg-[#131315] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
                                  data-oid="cr0:l26"
                                />

                                <Lock
                                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-slate-900 dark:text-slate-500 dark:group-focus-within:text-white"
                                  data-oid="9ccs3h2"
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400/30 dark:text-slate-500 dark:hover:text-white"
                                  data-oid="2044ew0"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" data-oid="3l2xv1n" />
                                  ) : (
                                    <Eye className="h-4 w-4" data-oid="2vpgktn" />
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          </div>

                          {authMode === 'signup' && password && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2 px-1 pt-1"
                              data-oid="kdu_tyw"
                            >
                              <div className="flex h-1 gap-1.5" data-oid="2v-9kvj">
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'h-full flex-1 rounded-full transition-all duration-500',
                                      passwordStrength && i <= passwordStrength.score
                                        ? passwordStrength.color
                                        : 'bg-[#f4f3fb] dark:bg-white/[0.07]'
                                    )}
                                    data-oid="o15y.:6"
                                  />
                                ))}
                              </div>
                              <div
                                className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500"
                                data-oid="eqyk5kc"
                              >
                                {passwordStrength && (
                                  <span data-oid="-prhga-">
                                    Strength:{' '}
                                    <span
                                      className={cn(
                                        'inline-block',
                                        passwordStrength.color.replace('bg-', 'text-')
                                      )}
                                      data-oid="w6nushz"
                                    >
                                      {passwordStrength.label}
                                    </span>
                                  </span>
                                )}
                                <span data-oid="1sld4k8">8+ chars minimum</span>
                              </div>
                            </motion.div>
                          )}

                          <motion.div layout className="pt-1" data-oid="y:9z1-7">
                            <Button
                              type="submit"
                              disabled={isLoading}
                              className="group flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white transition-colors duration-200 hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                              data-oid="ezeqau0"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2
                                    className="mr-2 h-4 w-4 animate-spin"
                                    data-oid=":9jw-bw"
                                  />
                                  <span data-oid="ayu4f3p">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <span data-oid="x4eyohv">
                                    {authMode === 'signin' ? 'Sign in' : 'Create account'}
                                  </span>
                                  <ChevronRight
                                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                    data-oid="xz_.pyg"
                                  />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </form>

                        <motion.div layout className="pt-1 text-center" data-oid="l3-97_j">
                          <p
                            className="text-[12px] font-medium text-slate-500 dark:text-slate-400"
                            data-oid="mrd9y1a"
                          >
                            {authMode === 'signin'
                              ? "Don't have an account?"
                              : 'Already have an account?'}
                            <button
                              onClick={toggleAuthMode}
                              className="ml-1.5 font-bold text-slate-900 transition-colors hover:text-slate-600 dark:text-white dark:hover:text-slate-300"
                              data-oid="skov2p2"
                            >
                              {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                          </p>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <VerificationView
                        email={email}
                        onResend={handleResendConfirmation}
                        onEdit={() => {
                          setShowVerification(false);
                          setInfo('');
                          setError('');
                        }}
                        onBackToSignIn={toggleAuthMode}
                        isResending={isResending}
                        info={info}
                        resendTimer={resendTimer}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </LayoutGroup>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
