import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Link2Off, Loader2, MailCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { IconChip, MICRO, PANEL, TITLE, WELL } from '@/features/dashboard/components/primitives';
import {
  clearRequestedDestination,
  getRequestedDestination,
} from '@/features/auth/utils/authDestination';

const VALID_CONFIRMATION_TYPE = 'signup';

export default function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    // The token is single-use and should not remain visible in browser history,
    // screenshots, analytics URLs, or copied links after this page loads.
    window.history.replaceState({}, '', '/auth/confirm');

    if (!tokenHash || type !== VALID_CONFIRMATION_TYPE) {
      setStatus('invalid');
      return;
    }

    let active = true;

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: VALID_CONFIRMATION_TYPE })
      .then(({ error }) => {
        if (!active) return;
        if (error) {
          setStatus('expired');
          return;
        }

        setStatus('confirmed');
        const destination = getRequestedDestination(null, '/dashboard');
        clearRequestedDestination();
        navigate(destination, { replace: true });
      })
      .catch(() => {
        if (active) setStatus('expired');
      });

    return () => {
      active = false;
    };
  }, [navigate, searchParams]);

  const content = {
    checking: {
      icon: Loader2,
      iconClass: 'animate-spin',
      eyebrow: 'Account security',
      title: 'Confirming your email',
      body: 'This should only take a moment. Keep this page open while we securely confirm your address.',
    },
    confirmed: {
      icon: CheckCircle2,
      eyebrow: 'Email confirmed',
      title: 'Your account is ready',
      body: 'Your email address is confirmed. Taking you to your learning dashboard now.',
    },
    invalid: {
      icon: Link2Off,
      eyebrow: 'Link problem',
      title: 'This confirmation link is invalid',
      body: 'The link is incomplete or is not an IELTS AI Pro signup confirmation link.',
    },
    expired: {
      icon: MailCheck,
      eyebrow: 'Link expired',
      title: 'This confirmation link has expired',
      body: 'For your security, confirmation links can only be used once and expire after a limited time. Return to sign in and try again.',
    },
  }[status];

  const isError = status === 'invalid' || status === 'expired';

  return (
    <main className="min-h-screen bg-[#f7f6fd] px-4 py-10 dark:bg-[#09090c] sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/" aria-label="IELTS AI Pro home">
            <Logo className="h-10 w-auto" />
          </Link>
        </div>

        <section className={cn(PANEL, 'p-6 text-center sm:p-8')} aria-live="polite">
          <IconChip
            icon={content.icon}
            tone={isError ? 'amber' : 'accent'}
            size="md"
            className={cn('mx-auto mb-5 h-12 w-12 rounded-xl', content.iconClass)}
          />
          <p className={cn(MICRO, 'mb-2 text-[#5a63df]')}>{content.eyebrow}</p>
          <h1 className={cn(TITLE, 'text-2xl')}>{content.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
            {content.body}
          </p>

          {isError && (
            <div className={cn(WELL, 'mt-6 border border-amber-500/25 p-4')}>
              <Button
                asChild
                className="h-11 w-full bg-[#5a63df] font-bold text-white hover:bg-[#4c55c9]"
              >
                <Link to="/login">Back to sign in</Link>
              </Button>
              <Link
                to="/"
                className="mt-3 inline-block text-sm font-semibold text-slate-600 hover:text-[#5a63df] dark:text-slate-400"
              >
                Return to home
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
