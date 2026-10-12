import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { getPasskeyErrorMessage } from '@/features/auth/utils/passkeyErrors';
import { pushUserIdentity, trackAuthenticatedAppEvent } from '@/lib/tracking';
import { resetProductIdentity } from '@/lib/posthog';
import { clearAdminAccess } from '@/features/auth/utils/adminAccess';
import { normalizeAnnouncement, normalizeMaintenance } from '@/lib/communications';
import { reportServiceRecovered, trackServiceError } from '@/lib/serviceOutage';
import { scheduleIdle } from '@/lib/scheduleIdle';

const AuthContext = createContext();

const loadAuthDependencies = (() => {
  let promise;
  return () => {
    if (!promise) {
      promise = Promise.all([
        import('@/lib/supabase'),
        import('@/features/auth/services/User'),
      ]).then(([supabaseModule, userModule]) => ({
        supabase: supabaseModule.supabase,
        User: userModule.User,
      }));
    }
    return promise;
  };
})();

const loadSystemSettingService = (() => {
  let promise;
  return () => {
    if (!promise) {
      promise = import('@/features/admin/services/SystemSetting').then(
        (module) => module.SystemSetting
      );
    }
    return promise;
  };
})();

const fallbackAuthContext = Object.freeze({
  user: null,
  userProfile: null,
  loading: false,
  authCheckComplete: true,
  adminCheckComplete: true,
  isAdmin: false,
  signUp: async () => null,
  signIn: async () => null,
  signInWithPasskey: async () => null,
  signOut: async () => null,
  refreshProfile: async () => null,
  checkIsAdmin: async () => false,
  globalSettings: null,
  settingsLoading: false,
  refreshGlobalSettings: async () => null,
});

/**
 * `system_settings` drives maintenance mode and the site-wide banner, so a
 * value that only refreshes on a hard reload means an admin flipping the switch
 * has no effect on anyone already sitting on a page. Re-read it periodically
 * and whenever the tab regains focus. The query is three rows.
 */
const GLOBAL_SETTINGS_POLL_MS = 30_000;
const GLOBAL_SETTINGS_REFRESH_GAP_MS = 5_000;
const settingsAreEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

let hasWarnedMissingAuthProvider = false;

// Session cache helpers for instant auth restoration
const PROFILE_CACHE_KEY = 'auth_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const SUBSCRIPTION_TIER_CACHE_PREFIX = 'tracked_subscription_tier:';

const normalizeSubscriptionTier = (tier) =>
  String(tier || 'free')
    .trim()
    .toLowerCase();

const getSubscriptionTierCacheKey = (userId) => `${SUBSCRIPTION_TIER_CACHE_PREFIX}${userId}`;

const getStoredSubscriptionTier = (userId) => {
  if (typeof window === 'undefined' || !userId) return null;
  const storedTier = window.localStorage.getItem(getSubscriptionTierCacheKey(userId));
  if (storedTier == null) return null;
  return normalizeSubscriptionTier(storedTier);
};

const setStoredSubscriptionTier = (userId, tier) => {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(getSubscriptionTierCacheKey(userId), normalizeSubscriptionTier(tier));
};

const isLikelyBangladeshUser = () => {
  if (typeof window === 'undefined') return false;

  const storedCountry = (window.localStorage.getItem('user_country') || '').trim().toUpperCase();
  if (storedCountry === 'BD' || storedCountry === 'BANGLADESH') return true;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return timezone === 'Asia/Dhaka' || timezone === 'Asia/Chittagong';
};

const getCachedProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;
    const { profile, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
      return profile;
    }
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  }
  return null;
};

const setCachedProfile = (profile) => {
  if (typeof window === 'undefined' || !profile) return;
  try {
    sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        profile,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Session storage not available (e.g. private mode)
  }
};

const clearCachedProfile = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  }
};

const getLocalOnboardingCompleted = () => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('onboarding_completed');
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return null;
};

const GLOBAL_SETTINGS_CACHE_KEY = 'cached_global_settings';

const getCachedGlobalSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GLOBAL_SETTINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedGlobalSettings = (settings) => {
  if (typeof window === 'undefined' || !settings) return;
  try {
    const serialized = JSON.stringify(settings);
    if (window.localStorage.getItem(GLOBAL_SETTINGS_CACHE_KEY) !== serialized) {
      window.localStorage.setItem(GLOBAL_SETTINGS_CACHE_KEY, serialized);
    }
  } catch {
    // Storage quota exceeded or disabled
  }
};

const getStoredReferralCode = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('referral_code');
};

const clearStoredReferralCode = (profile) => {
  if (profile?.id && typeof window !== 'undefined') {
    window.localStorage.removeItem('referral_code');
  }
};

const syncOnboardingStorage = (profile) => {
  if (profile?.onboarding_completed && typeof window !== 'undefined') {
    window.localStorage.setItem('onboarding_completed', 'true');
  }
};

const isProfileMatchingUser = (profile, userId) => {
  if (!profile || !userId) return false;
  return profile.auth_id === userId || profile.id === userId;
};

const hasLocalAuthSession = () => {
  if (typeof window === 'undefined') return false;
  try {
    return Object.keys(localStorage).some((key) => key.includes('auth-token'));
  } catch {
    return false;
  }
};

const triggerPendingPaymentReplay = (supabase) => {
  if (!supabase) return;
  import('@/features/subscription/services/pendingManualPayment')
    .then(({ flushPendingManualPayments }) => flushPendingManualPayments(supabase))
    .then(({ flushed }) => {
      if (flushed > 0) {
        console.info(`[payments] Replayed ${flushed} held payment request(s).`);
      }
    })
    .catch((err) => console.warn('Pending payment replay failed:', err));
};

const fetchFreshUserProfile = async (User) => {
  const refCode = getStoredReferralCode();
  const profile = await User.me(refCode);
  // Authentication can briefly precede profile creation. Retry after the
  // profile exists even if the earlier no-op RPC received a successful status.
  void User.updateLastActive({ force: true });
  return profile;
};

const applyUserProfileState = ({ profile, setUserProfile, setIsAdmin, setAdminCheckComplete }) => {
  setUserProfile(profile);
  if (profile) {
    setCachedProfile(profile);
    setIsAdmin(profile.role === 'admin');
    pushUserIdentity(profile);
    clearStoredReferralCode(profile);
    syncOnboardingStorage(profile);
  } else {
    setIsAdmin(false);
  }
  setAdminCheckComplete(true);
};

const isInitialOrSignInEvent = (event) => event === 'SIGNED_IN' || event === 'INITIAL_SESSION';

