import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, TriangleAlert, Undo2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/shared/Logo';
import { requirePublicEnv } from '@/lib/publicEnv';

/**
 * Landing page for the unsubscribe link in every marketing email.
 *
 * The opt-out itself already happened in the `marketing-unsubscribe` edge
 * function before this page loads — this only reports the outcome and offers a
 * one-click undo. It has to live in the app rather than in the function
 * because Supabase serves function-returned HTML as `text/plain` under a
 * sandbox CSP, so a page rendered there would reach the learner as raw markup.
 *
 * Public and unauthenticated by design: someone opting out of email is often
 * not signed in, and making them sign in to unsubscribe is exactly the
 * dark-pattern this replaces.
 */

const STATES = {
  done: {
    tone: 'ok',
    eyebrow: 'Unsubscribed',
    heading: 'You are unsubscribed',
    body: 'No further practice tips or offers will be sent to you. Account and billing email — receipts, renewals, failed payments — still applies; that is not marketing and keeps you in control of your account.',
    undo: true,
  },
  already: {
    tone: 'ok',
    eyebrow: 'Already unsubscribed',
    heading: 'You were already opted out',
    body: 'Nothing changed — you are not on the marketing list. Account and billing email still applies, as that is not marketing.',
    undo: true,
  },
  resubscribed: {
    tone: 'ok',
    eyebrow: 'Resubscribed',
    heading: 'You are back on the list',
    body: 'You will receive occasional practice tips and offers again. Every one of them carries an unsubscribe link.',
    undo: false,
  },
  invalid: {
    tone: 'warn',
    eyebrow: 'Link not recognised',
    heading: 'We could not read that link',
    body: 'It may have been altered on the way to your inbox, or it has already been replaced by a newer email. Email support@ieltsai.pro and we will remove you manually.',
    undo: false,
  },
};

const SUPABASE_URL = requirePublicEnv('VITE_SUPABASE_URL');

export default function UnsubscribeConfirmation() {
  const [searchParams] = useSearchParams();
  const [undoing, setUndoing] = useState(false);

  const state = searchParams.get('state') || 'invalid';
  const copy = STATES[state] || STATES.invalid;
  const deliveryId = searchParams.get('delivery_id');
  const token = searchParams.get('token');

  const undoUrl = useMemo(() => {
    if (!copy.undo || !deliveryId || !token || !SUPABASE_URL) return null;
    const url = new URL(`${SUPABASE_URL}/functions/v1/marketing-unsubscribe`);
    url.searchParams.set('delivery_id', deliveryId);
    url.searchParams.set('token', token);
    url.searchParams.set('resubscribe', '1');
    return url.toString();
  }, [copy.undo, deliveryId, token]);

  const isOk = copy.tone === 'ok';

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6 dark:bg-[#08080a]">
      <Helmet>
        <title>Email preferences · IELTS AI Pro</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <m.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-black/[0.03] dark:border-white/10 dark:bg-[#141416] dark:shadow-black/20"
      >
        <div className="flex justify-center bg-[#111113] px-8 py-7">
          <Logo variant="footer" size="md" animated={false} />
        </div>
        <div className="flex h-[3px]" aria-hidden="true">
          <span className="flex-1 bg-[#6c4cff]" />
          <span className="flex-1 bg-[#8a6bff]" />
          <span className="flex-1 bg-[#a977ff]" />
        </div>

        {/* Centered column: a status page is a single message, not a form, so
            everything — icon, heading, body, actions — shares one axis instead
            of the eyebrow/heading sitting left while actions drift around. */}
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div
            className={cn(
              'grid h-14 w-14 shrink-0 place-items-center rounded-full',
              isOk ? 'bg-[rgb(var(--signal-ok))]/10' : 'bg-[rgb(var(--signal-warn))]/10'
            )}
          >
            {isOk ? (
              <CheckCircle2 className="h-7 w-7 text-[rgb(var(--signal-ok))]" strokeWidth={1.75} />
            ) : (
              <TriangleAlert
                className="h-7 w-7 text-[rgb(var(--signal-warn))]"
                strokeWidth={1.75}
              />
            )}
          </div>

          <p
            className={cn(
              'mt-4 text-[11px] font-extrabold uppercase tracking-[0.16em]',
              isOk ? 'text-[rgb(var(--signal-ok))]' : 'text-[rgb(var(--signal-warn))]'
            )}
          >
            {copy.eyebrow}
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {copy.heading}
          </h1>
          <p className="mt-3 max-w-[340px] text-[14px] leading-relaxed text-stone-500 dark:text-stone-400">
            {copy.body}
          </p>

          {/* Stacked full-width, not side-by-side: "Undo — resubscribe me" does
              not fit next to a second button inside a 440px card without
              wrapping mid-word, and a wrapped button label reads as broken. */}
          <div className="mt-8 flex w-full flex-col gap-2.5">
            {undoUrl && (
              <a
                href={undoUrl}
                onClick={() => setUndoing(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6c4cff] px-5 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[#5b3be8]"
              >
                {undoing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}
                Undo — resubscribe me
              </a>
            )}
            <Link
              to="/dashboard"
              className={cn(
                'inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-5 py-3.5 text-sm font-bold transition-colors',
                undoUrl
                  ? 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                  : 'bg-[#6c4cff] text-white hover:bg-[#5b3be8]'
              )}
            >
              Back to my dashboard
              {!undoUrl && <ArrowRight className="h-4 w-4" />}
            </Link>
          </div>
        </div>

        <div className="border-t border-stone-200 bg-stone-50 px-8 py-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Questions?{' '}
            <a
              href="mailto:support@ieltsai.pro"
              className="font-semibold text-stone-600 underline underline-offset-2 dark:text-stone-300"
            >
              support@ieltsai.pro
            </a>
          </p>
        </div>
      </m.main>
    </div>
  );
}
