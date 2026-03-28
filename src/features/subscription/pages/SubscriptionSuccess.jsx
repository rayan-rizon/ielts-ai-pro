import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Sparkles, ArrowRight, Crown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import DocumentHead from '@/components/shared/DocumentHead';
import { trackAppEvent } from '@/lib/tracking';

const MAX_RETRIES = 10;
const POLL_INTERVAL = 2000; // 2 seconds between polls
const SYNC_TIMEOUT = 15000; // 15 second timeout for sync call

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshProfile } = useAuth();

  // All states start in a verifying/loading mode — no optimistic UI
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const syncStripeSession = async (authSession) => {
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

      if (!response.ok) {
        console.warn('[SubscriptionSuccess] Sync returned non-OK status:', response.status);
        return false;
      }

      const result = await response.json();
      console.info('[SubscriptionSuccess] Sync result:', result);
      return result.success === true;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn('[SubscriptionSuccess] Sync timed out');
      } else {
        console.error('[SubscriptionSuccess] Sync error:', err);
      }
      return false;
    }
  };

  const checkSubscriptionStatus = async () => {
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
    } catch (err) {
      console.error('[SubscriptionSuccess] Failed to fetch user:', err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    // Guard: If no valid session_id in the URL, redirect immediately
    if (!sessionId || sessionId.trim() === '') {
      toast.error('No payment session found. Please try again.');
      navigate('/pricing', { replace: true });
      return;
    }

    const loadSubscription = async () => {
      try {
        const {
          data: { session: authSession },
        } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());

        if (!authSession) {
          navigate('/login?redirect=/pricing', { replace: true });
          return;
        }

        // Sync with Stripe — this is the critical verification step
        console.info('[SubscriptionSuccess] Syncing session:', sessionId);
        const synced = await syncStripeSession(authSession);

        if (!synced) {
          console.warn('[SubscriptionSuccess] Sync failed or returned false');
          // We still poll — sync may have failed transiently but webhook may have already
          // upgraded the account. If polling also fails, we show a real error.
        }

        // Poll for subscription status (webhook may precede sync response)
        const pollForSubscription = async (attempt = 0) => {
          if (!isMounted) return;

          const subData = await checkSubscriptionStatus();

          if (subData) {
            console.info('[SubscriptionSuccess] Subscription confirmed:', subData);

            // Refresh AuthContext so ProtectedRoute has latest subscription_tier
            try {
              sessionStorage.removeItem('auth_profile_cache');
              await refreshProfile();
            } catch (err) {
              console.warn('[SubscriptionSuccess] Profile refresh failed (non-critical):', err);
            }

            if (isMounted) {
              trackAppEvent('subscription_purchase', {
                path: '/subscription/success',
                plan_tier: subData.tier,
                billing_interval: subData.interval,
                value: subData.amount,
                currency: subData.currency,
                source: 'stripe_checkout',
              });

              setSubscriptionData(subData);
              setStatus('success');
            }
            return;
          }

          if (attempt >= MAX_RETRIES) {
            console.warn('[SubscriptionSuccess] Max retries reached, no subscription found');
            if (isMounted) {
              trackAppEvent('subscription_activation_error', {
                path: '/subscription/success',
                session_id_present: Boolean(sessionId),
              });

              setErrorMessage(
                'Your payment was received, but account activation is taking longer than expected. Please check your Settings page in a few minutes, or contact support if the issue persists.'
              );
              setStatus('error');
            }
            return;
          }

          pollInterval = setTimeout(() => pollForSubscription(attempt + 1), POLL_INTERVAL);
        };

        // Start polling immediately
        pollForSubscription(0);
      } catch (error) {
        console.error('[SubscriptionSuccess] Error:', error);
        if (isMounted) {
          setErrorMessage(
            'Something went wrong verifying your payment. If you were charged, please contact support.'
          );
          setStatus('error');
        }
      }
    };

    loadSubscription();

    return () => {
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierColors = {
    pro: {
      bg: 'from-indigo-500/20 to-blue-500/20',
      border: 'border-indigo-500/30',
      icon: 'text-indigo-500',
      badge: 'bg-indigo-500',
    },
    premium: {
      bg: 'from-violet-500/20 to-purple-500/20',
      border: 'border-violet-500/30',
      icon: 'text-violet-500',
      badge: 'bg-violet-500',
    },
  };

  const currentTier = subscriptionData?.tier || 'pro';
  const colors = tierColors[currentTier] || tierColors.pro;

  // ─── Verifying State ─────────────────────────────────────────────────────────
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <DocumentHead
          title="Subscription Verification | IELTS Ai Pro"
          description="Verifying your IELTS Ai Pro subscription purchase and activating your account benefits."
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
            Confirming your subscription with Stripe. This usually takes just a moment…
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4">
        <DocumentHead
          title="Subscription Activation Pending | IELTS Ai Pro"
          description="Your payment was received and account activation is being verified by IELTS Ai Pro."
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
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            Activation Pending
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
            {errorMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/settings')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6"
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

  // ─── Success State (only shown after verified) ───────────────────────────────
  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#020617] overflow-hidden">
      <DocumentHead
        title="Subscription Activated | IELTS Ai Pro"
        description="Your IELTS Ai Pro subscription is now active. Start practicing with premium tools and AI feedback."
        canonicalUrl="https://www.ieltsai.pro/subscription/success"
        noIndex={true}
        noFollow={true}
      />

      {/* Background Effects */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617]" />
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br ${colors.bg} rounded-full blur-[120px] opacity-50`}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mb-8"
        >
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-2xl`}
          >
            <CheckCircle2 className={`w-12 h-12 ${colors.icon}`} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <Badge className={`${colors.badge} text-white border-0 mb-4`}>PAYMENT SUCCESSFUL</Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white">
            Welcome to{' '}
            <span className={colors.icon}>
              {subscriptionData.tier === 'premium' ? 'Premium' : 'Pro'}
            </span>
            !
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your subscription is now active. You have full access to all{' '}
            {subscriptionData.tier === 'premium' ? 'Premium' : 'Pro'} features.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-md"
        >
          <Card
            className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl ${colors.border} border rounded-3xl shadow-2xl overflow-hidden`}
          >
            <CardContent className="p-8">
              {/* Plan Details Section */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors.bg}`}>
                  {subscriptionData.tier === 'premium' ? (
                    <Crown className={`w-6 h-6 ${colors.icon}`} />
                  ) : (
                    <Sparkles className={`w-6 h-6 ${colors.icon}`} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {subscriptionData.tier === 'premium' ? 'Premium Plan' : 'Pro Plan'}
                  </h3>
                  <p className="text-sm text-slate-500 capitalize">
                    {subscriptionData.interval} billing
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {subscriptionData.tier === 'premium' ? '200' : '100'} AI Writing
                    Evaluations/month
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {subscriptionData.tier === 'premium' ? '100' : '50'} AI Speaking Sessions/month
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    All Cambridge Tests unlocked
                  </span>
                </div>
                {subscriptionData.tier === 'premium' && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Adaptive AI Learning Path
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => navigate('/dashboard')}
                className={`w-full py-6 rounded-2xl font-bold text-white ${colors.badge} hover:opacity-90 transition-all duration-300 group`}
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
