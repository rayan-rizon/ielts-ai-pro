import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  Globe,
  Zap,
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
import { cn } from '@/lib/utils';
import { User } from '@/features/auth/services/User';
import DocumentHead from '@/components/shared/DocumentHead';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

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
  const { user, signIn, signUp, checkIsAdmin, isAdmin, authCheckComplete } = useAuth();

  const [authMode, setAuthMode] = useState(location.pathname === '/signup' ? 'signup' : 'signin'); // 'signin' or 'signup'
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
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
    setCanResend(false);

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
          setFailedAttempts(0);
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
          navigate(createPageUrl('Dashboard'), { replace: true });
        } else {
          setInfo('Verify your email with the link we just sent to your inbox.');
          setCanResend(true);
        }
      }
    } catch (err) {
      console.error('Authentication failed:', err);
      setFailedAttempts((prev) => {
        const newCount = prev + 1;
        if (newCount >= 5) setLockoutTime(Date.now() + 60000);
        return newCount;
      });
      const msg = (err?.message || 'Authentication failed. Please try again.').toLowerCase();
      if (msg.includes('email not confirmed')) {
        setError('Please confirm your email. Check your inbox or spam folder.');
        setCanResend(true);
      } else if (msg.includes('invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Error occurred. Please try again.');
      }
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
    setCanResend(false);
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
    } catch (e) {
      setError(e.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  // Full-page loader during initial Google callback, auth check, or if user is already logged in (pending redirect)
  if (isOAuthProcessing || !authCheckComplete || user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DocumentHead
        title="Login or Sign Up"
        description="Sign in or create a free account to start your AI-powered IELTS preparation journey. Get instant AI feedback on writing and speaking."
        canonicalUrl="https://www.ieltsai.pro/login"
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

          {/* Noise Overlay for Texture */}
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
          <motion.div
            className="hidden lg:flex flex-col h-full bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-12 lg:col-span-3 justify-between relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            data-oid="w.inh9t"
          >
            {/* Decorative Glows */}
            <div
              className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"
              data-oid="-51oith"
            />

            <div
              className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full"
              data-oid="-w.wy3l"
            />

            <div className="space-y-10 relative z-20" data-oid="jn2yriz">
              {/* Brand Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-4"
                data-oid="to5qz2."
              >
                <div
                  className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 border border-white/20"
                  data-oid="plzs241"
                >
                  <Brain className="w-7 h-7 text-white" data-oid="9ctxr5g" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight" data-oid="zj6b:92">
                  IELTS{' '}
                  <span className="text-blue-400" data-oid="u2n1x5l">
                    Ai
                  </span>{' '}
                  Pro
                </span>
              </motion.div>

              <div className="space-y-4" data-oid="nym0p1b">
                <h1
                  className="text-5xl font-black tracking-tight text-white leading-[1.1]"
                  data-oid="f7crqhf"
                >
                  Master the IELTS with <br data-oid="-.zy6qi" />
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 animate-gradient text-glow-indigo"
                    data-oid="oorm_e-"
                  >
                    Advanced AI Insights
                  </span>
                </h1>
                <p
                  className="text-lg text-slate-300/90 max-w-md leading-relaxed font-medium"
                  data-oid="goh17um"
                >
                  The most advanced AI preparation platform. Get band scores, feedback, and study
                  plans tailored for your success.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5" data-oid="praqhgv">
                {[
                  {
                    icon: Award,
                    title: 'Band 8.5+',
                    desc: 'Targeted strategies',
                    color: 'from-blue-500/10 to-blue-600/5',
                    iconColor: 'text-blue-400',
                  },
                  {
                    icon: Zap,
                    title: 'Instant Feedback',
                    desc: 'AI-powered scoring',
                    color: 'from-amber-500/10 to-amber-600/5',
                    iconColor: 'text-amber-400',
                  },
                  {
                    icon: Globe,
                    title: '50k+ Students',
                    desc: 'Verified success',
                    color: 'from-emerald-500/10 to-emerald-600/5',
                    iconColor: 'text-emerald-400',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Official Tests',
                    desc: 'Cambridge material',
                    color: 'from-indigo-500/10 to-indigo-600/5',
                    iconColor: 'text-indigo-400',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={cn(
                      'flex items-start space-x-3 p-5 rounded-2xl bg-gradient-to-br border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-default',
                      item.color
                    )}
                    data-oid="mj8rk1x"
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors',
                        item.iconColor
                      )}
                      data-oid="6941c7m"
                    >
                      <item.icon
                        className="w-5 h-5 group-hover:scale-110 transition-transform"
                        data-oid="xjknbep"
                      />
                    </div>
                    <div data-oid="0oy8vug">
                      <p className="text-white font-bold text-sm tracking-wide" data-oid="_bvg:08">
                        {item.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5" data-oid="sipdz9e">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social Proof Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center space-x-6 pt-8 border-t border-white/10"
              data-oid="tr9c9_g"
            >
              <div className="flex -space-x-3" data-oid="agl3x4_">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 20}`}
                    alt="student avatar"
                    className="w-11 h-11 rounded-full border-2 border-[#1e1b4b] ring-2 ring-blue-500/20 shadow-xl"
                    data-oid="gegwbmg"
                  />
                ))}
                <div
                  className="w-11 h-11 rounded-full border-2 border-[#1e1b4b] bg-blue-600 flex items-center justify-center text-[10px] font-black text-white ring-2 ring-blue-500/20"
                  data-oid=".u1fzgn"
                >
                  +15k
                </div>
              </div>
              <div className="space-y-1" data-oid="1l1ze0:">
                <p className="text-white font-bold text-sm tracking-wide" data-oid="jffu934">
                  Trusted worldwide
                </p>
                <div
                  className="flex items-center text-slate-400 text-[11px] font-semibold uppercase tracking-widest"
                  data-oid="_dowc.j"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    data-oid="amj19sa"
                  />
                  Live:{' '}
                  <span className="text-white ml-1" data-oid="jff19ew">
                    1,248 active{' '}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

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
                  {/* Social Login */}
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-secondary/50 hover:bg-secondary dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80 border-border/50 dark:border-white/5 hover-lift rounded-xl flex items-center justify-center gap-3 transition-all duration-300"
                    disabled={isLoading}
                    onClick={handleGoogleAuth}
                    type="button"
                    data-oid=".i:d5y:"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" data-oid="ajrjrer">
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
                      {(error || info) && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className={cn(
                            'p-3 rounded-xl border flex items-start gap-3 text-xs font-medium leading-relaxed',
                            error
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          )}
                          data-oid="g-p0fth"
                        >
                          {error ? (
                            <AlertCircle
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              data-oid="m1mz93p"
                            />
                          ) : (
                            <ShieldCheck
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              data-oid="18afadk"
                            />
                          )}
                          <span data-oid="wg7u86l">{error || info}</span>
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
                                if (touched.username) validateOnChange('username', e.target.value);
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
                            className="text-[10px] text-destructive font-bold ml-1"
                            data-oid="ld4hbc-"
                          >
                            {fieldErrors.email}
                          </p>
                        )}
                      </motion.div>

                      <motion.div layout className="space-y-2" data-oid="zo90:rt">
                        <div className="flex justify-between items-center ml-1" data-oid="8q8u37o">
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
                                i <= passwordStrength.score
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
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid=":9jw-bw" />
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

                  {canResend && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                      data-oid="p8cl6:v"
                    >
                      <button
                        onClick={handleResendConfirmation}
                        disabled={isResending}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center justify-center mx-auto gap-2"
                        data-oid="cug.m1v"
                      >
                        {isResending && (
                          <Loader2 className="w-3 h-3 animate-spin" data-oid="v2_q9s0" />
                        )}
                        Resend confirmation email
                      </button>
                    </motion.div>
                  )}
                </div>
              </LayoutGroup>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
