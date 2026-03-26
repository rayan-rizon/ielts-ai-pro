import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Crown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/AuthContext';

const MAX_RETRIES = 10;
const POLL_INTERVAL = 2000; // 2 seconds between polls
const SYNC_TIMEOUT = 15000; // 15 second timeout for sync call

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshProfile } = useAuth();

  // OPTIMISTIC UI: If session_id is present, assume success immediately
  const [isLoading, setIsLoading] = useState(!sessionId); // Only block if no session_id
  const [isSyncing, setIsSyncing] = useState(!!sessionId); // Track background sync
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

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
      console.log('[SubscriptionSuccess] Sync result:', result);
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

    const loadSubscription = async () => {
      try {
        const {
          data: { session: authSession },
        } = await import('@/lib/supabase').then((m) => m.supabase.auth.getSession());

        if (!authSession) {
          setError('Not authenticated. Please log in again.');
          setIsLoading(false);
          setIsSyncing(false);
          return;
        }

        // Try to sync if we have a session ID
        if (sessionId) {
          console.log('[SubscriptionSuccess] Syncing session:', sessionId);
          // Don't await this if we want to start polling immediately?
          // Actually, await is fine because user sees "Success" UI already.
          await syncStripeSession(authSession);
        }

        // Poll for subscription status
        const pollForSubscription = async (attempt = 0) => {
          if (!isMounted) return;

          const subData = await checkSubscriptionStatus();

          if (subData) {
            console.log('[SubscriptionSuccess] Subscription confirmed:', subData);
            setSubscriptionData(subData);
            setIsLoading(false);
            setIsSyncing(false);

            // Refresh AuthContext so ProtectedRoute has latest subscription_tier & onboarding_completed
            // Also clears stale sessionStorage cache
            try {
              sessionStorage.removeItem('auth_profile_cache');
              await refreshProfile();
            } catch (err) {
              console.warn('[SubscriptionSuccess] Profile refresh failed (non-critical):', err);
            }
            return;
          }

          if (attempt >= MAX_RETRIES) {
            console.warn('[SubscriptionSuccess] Max retries reached, showing fallback');
            // Show success anyway with default tier (payment went through, just sync delayed)
            setSubscriptionData({
              tier: 'pro', // Default fallback
              interval: 'monthly',
              amount: null,
              currency: 'USD',
            });
            setIsLoading(false);
            setIsSyncing(false);
            return;
          }

          setRetryCount(attempt + 1);
          pollInterval = setTimeout(() => pollForSubscription(attempt + 1), POLL_INTERVAL);
        };

        // Start polling immediately
        pollForSubscription(0);
      } catch (error) {
        console.error('[SubscriptionSuccess] Error:', error);
        if (isMounted) {
          // Only show error if we haven't shown success yet (should be rare with optimistic UI)
          if (isLoading) {
            setError(
              'Something went wrong. Your payment was successful - please check your settings.'
            );
          }
          setIsLoading(false);
          setIsSyncing(false);
        }
      }
    };

    loadSubscription();

    return () => {
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [sessionId]);

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

  // Determine colors based on data or default to Pro for optimistic UI
  const currentTier = subscriptionData?.tier || 'pro';
  const colors = tierColors[currentTier] || tierColors.pro;

  // Fully blocking error state (only if auth fails or critical error before loading)
  if (error && !subscriptionData && !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Initial loading state (only if NO session ID provided, e.g. direct visit)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#020617] overflow-hidden">
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
              {subscriptionData ? (subscriptionData.tier === 'premium' ? 'Premium' : 'Pro') : 'Pro'}
            </span>
            !
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {subscriptionData
              ? `Your subscription is now active. You have full access to all ${subscriptionData.tier === 'premium' ? 'Premium' : 'Pro'} features.`
              : "We've received your payment and are finalizing your account setup. This will just take a moment."}
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
                  {subscriptionData?.tier === 'premium' ? (
                    <Crown className={`w-6 h-6 ${colors.icon}`} />
                  ) : (
                    <Sparkles className={`w-6 h-6 ${colors.icon}`} />
                  )}
                </div>
                <div>
                  {subscriptionData ? (
                    <>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {subscriptionData.tier === 'premium' ? 'Premium Plan' : 'Pro Plan'}
                      </h3>
                      <p className="text-sm text-slate-500 capitalize">
                        {subscriptionData.interval} billing
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                {subscriptionData ? (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {subscriptionData.tier === 'premium' ? '200' : '100'} AI Writing
                        Evaluations/month
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {subscriptionData.tier === 'premium' ? '100' : '50'} AI Speaking
                        Sessions/month
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                        All Cambridge Tests unlocked
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => navigate('/dashboard')}
                disabled={isSyncing}
                className={`w-full py-6 rounded-2xl font-bold text-white ${colors.badge} hover:opacity-90 transition-all duration-300 group disabled:opacity-70`}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finalizing Setup...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-sm text-slate-500 dark:text-slate-400 text-center"
        >
          A confirmation email has been sent to your registered email address.
        </motion.p>
      </div>
    </div>
  );
}