const getUserIdPresentStatus = (session) => (session?.user?.id ? 'User ID present' : 'No User ID');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(() => getCachedGlobalSettings());
  const [settingsLoading, setSettingsLoading] = useState(true);
  const isFetchingProfile = React.useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Re-reads `system_settings`. Exposed on the context so the admin panel can
   * apply a maintenance/banner change to its own session immediately after
   * saving instead of waiting for the poll.
   */
  const settingsRequestRef = useRef(null);
  const forcedSettingsRequestRef = useRef(null);
  const settingsFetchedAtRef = useRef(0);
  const latestSettingsRef = useRef(null);
  const refreshGlobalSettings = useCallback(function readSettings({ force = true } = {}) {
    if (settingsRequestRef.current) {
      if (!force) return settingsRequestRef.current;
      // An admin save must not receive a pre-save response already in flight.
      forcedSettingsRequestRef.current ||= settingsRequestRef.current
        .then(() => readSettings({ force: true }))
        .finally(() => {
          forcedSettingsRequestRef.current = null;
        });
      return forcedSettingsRequestRef.current;
    }
    if (!force && Date.now() - settingsFetchedAtRef.current < GLOBAL_SETTINGS_REFRESH_GAP_MS) {
      return Promise.resolve(latestSettingsRef.current);
    }
    const request = (async () => {
      try {
        const SystemSetting = await loadSystemSettingService();
        const settings = await SystemSetting.getAll();
        if (settings && typeof settings === 'object') {
          latestSettingsRef.current = settings;
          settingsFetchedAtRef.current = Date.now();
          setCachedGlobalSettings(settings);
        }
        if (isMountedRef.current) {
          setGlobalSettings((current) =>
            settingsAreEqual(current, settings) ? current : settings
          );
        }
        return settings;
      } catch (error) {
        console.error('AuthContext: Failed to load system settings', error);
        return null;
      } finally {
        if (isMountedRef.current) setSettingsLoading(false);
        settingsRequestRef.current = null;
      }
    })();
    settingsRequestRef.current = request;
    return request;
  }, []);
  useEffect(() => {
    let isMounted = true;
    let authListener;
    let dependenciesPromise;
    const getDependencies = () => {
      dependenciesPromise ||= loadAuthDependencies();
      return dependenciesPromise;
    };

    // PERFORMANCE: Immediate check for cached session/profile to skip "Verifying access..."
    // We look for the Supabase session token in localStorage to see if a user WAS logged in
    const eagerCheck = () => {
      try {
        const cachedProfile = getCachedProfile();
        const hasLocalSession = hasLocalAuthSession();

        if (cachedProfile && hasLocalSession) {
          console.info('[Auth] Eager cache hit. Unblocking UI instantly.');
          setUserProfile(cachedProfile);
          // Cached profile data improves learner-page startup, but it is
          // client-controlled and must never establish administrator status.
          setIsAdmin(false);
          setAdminCheckComplete(false);
          // Cached profile data is presentation-only. Keep the auth gate closed
          // until Supabase confirms that the session is still valid.
        }
        return hasLocalSession;
      } catch (err) {
        console.warn('Eager auth check failed:', err);
        return false;
      }
    };
    const hasLocalSession = eagerCheck();

    const applyProfileState = (profile) => {
      if (!isMounted) return;
      applyUserProfileState({
        profile,
        setUserProfile,
        setIsAdmin,
        setAdminCheckComplete,
      });
    };

    const restoreCachedSession = (cachedProfile, User) => {
      // Instant auth with cached data!
      setUserProfile(cachedProfile);
      setIsAdmin(false);
      setAdminCheckComplete(false);
      setAuthCheckComplete(true); // Unblock immediately
      setLoading(false);

      // Background refresh - don't block UI
      (async () => {
        try {
          const freshProfile = await fetchFreshUserProfile(User);
          if (isMounted && freshProfile) {
            applyProfileState(freshProfile);
          }
        } catch (err) {
          console.warn('Background profile refresh failed:', err);
          trackServiceError(err, 'auth.backgroundProfileRefresh');
        } finally {
          if (isMounted) setAdminCheckComplete(true);
        }
      })();
    };

    const fetchProfileForSession = async (User) => {
      if (isFetchingProfile.current) return;
      isFetchingProfile.current = true;
      try {
        const profile = await fetchFreshUserProfile(User);
        if (!isMounted) return;
        applyProfileState(profile);
        setAuthCheckComplete(true);
      } catch (error) {
        console.error('Error getting user profile:', error);
        trackServiceError(error, 'auth.profile');
        if (!isMounted) return;
        setUserProfile(null);
        setIsAdmin(false);
        setAdminCheckComplete(true);
        setAuthCheckComplete(true);
      } finally {
        isFetchingProfile.current = false;
      }
    };

    const handleAuthenticatedUser = async (sessionUser, supabase, User) => {
      setUser(sessionUser);
      triggerPendingPaymentReplay(supabase);

      const cachedProfile = getCachedProfile();
      if (isProfileMatchingUser(cachedProfile, sessionUser.id)) {
        restoreCachedSession(cachedProfile, User);
        return;
      }

      await fetchProfileForSession(User);
    };

    const handleAnonymousSession = () => {
      // No session found — always mark as complete so the UI can unblock
      // (regardless of whether getSession() returned an error or just null)
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      clearAdminAccess();
      setAuthCheckComplete(true);
    };

    const getUser = async () => {
      try {
        const { supabase, User } = await getDependencies();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.warn('Auth check error (session might still be valid locally):', error);
          trackServiceError(error, 'auth.getSession');
        } else {
          reportServiceRecovered();
        }

        if (session?.user) {
          await handleAuthenticatedUser(session.user, supabase, User);
        } else {
          handleAnonymousSession();
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        trackServiceError(error, 'auth.session');
        if (!isMounted) return;
        // Always unblock the UI even on catastrophic errors
        setAdminCheckComplete(true);
        setAuthCheckComplete(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const handleSignedOutEvent = () => {
      console.warn('Explicit SIGNED_OUT event received. Clearing user session.');
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(false);
      clearAdminAccess();
      setAuthCheckComplete(true);
      clearCachedProfile(); // Clear cached profile on sign out
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('onboarding_completed');
      }
    };

    const handleTokenRefreshedEvent = (session, User) => {
      if (session?.user) {
        setUser(session.user);
        // Update last_active on token refresh
        // User.updateLastActive handles its own non-fatal errors; do not
        // let telemetry-like activity delay the auth state transition.
        void User.updateLastActive();
      }
    };

    const handleSignInEvent = (sessionUser, User) => {
      setAdminCheckComplete(false);
      // Immediately fetch profile and admin status
      (async () => {
        if (!isMounted || isFetchingProfile.current) return;
        isFetchingProfile.current = true;
        // NOTE: Do NOT reset authCheckComplete here — doing so causes the
        // Login page to re-enter the infinite spinner if the profile fetch is slow.
        try {
          const refCode = getStoredReferralCode();
          const profile = await User.me(refCode);
          if (!isMounted) return;
          applyProfileState(profile);

          // Update last_active on sign-in (fire and forget - don't block)
          void User.updateLastActive();

          setAuthCheckComplete(true);
        } catch (error) {
          console.error('Error reinforcing user profile:', error);
          if (!isMounted) return;
          setIsAdmin(false);
          setAdminCheckComplete(true);
          setAuthCheckComplete(true); // Still complete even on error
        } finally {
          isFetchingProfile.current = false;
        }
      })();
    };

    const handleActiveSession = (sessionUser, event, User) => {
      setUser(sessionUser);
      if (isInitialOrSignInEvent(event)) {
        handleSignInEvent(sessionUser, User);
      }
    };

    const handleAuthStateChange = (event, session, User) => {
      if (!isMounted) return;

      console.info('Auth state changed:', event, getUserIdPresentStatus(session));

      if (event === 'SIGNED_OUT') {
        handleSignedOutEvent();
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        handleTokenRefreshedEvent(session, User);
        return;
      }

      if (session?.user) {
        handleActiveSession(session.user, event, User);
        return;
      }

      if (!isInitialOrSignInEvent(event)) {
        console.warn(
          `Auth event ${event} received without session user. Waiting for explicit sign out.`
        );
      }
    };

    const setupAuthListener = async () => {
      const { supabase, User } = await getDependencies();
      if (!isMounted) return;

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthStateChange(event, session, User);
      });

      authListener = data;
    };

    const initializeAuth = () => {
      getUser();
      setupAuthListener().catch((error) => {
        console.warn('Auth listener setup failed:', error);
      });
    };

    // Maintenance must be checked before public routes render, even when auth
    // initialization is deferred for an anonymous landing-page visitor.
    refreshGlobalSettings({ force: false });

    const isAnonymousLanding =
      typeof window !== 'undefined' && window.location.pathname === '/' && !hasLocalSession;

    let cancelDeferred;
    if (isAnonymousLanding) {
      // Anonymous visitors do not need Supabase to render or use the public
      // landing page, so keep the auth bundle off the critical path — but the
      // deferred initialization below is not optional: without it
      // `globalSettings` stays null forever on `/`, which silently disabled
      // maintenance mode and the announcement banner for every first-time
      // visitor.
      setLoading(false);
      setAuthCheckComplete(true);
      setAdminCheckComplete(true);

      const startDeferred = () => {
        if (!isMounted) return;
        initializeAuth();
      };

      cancelDeferred = scheduleIdle(startDeferred, { timeout: 2500, fallbackDelay: 1200 });
    } else {
      initializeAuth();
    }

    return () => {
      isMounted = false;
      cancelDeferred?.();
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshGlobalSettings]);

  /**
   * Keep maintenance mode and the banner current for sessions that are already
   * open: poll on an interval and re-read whenever the tab comes back.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshGlobalSettings({ force: false });
    }, GLOBAL_SETTINGS_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshGlobalSettings({ force: false });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    const onStorage = (event) => {
      if (event.key !== GLOBAL_SETTINGS_CACHE_KEY || !event.newValue) return;
      try {
        const settings = JSON.parse(event.newValue);
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return;
        // Adopt the other tab's result. Refetching here fans one poll out into
        // a request from every open tab. Initial availability still waits for
        // this tab's fresh request; storage is never allowed to unblock it.
        latestSettingsRef.current = settings;
        setGlobalSettings((current) => (settingsAreEqual(current, settings) ? current : settings));
      } catch {
        // Ignore malformed cache values; the next visible poll repairs them.
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshGlobalSettings]);

  // Revalidate session when tab becomes visible
  // This ensures the session is still valid after returning from another tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          const { supabase, User } = await loadAuthDependencies();
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (!error && session?.user) {
            setUser(session.user);
            console.info('[Visibility] Session revalidated on tab focus');
            // Update last_active when tab becomes visible
            void User.updateLastActive();
          }
        } catch (error) {
          console.warn('[Visibility] Session revalidation failed:', error);
          // Don't clear user on error - let explicit SIGNED_OUT handle that
        }
      }
    };

    const handleProfileUpdate = (event) => {
      console.info('User profile updated event received:', event.detail);
      setUserProfile((prev) => ({ ...prev, ...event.detail }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userProfile?.id) return;

    const userId = userProfile.id;
    // Institution entitlement changes are access grants, not personal purchase conversions.
    const currentTier = normalizeSubscriptionTier(
      userProfile.personal_subscription?.subscription_tier ?? userProfile.subscription_tier
    );
    const previousTier = getStoredSubscriptionTier(userId);

    if (!previousTier) {
      setStoredSubscriptionTier(userId, currentTier);
      return;
    }

    const upgradedFromFree = previousTier === 'free' && currentTier !== 'free';
    const subscriptionCurrency = (userProfile.subscription_currency || '').toUpperCase();
    const isManualBdSubscription =
      isLikelyBangladeshUser() &&
      !userProfile.stripe_subscription_id &&
      (subscriptionCurrency === 'BDT' || !subscriptionCurrency);

    if (upgradedFromFree && isManualBdSubscription) {
      const subscriptionAmount = Number(userProfile.subscription_amount);
      // A manually approved bKash upgrade has no checkout session to name it,
      // so derive a stable id from the account and the tier it moved to. This
      // effect only runs on a free -> paid transition, making that pair unique
      // per upgrade. Without it the event fell back to a fresh random id on
      // every fire, which defeated both Meta's event-id dedup and the
      // localStorage replay guard, and left GA4 with no transaction_id at all.
      const manualTransactionId = `manual_bd_${userId}_${currentTier}`;
      trackAuthenticatedAppEvent(
        'subscription_purchase',
        {
          path: window.location.pathname,
          plan_tier: currentTier,
          billing_interval: userProfile.billing_interval || 'monthly',
          value:
            Number.isFinite(subscriptionAmount) && subscriptionAmount > 0
              ? subscriptionAmount
              : undefined,
          currency: subscriptionCurrency || 'BDT',
          transaction_id: manualTransactionId,
          event_id: manualTransactionId,
          source: 'manual_bangladesh',
        },
        userProfile
      );
    }

    setStoredSubscriptionTier(userId, currentTier);
  }, [userProfile]);

  const refreshProfile = useCallback(
    async (userOverride) => {
      const targetUser = userOverride || user;
      if (!targetUser) return null;

      setAdminCheckComplete(false);
      try {
        const { User } = await loadAuthDependencies();
        const refCode = getStoredReferralCode();
        const profile = await User.me(refCode);

        if (isMountedRef.current) {
          applyUserProfileState({
            profile,
            setUserProfile,
            setIsAdmin,
            setAdminCheckComplete,
          });
        }
        return profile;
      } catch (error) {
        console.error('Error refreshing profile:', error);
        if (isMountedRef.current) {
          setIsAdmin(false);
          setAdminCheckComplete(true);
        }
        throw error;
      }
    },
    [user]
  );

  const signUp = useCallback(
    async (email, password, username = '', referralCode = null) => {
      try {
        const { User } = await loadAuthDependencies();
        const signUpResult = await User.signUp(email, password, username, referralCode);

        // Only set user if we have a valid session (email confirmation not required or already confirmed)
        if (signUpResult?.session?.user) {
          setUser(signUpResult.session.user);
          await refreshProfile();
        }

        // Return the full result so Login.jsx can check for session
        return signUpResult;
      } catch (error) {
        console.error('Signup failed:', error);
        throw error;
      }
    },
    [refreshProfile]
  );

  const signIn = useCallback(
    async (email, password) => {
      try {
        const { User } = await loadAuthDependencies();
        const userData = await User.signIn(email, password);

        // Explicitly wait for profile refresh here to ensure state is ready
        // before component (Login/AdminLogin) proceeds with navigation
        if (userData) {
          setUser(userData); // Update local user state immediately
          await refreshProfile(userData); // Pass directly — don't rely on stale closure
        }

        return userData;
      } catch (error) {
        console.error('Signin failed:', error);
        throw error;
      }
    },
    [refreshProfile]
  );

  const signInWithPasskey = useCallback(async () => {
    try {
      const { supabase, User } = await loadAuthDependencies();
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        await User.me().then((profile) => {
          if (!isMountedRef.current) return;
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
          setAdminCheckComplete(true);
          setAuthCheckComplete(true);
        });
      }

      return data?.user || null;
    } catch (error) {
      console.error('Passkey sign-in failed:', error);
      throw new Error(getPasskeyErrorMessage(error, 'sign-in'));
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { User } = await loadAuthDependencies();
      await User.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      // Always clear local state
      resetProductIdentity();
      clearAdminAccess();
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(false);
      setAuthCheckComplete(true);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('onboarding_completed');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'user_signed_out',
          user_id: null,
          is_authenticated: false,
          subscription_tier: null,
        });
      }
    }
  }, []);

  // Helper function to check if current user is admin
  const checkIsAdmin = useCallback(async (userId = null) => {
    try {
      const { User } = await loadAuthDependencies();
      const adminStatus = await User.isAdmin(userId);
      setIsAdmin(adminStatus);
      setAdminCheckComplete(true);
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return false;
    }
  }, []);

  const localOnboardingCompleted = React.useMemo(() => getLocalOnboardingCompleted(), []);
  const maintenance = useMemo(
    () => normalizeMaintenance(globalSettings?.maintenance_mode),
    [globalSettings?.maintenance_mode]
  );
  const announcement = useMemo(
    () => normalizeAnnouncement(globalSettings?.public_announcement),
    [globalSettings?.public_announcement]
  );
  const contextValue = useMemo(() => {
    const mergedUser = userProfile ? { ...user, ...userProfile } : user;
    const finalUser =
      mergedUser && localOnboardingCompleted !== null && mergedUser.onboarding_completed == null
        ? { ...mergedUser, onboarding_completed: localOnboardingCompleted }
        : mergedUser;

    return {
      user: finalUser,
      userProfile,
      loading,
      authCheckComplete,
      adminCheckComplete,
      isAdmin,
      signUp,
      signIn,
      signInWithPasskey,
      signOut,
      refreshProfile,
      checkIsAdmin,
      globalSettings,
      settingsLoading,
      refreshGlobalSettings,
      // Pre-normalised so no consumer has to remember that `maintenance_mode`
      // may still be a bare boolean, or that the banner's old severity was
      // `error`. `maintenance.enabled` is *not* the same as "show the screen" —
      // use isMaintenanceActive() from lib/communications for that.
      maintenance,
      announcement,
    };
  }, [
    user,
    userProfile,
    localOnboardingCompleted,
    loading,
    authCheckComplete,
    adminCheckComplete,
    isAdmin,
    signUp,
    signIn,
    signInWithPasskey,
    signOut,
    refreshProfile,
    checkIsAdmin,
    globalSettings,
    settingsLoading,
    refreshGlobalSettings,
    maintenance,
    announcement,
  ]);

  return (
    <AuthContext.Provider value={contextValue} data-oid="e:4.tfn">
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    if (!hasWarnedMissingAuthProvider) {
      hasWarnedMissingAuthProvider = true;
      console.error('useAuth was called outside AuthProvider; returning safe fallback state.');
    }
    return fallbackAuthContext;
  }

  return context;
};
