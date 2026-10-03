import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User } from '@/features/auth/services/User';
import { signUpSchema, validateField } from '@/lib/validations';
import DocumentHead from '@/components/shared/DocumentHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PANEL, MUTED, WELL, MICRO } from '@/features/dashboard/components/primitives';
import {
  clearRequestedDestination,
  saveRequestedDestination,
} from '@/features/auth/utils/authDestination';
import { clearAdminAccess } from '@/features/auth/utils/adminAccess';
import InstitutionAuthIntro from '../components/InstitutionAuthIntro';
import InstitutionPublicLayout from '../components/InstitutionPublicLayout';
import { institutionDestination } from '../services/entry';
import { institutionInvitationRequest } from '../services/institutions';

export default function InstitutionLogin() {
  const { user, loading, authCheckComplete, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const recovery = params.get('recovery') === '1';
  const destination = institutionDestination(location);
  const token = destination.startsWith('/institution/accept?')
    ? new URLSearchParams(destination.split('?')[1]).get('token')
    : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('signin');
  const [invite, setInvite] = useState(null);
  const [checking, setChecking] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    clearAdminAccess();
  }, []);
  useEffect(() => {
    setMode('signin');
    setPassword('');
    setConfirmation('');
    setError('');
    setInfo('');
  }, [location.key]);
  useEffect(() => {
    if (user && authCheckComplete && !recovery) {
      clearRequestedDestination();
      navigate(destination, { replace: true });
    }
  }, [user, authCheckComplete, recovery, destination, navigate]);
  useEffect(() => {
    setInvite(null);
    if (!token || recovery || user) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    institutionInvitationRequest('invitation_info', { token })
      .then((details) => {
        if (!cancelled) {
          setInvite(details);
          setEmail(details.email);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, recovery, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    setError('');
    setInfo('');
    if (mode === 'setup' || recovery) {
      const validation = validateField(signUpSchema.shape.password, password);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      if (password.length > 128) {
        setError('Use a password with at most 128 characters.');
        return;
      }
      if (password !== confirmation) {
        setError('Passwords do not match.');
        return;
      }
    }
    inFlight.current = true;
    setBusy(true);
    try {
      if (recovery) {
        if (!user) throw new Error('This reset link has expired. Request a new link.');
        await User.updatePassword(password);
        clearRequestedDestination();
        navigate(destination, { replace: true });
      } else if (mode === 'forgot') {
        saveRequestedDestination(destination, { crossTab: true });
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/institution/login?recovery=1`,
        });
        if (resetError) throw resetError;
        setInfo(
          'If this email has an account, a password reset link is on its way. Check your inbox.'
        );
      } else {
        let recipient = email.trim();
        if (mode === 'setup') {
          const result = await institutionInvitationRequest('invitation_setup', {
            token,
            password,
          });
          if (result.existing_account) {
            setMode('signin');
            setPassword('');
            setConfirmation('');
            setInfo(
              'Your invited email already has an account. Sign in with its password, or use Forgot password.'
            );
            return;
          }
          recipient = result.email;
        }
        saveRequestedDestination(destination);
        const signedIn = await signIn(recipient, password);
        if (!signedIn) throw new Error('Unable to sign in. Please check your email and password.');
        clearRequestedDestination();
        navigate(destination, { replace: true });
      }
    } catch (e) {
      setError(e.message || 'Unable to continue. Please try again.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const changeMode = (next) => {
    setMode(next);
    setPassword('');
    setConfirmation('');
    setError('');
    setInfo('');
  };
  const heading = recovery
    ? 'Set a new password'
    : mode === 'setup'
      ? 'Set up your invited account'
      : mode === 'forgot'
        ? 'Reset institution password'
        : 'Institution sign in';

  return (
    <InstitutionPublicLayout>
      <DocumentHead
        title={heading}
        description="Sign in to your approved institution panel or apply for institution access."
        noIndex
        noFollow
      />
      <div className={`${PANEL} grid overflow-hidden rounded-2xl lg:grid-cols-5`}>
        <InstitutionAuthIntro />
        <section className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-2">
          <div>
            <p className={`${MICRO} ${MUTED} mb-2`}>Administrative Console</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {heading}
            </h1>
            <p className={`${MUTED} mt-2 text-xs leading-relaxed`}>
              {recovery
                ? 'Choose a password for your institution account.'
                : mode === 'setup'
                  ? `You’ve been invited to ${invite?.institution_name || 'an institution'}. Set your password to continue.`
                  : mode === 'forgot'
                    ? 'Enter your invited email address to receive a reset link.'
                    : 'For approved institutions. Use the email address on your admin invitation.'}
            </p>
            {loading || checking || (user && !recovery) ? (
              <div role="status" className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#5a63df]" />
                <span className="sr-only">Loading</span>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-5">
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] p-3 text-xs text-[rgb(var(--signal-fault))]"
                  >
                    {error}
                  </p>
                )}
                {info && (
                  <p
                    role="status"
                    className={`${WELL} rounded-lg border border-[#e4e2f0] p-3 text-xs text-slate-700 dark:border-white/10 dark:text-slate-200`}
                  >
                    {info}
                  </p>
                )}
                {!recovery && (
                  <div className="space-y-1.5">
                    <Label htmlFor="institution-email" className={`${MICRO} ${MUTED} ml-0.5`}>
                      Email address
                    </Label>
                    <div className="relative group">
                      <Input
                        id="institution-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        readOnly={Boolean(invite)}
                        disabled={busy}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-md border border-[#e4e2f0] bg-white px-3 text-sm shadow-none transition-colors focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}
                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="ml-0.5 flex items-center justify-between">
                      <Label htmlFor="institution-password" className={`${MICRO} ${MUTED}`}>
                        {recovery || mode === 'setup' ? 'New password' : 'Password'}
                      </Label>
                    </div>
                    <div className="relative group">
                      <Input
                        id="institution-password"
                        type={visible ? 'text' : 'password'}
                        required
                        autoComplete={
                          recovery || mode === 'setup' ? 'new-password' : 'current-password'
                        }
                        className="h-11 rounded-md border border-[#e4e2f0] bg-white pl-3 pr-10 text-sm shadow-none transition-colors focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-slate-100 dark:placeholder:text-slate-500"
                        value={password}
                        disabled={busy}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={() => setVisible(!visible)}
                      >
                        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {(recovery || mode === 'setup') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="institution-confirm" className={`${MICRO} ${MUTED} ml-0.5`}>
                      Confirm password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="institution-confirm"
                        type={visible ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmation}
                        disabled={busy}
                        onChange={(e) => setConfirmation(e.target.value)}
                        className="h-11 rounded-md border border-[#e4e2f0] bg-white px-3 text-sm shadow-none transition-colors focus:border-[#5a63df] focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#141319] dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <p className={`${MUTED} text-[11px] leading-tight`}>
                      At least 8 characters, including uppercase, lowercase, and a number.
                    </p>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={busy || (recovery && !user)}
                  className="flex h-11 w-full items-center justify-center rounded-md bg-[#5a63df] text-sm font-bold text-white shadow-none hover:shadow-none transition-colors hover:bg-[#4d55c7] dark:bg-[#5a63df] dark:hover:bg-[#6c74e8] disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Please wait…</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {recovery
                          ? 'Save password'
                          : mode === 'forgot'
                            ? 'Send reset link'
                            : mode === 'setup'
                              ? 'Set password and continue'
                              : 'Sign in'}
                      </span>
                    </>
                  )}
                </Button>
                {!recovery && (
                  <div className="space-y-2.5 pt-1 text-center text-xs">
                    {mode === 'signin' && (
                      <button
                        type="button"
                        disabled={busy}
                        className="font-semibold text-[#5a63df] underline underline-offset-2 dark:text-[#bfc3ff]"
                        onClick={() => changeMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    )}
                    {mode === 'forgot' && (
                      <button
                        type="button"
                        disabled={busy}
                        className="font-semibold text-[#5a63df] hover:underline dark:text-[#bfc3ff]"
                        onClick={() => changeMode('signin')}
                      >
                        ← Back to institution sign in
                      </button>
                    )}
                    {invite && mode === 'signin' && (
                      <button
                        type="button"
                        disabled={busy}
                        className="block w-full font-semibold text-[#5a63df] hover:underline dark:text-[#bfc3ff]"
                        onClick={() => changeMode('setup')}
                      >
                        First time using this invitation? Set your password
                      </button>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
          <div className="mt-6 border-t border-[#e4e2f0] pt-4 text-center text-xs space-y-2 dark:border-white/[0.07]">
            <p className={MUTED}>
              New institution?{' '}
              <Link
                to="/institution/apply"
                aria-label="Apply for institution access"
                className="font-semibold text-[#5a63df] underline underline-offset-2 hover:text-[#4d55c7] dark:text-[#bfc3ff] dark:hover:text-white"
              >
                Apply for access
              </Link>
            </p>
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
              First-time owners set a password through their invitation.
            </p>
          </div>
        </section>
      </div>
    </InstitutionPublicLayout>
  );
}
