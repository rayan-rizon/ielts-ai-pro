import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  // Track if we are in the middle of a Google OAuth flow to prevent flickering
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(
    window.location.hash.includes('id_token=')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, checkIsAdmin, isAdmin, authCheckComplete } = useAuth();

  const [authMode, setAuthMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin'); // 'signin' or 'signup'
  const [isResending, setIsResending] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const [lockoutTime, setLockoutTime] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

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
            const dest = sessionStorage.getItem('auth_destination') || '/dashboard';
            sessionStorage.removeItem('auth_destination');
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
      if (isAdmin) navigate(createPageUrl('AdminPanel'));
      else navigate(createPageUrl('Dashboard'));
    }
  }, [user, authCheckComplete, isAdmin, navigate]);

  useEffect(() => {
    setAuthMode(location.pathname === '/signup' ? 'signup' : 'signin');
  }, [location.pathname]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
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

    setIsLoading(true);
    try {
      if (authMode === 'signin') {
        const data = await signIn(email, password);
        if (data) {
          trackAppEvent('signin_success', {
            method: 'email',
            path: location.pathname,
          });

          const isUserAdmin = await checkIsAdmin(data.id);
          const destination = isUserAdmin
            ? createPageUrl('AdminPanel')
            : location.state?.from?.pathname || createPageUrl('Dashboard');

          navigate(destination, { replace: true });
          return;
        }
        setError('Authentication failed. Please verify your email and password.');
      } else {
        const referralCode = localStorage.getItem('referral_code');
        const data = await signUp(email, password, username, referralCode);
        if (data?.session) {
          trackAppEvent('signup_completed', {
            method: 'email',
            path: location.pathname,
            has_referral: Boolean(referralCode),
          });

          navigate(createPageUrl('Dashboard'), { replace: true });
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
      setLockoutTime(() => {
        const newTime = Date.now() + 60000;
        return newTime;
      });
      const msg = (err?.message || 'Authentication failed. Please try again.').toLowerCase();
      if (msg.includes('email not confirmed')) {
        setError('Please confirm your email. Check your inbox or spam folder.');
      } else if (msg.includes('invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Error occurred. Please try again.');
      }

      trackAppEvent('auth_failed', {
        method: authMode === 'signup' ? 'signup_email' : 'signin_email',
        path: location.pathname,
        reason: msg,
      });
    } finally {
      setIsLoading(false);
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
    const destination = location.state?.from?.pathname || createPageUrl('Dashboard');
    sessionStorage.setItem('auth_destination', destination);

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
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  const isSignupMode = authMode === 'signup';

  return (
    <>
      <DocumentHead
        title={isSignupMode ? 'Create IELTS Account' : 'Sign In to IELTS Ai Pro'}
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
        className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-500"
        data-oid="14nvn2e"
      >
        {/* Premium Motion Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" data-oid="tvd0j8i">
          {/* Animated Mesh Orbs */}
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[10%] -left-[5%] w-[45%] h-[45%] bg-blue-500/10 blur-[100px] rounded-full"
            data-oid="3hs:b4w"
          />

          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-[15%] -right-[5%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full"
            data-oid="9gw-.8l"
          />

          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-400/5 blur-[80px] rounded-full"
            data-oid="4c3a284"
          />

          {/* Architectural Grid Pattern */}
          <div
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 px-1"
            data-oid="4_1h0bw"
          />

          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
            data-oid="coccni9"
          />
        </div>

        <div
          className="max-w-6xl w-full grid lg:grid-cols-5 gap-0 items-center relative z-10 glass-card-premium rounded-[2.5rem] border-white/30 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2),0_16px_32px_-8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden"
          data-oid=":-4q___"
        >
          {/* Left Panel: Feature Highlights (3/5 width) */}
          <AuthLeftPanel />

          {/* Right Panel: Auth Form (2/5 width) */}
          <div
            className="lg:col-span-2 p-8 lg:p-10 relative flex flex-col justify-center bg-white dark:bg-zinc-950/50"
            data-oid="d5v9mk6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-[340px] mx-auto"
              data-oid="uem-pj2"
            >
              {/* Navigation back */}
              <Link
                to={createPageUrl('Index')}
                className="inline-flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-blue-500 transition-all mb-6 group uppercase tracking-[0.2em]"
                data-oid="dh.ssa3"
              >
                <ArrowLeft
                  className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"
                  data-oid="w9_yl9q"
                />
                Return Home
              </Link>

              <div className="text-center lg:text-left mb-6" data-oid="30o1_of">
                <div
                  className="lg:hidden mx-auto mb-4 w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"
                  data-oid="6j7gtso"
                >
                  <Brain className="w-7 h-7 text-white" data-oid="n41hi1d" />
                </div>
                <h2
                  className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight"
                  data-oid="xnuv4c-"
                >
                  {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p
                  className="text-slate-500 dark:text-slate-400 mt-2 text-xs font-medium leading-relaxed"
                  data-oid="0i_qno6"
                >
                  {authMode === 'signin'
                    ? 'Sign in to access your personalized IELTS dashboard'
                    : 'Join IELTS Ai Pro and experience the future of learning'}
                </p>
              </div>

              <LayoutGroup data-oid="e4.lytt">
                <div className="space-y-6" data-oid="mo_ms5c">
                  <AnimatePresence mode="wait">
                    {!showVerification ? (
                      <motion.div
                        key="auth-form"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-6"
                      >
                        {/* Social Login */}
                        <Button
                          variant="outline"
                          className="w-full h-12 bg-secondary/50 hover:bg-secondary dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 border-border/50 dark:border-white/5 hover-lift rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                          disabled={isLoading}
                          onClick={handleGoogleAuth}
                          type="button"
                          data-oid=".i:d5y:"
                        >
                          <svg
                            className="w-5 h-5 flex-shrink-0"
                            viewBox="0 0 24 24"
                            data-oid="ajrjrer"
                          >
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
                            className="font-bold text-sm tracking-wide dark:text-zinc-200"
                            data-oid="-n2ge4o"
                          >
                            Continue with Google
                          </span>
                        </Button>

                        <div className="relative" data-oid="grajcf5">
                          <div className="absolute inset-0 flex items-center" data-oid="ot59rl:">
                            <Separator className="w-full bg-border/40" data-oid="5d_rny8" />
                          </div>
                          <div
                            className="relative flex justify-center text-xs uppercase"
                            data-oid="k19y48v"
                          >
                            <span
                              className="bg-white dark:bg-zinc-950 px-4 font-black text-muted-foreground tracking-[0.25em] text-[10px] whitespace-nowrap transition-colors"
                              data-oid="rtcp3x_"
                            >
                              Secure Email Login
                            </span>
                          </div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4" data-oid="c8_-x0z">
                          <AnimatePresence mode="wait" data-oid="-_crrvk">
                            {error && (
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                role="alert"
                                className="p-3 rounded-xl border flex items-start gap-3 text-xs font-medium leading-relaxed bg-destructive/10 text-destructive border-destructive/20"
                                data-oid="g-p0fth"
                              >
                                <AlertCircle
                                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                                  data-oid="m1mz93p"
                                />
                                <span data-oid="wg7u86l">{error}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-4" data-oid=".0y:ls2">
                            {authMode === 'signup' && (
                              <motion.div layout className="space-y-2" data-oid="zjc-3mz">
                                <Label
                                  htmlFor="username"
                                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
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
                                      'pl-11 h-12 bg-secondary/30 dark:bg-zinc-900/50 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 group-hover:bg-secondary/50 dark:group-hover:bg-zinc-900/80 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500',
                                      touched.username &&
                                        fieldErrors.username &&
                                        'border-destructive focus:ring-destructive/10'
                                    )}
                                    data-oid="nx6_::y"
                                  />

                                  <UserIcon
                                    className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors"
                                    data-oid="gg:xg-t"
                                  />
                                </div>
                                {touched.username && fieldErrors.username && (
                                  <p
                                    role="alert"
                                    className="text-[10px] text-destructive font-bold ml-1"
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
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1"
                                data-oid="7f3u2oz"
                              >
                                Email Address
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
                                    'pl-11 h-12 bg-secondary/30 dark:bg-zinc-900/50 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 group-hover:bg-secondary/50 dark:group-hover:bg-zinc-900/80 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500',
                                    touched.email &&
                                      fieldErrors.email &&
                                      'border-destructive focus:ring-destructive/10'
                                  )}
                                  data-oid="bkj3_um"
                                />

                                <Mail
                                  className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors"
                                  data-oid="awn_i.l"
                                />
                              </div>
                              {touched.email && fieldErrors.email && (
                                <p
                                  role="alert"
                                  className="text-[10px] text-destructive font-bold ml-1"
                                  data-oid="ld4hbc-"
                                >
                                  {fieldErrors.email}
                                </p>
                              )}
                            </motion.div>

                            <motion.div layout className="space-y-2" data-oid="zo90:rt">
                              <div
                                className="flex justify-between items-center ml-1"
                                data-oid="8q8u37o"
                              >
                                <Label
                                  htmlFor="password"
                                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                  data-oid="ngen74_"
                                >
                                  Password
                                </Label>
                                {authMode === 'signin' && (
                                  <Link
                                    to={createPageUrl('ForgotPassword')}
                                    className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
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
                                  className="pl-11 pr-11 h-12 bg-secondary/30 dark:bg-zinc-900/50 border-border/50 dark:border-white/10 rounded-xl focus:ring-primary/20 group-hover:bg-secondary/50 dark:group-hover:bg-zinc-900/80 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-500"
                                  data-oid="cr0:l26"
                                />

                                <Lock
                                  className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors"
                                  data-oid="9ccs3h2"
                                />

                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-md"
                                  data-oid="2044ew0"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4" data-oid="3l2xv1n" />
                                  ) : (
                                    <Eye className="w-4 h-4" data-oid="2vpgktn" />
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
                              <div className="flex gap-1.5 h-1" data-oid="2v-9kvj">
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'h-full flex-1 rounded-full transition-all duration-500',
                                      passwordStrength && i <= passwordStrength.score
                                        ? passwordStrength.color
                                        : 'bg-secondary'
                                    )}
                                    data-oid="o15y.:6"
                                  />
                                ))}
                              </div>
                              <div
                                className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60"
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

                          <motion.div layout className="pt-2" data-oid="y:9z1-7">
                            <Button
                              type="submit"
                              disabled={
                                isLoading ||
                                !email.trim() ||
                                !password.trim() ||
                                (authMode === 'signup' && !username.trim())
                              }
                              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.1em] text-sm rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover-lift flex items-center justify-center group"
                              data-oid="ezeqau0"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2
                                    className="w-4 h-4 mr-2 animate-spin"
                                    data-oid=":9jw-bw"
                                  />
                                  <span data-oid="ayu4f3p">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <span data-oid="x4eyohv">
                                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                                  </span>
                                  <ChevronRight
                                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                                    data-oid="xz_.pyg"
                                  />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </form>

                        <motion.div layout className="text-center pt-2" data-oid="l3-97_j">
                          <p
                            className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest"
                            data-oid="mrd9y1a"
                          >
                            {authMode === 'signin'
                              ? "Don't have an account?"
                              : 'Already have an account?'}
                            <button
                              onClick={toggleAuthMode}
                              className="ml-2 text-primary hover:text-primary/80 transition-colors"
                              data-oid="skov2p2"
                            >
                              {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
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
