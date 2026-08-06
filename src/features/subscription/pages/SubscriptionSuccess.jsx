import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Crown,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import DocumentHead from '@/components/shared/DocumentHead';
import { trackAppEvent } from '@/lib/tracking';

const MAX_RETRIES = 10;
const POLL_INTERVAL = 2000;
const SYNC_TIMEOUT = 15000;

// A valid Stripe Checkout session ID always starts with 'cs_'
const isValidSessionId = (id) => typeof id === 'string' && id.startsWith('cs_') && id.length > 10;

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshProfile } = useAuth();

  // 'idle' → 'verifying' → 'success' | 'pending' | 'invalid'
  const [status, setStatus] = useState('idle');
  const [subscriptionData, setSubscriptionData] = useState(null);

  const syncStripeSession = useCallback(
    async (authSession) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT);

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/sync-stripe-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) return false;
        const result = await response.json();
        return result.success === true;
      } catch {
        clearTimeout(timeoutId);
        return false;
      }
    },
    [sessionId]
  );

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const userData = await User.me();
      if (userData.subscription_tier && userData.subscription_tier !== 'free') {
        return {
          tier: userData.subscription_tier,
          interval: userData.billing_interval || 'monthly',
          amount: userData.subscription_amount,
          currency: userData.subscription_currency || 'USD',
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const run = async () => {
      // ── GUARD 1: Missing or invalid session_id ────────────────────────────
      // A real Stripe session ID always starts with 'cs_'. Anything else
      // (missing, tampered, bookmark of an old URL) is caught here before
      // we waste 10 polls and show a misleading "Activation Pending" screen.
      if (!isValidSessionId(sessionId)) {
        if (isMounted) setStatus('invalid');
        return;
      }

      // ── GUARD 2: Not logged in ────────────────────────────────────────────
      const {
        data: { session: authSession },
      } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());
      if (!authSession) {
        navigate('/login?redirect=/pricing', { replace: true });
        return;
      }

      if (isMounted) setStatus('verifying');

      // ── GUARD 3: Check if already subscribed (webhook beat us) ────────────
      const existingData = await checkSubscriptionStatus();
      if (existingData && isMounted) {
        setSubscriptionData(existingData);
        setStatus('success');
        try {
          sessionStorage.removeItem('auth_profile_cache');
          await refreshProfile();
        } catch {
          /* non-critical */
        }
        trackAppEvent('subscription_purchase', {
          path: '/subscription/success',
          plan_tier: existingData.tier,
          billing_interval: existingData.interval,
          value: existingData.amount,
          currency: existingData.currency,
          transaction_id: sessionId,
          event_id: sessionId,
          source: 'stripe_checkout',
        });
        return;
      }

      // ── GUARD 4: Check if current user is still free ─────────────────────
      // If after the initial check the user is free AND the session_id looks
      // valid, we still try to sync. But if after all retries they're still
      // free, don't show "Activation Pending" — show "Invalid Session" because
      // this session_id doesn't belong to them.
      const synced = await syncStripeSession(authSession);
      console.info('[SubscriptionSuccess] Sync result:', synced);

      const pollForSubscription = async (attempt = 0) => {
        if (!isMounted) return;

        const subData = await checkSubscriptionStatus();

        if (subData) {
          try {
            sessionStorage.removeItem('auth_profile_cache');
            await refreshProfile();
          } catch {
            /* non-critical */
          }

          if (isMounted) {
            trackAppEvent('subscription_purchase', {
              path: '/subscription/success',
              plan_tier: subData.tier,
              billing_interval: subData.interval,
              value: subData.amount,
              currency: subData.currency,
              transaction_id: sessionId,
              event_id: sessionId,
              source: 'stripe_checkout',
            });
            setSubscriptionData(subData);
            setStatus('success');
          }
          return;
        }

        if (attempt >= MAX_RETRIES) {
          if (isMounted) {
            trackAppEvent('subscription_activation_error', {
              path: '/subscription/success',
              session_id_present: Boolean(sessionId),
              synced,
            });
            // At this point, after 10 polls the user is STILL free. The session_id
            // doesn't match this account (shared link, wrong login, etc.).
            // Show 'invalid' instead of the misleading 'pending' screen.
            setStatus('invalid');
          }
          return;
        }

        pollTimer = setTimeout(() => pollForSubscription(attempt + 1), POLL_INTERVAL);
      };

      pollForSubscription(0);
    };

    run().catch((err) => {
      console.error('[SubscriptionSuccess] Fatal error:', err);
      if (isMounted) setStatus('invalid');
    });

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierColors = {
    pro: {
      bg: 'from-indigo-500/20 to-blue-500/20',
      border: 'border-indigo-500/30',
      icon: 'text-indigo-500',
      badge: 'bg-indigo-600',
      glow: 'shadow-indigo-500/20',
    },
    premium: {
      bg: 'from-violet-500/20 to-purple-500/20',
      border: 'border-violet-500/30',
      icon: 'text-violet-500',
      badge: 'bg-violet-600',
      glow: 'shadow-violet-500/20',
    },
  };

  const currentTier = subscriptionData?.tier || 'pro';
  const colors = tierColors[currentTier] || tierColors.pro;

  // ─── Verifying ───────────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <DocumentHead
          title="Verifying Payment | IELTS Ai Pro"
          description="Verifying your subscription purchase."
          canonicalUrl="https://www.ieltsai.pro/subscription/success"
          noIndex={true}
          noFollow={true}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm px-4"
        >
          <div className="w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Verifying Payment
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Confirming your subscription with Stripe…
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Invalid / Not-Authorised State ─────────────────────────────────────────
  // Shown when: no session_id, tampered URL, shared link, wrong account
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4">
        <DocumentHead
          title="Session Not Found | IELTS Ai Pro"
          description="Unable to verify the payment session."
          canonicalUrl="https://www.ieltsai.pro/subscription/success"
          noIndex={true}
          noFollow={true}
        />

        {/* Subtle ambient background */}
        <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-md w-full"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto mb-8 shadow-xl"
          >
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4 mb-10"
          >
            <Badge
              variant="outline"
              className="px-3 py-1 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 font-bold uppercase tracking-widest text-[10px]"
            >
              Session Not Found
            </Badge>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              No Valid Purchase Found
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              This payment link doesn&apos;t match your current account, or it has already been
              used. If you just subscribed, make sure you&apos;re logged in with the same email used
              at checkout.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={() => navigate('/pricing')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl px-6 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all border-0"
            >
              View Plans
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@ieltsai.pro', '_blank')}
              className="rounded-xl px-6 border-slate-200 dark:border-white/10 font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              Contact Support
              <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-8 text-xs text-slate-400 dark:text-slate-600 font-medium"
          >
            Already subscribed?{' '}
            <button
              onClick={() => navigate('/settings?tab=subscription')}
              className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
            >
              Check your plan in Settings
            </button>
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ─── Activation Pending (transient webhook delay — still a real payment) ─────
  // Only shown when session_id was valid but we couldn't confirm within retries.
  // This is a real "webhook slow" scenario — not a free-user accessing the page.
  // NOTE: with the new guard above, free users never reach this state anymore.
  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4">
        <DocumentHead
          title="Activation Processing | IELTS Ai Pro"
          description="Your subscription is being activated."
          canonicalUrl="https://www.ieltsai.pro/subscription/success"
          noIndex={true}
          noFollow={true}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            Activation Processing
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            Your payment was received. Account activation is taking a little longer than usual —
            please check your Settings in a few minutes. Contact support if this persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/settings?tab=subscription')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 border-0"
            >
              Check Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl px-6 border-slate-200 dark:border-white/10 font-bold"
            >
              Go to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Success State ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#020617] overflow-hidden">
      <DocumentHead
        title="Subscription Activated | IELTS Ai Pro"
        description="Your IELTS Ai Pro subscription is now active."
        canonicalUrl="https://www.ieltsai.pro/subscription/success"
        noIndex={true}
        noFollow={true}
      />

      {/* Background */}
      <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617]" />
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-br/srgb ${colors.bg} rounded-full blur-[120px] opacity-50`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-size-[48px_48px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        {/* Check icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
          className="mb-8"
        >
          <div
            className={`w-24 h-24 rounded-full bg-linear-to-br/srgb ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-2xl ${colors.glow}`}
          >
            <CheckCircle2 className={`w-12 h-12 ${colors.icon}`} />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-10"
        >
          <Badge className={`${colors.badge} text-white border-0 mb-4 px-4 py-1 font-bold`}>
            PAYMENT CONFIRMED
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight">
            Welcome to{' '}
            <span className={colors.icon}>
              {subscriptionData?.tier === 'premium' ? 'Premium' : 'Pro'}
            </span>
            !
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your subscription is active. You have full access to all{' '}
            {subscriptionData?.tier === 'premium' ? 'Premium' : 'Pro'} features right now.
          </p>
        </motion.div>

        {/* Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <Card
            className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ${colors.border} border rounded-3xl shadow-2xl overflow-hidden`}
          >
            <CardContent className="p-8">
              {/* Plan header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl bg-linear-to-br/srgb ${colors.bg}`}>
                  {subscriptionData?.tier === 'premium' ? (
                    <Crown className={`w-6 h-6 ${colors.icon}`} />
                  ) : (
                    <Sparkles className={`w-6 h-6 ${colors.icon}`} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {subscriptionData?.tier === 'premium' ? 'Premium Plan' : 'Pro Plan'}
                  </h3>
                  <p className="text-sm text-slate-500 capitalize">
                    {subscriptionData?.interval || 'monthly'} billing
                  </p>
                </div>
              </div>

              {/* Feature checklist */}
              <div className="space-y-3 mb-8">
                {[
                  `${subscriptionData?.tier === 'premium' ? '200' : '100'} AI Writing Evaluations/month`,
                  `${subscriptionData?.tier === 'premium' ? '100' : '50'} AI Speaking Sessions/month`,
                  'All Cambridge practice tests unlocked',
                  ...(subscriptionData?.tier === 'premium'
                    ? [
                        'Unlimited Vocabulary Review',
                        'Study Plan Updates as You Improve',
                        'Grammar Practice for Writing & Speaking',
                      ]
                    : ['Grammar Practice', 'AI Study Plan Made for You']),
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={() => navigate('/dashboard')}
                className={`w-full py-6 rounded-2xl font-black text-white ${colors.badge} hover:opacity-90 transition-all duration-300 group shadow-lg ${colors.glow} active:scale-95 border-0`}
              >
                Start Practising
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
