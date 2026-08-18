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
import { pushUserIdentity, trackAppEvent } from '@/lib/tracking';
import { resetProductIdentity } from '@/lib/posthog';
import { clearAdminAccess } from '@/features/auth/utils/adminAccess';
import { normalizeAnnouncement, normalizeMaintenance } from '@/lib/communications';

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
const GLOBAL_SETTINGS_POLL_MS = 120_000;

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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(null);
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
  const refreshGlobalSettings = useCallback(async () => {
    try {
      const SystemSetting = await loadSystemSettingService();
      const settings = await SystemSetting.getAll();
      if (isMountedRef.current) setGlobalSettings(settings);
      return settings;
    } catch (error) {
      console.error('AuthContext: Failed to load system settings', error);
      return null;
    } finally {
      if (isMountedRef.current) setSettingsLoading(false);
    }
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
        // Look for Supabase local storage keys (standard pattern is sb-[project-id]-auth-token)
        const hasLocalSession = Object.keys(localStorage).some((key) => key.includes('auth-token'));

        if (cachedProfile && hasLocalSession) {
          console.info('[Auth] Eager cache hit. Unblocking UI instantly.');
          setUserProfile(cachedProfile);
          // Cached profile data improves learner-page startup, but it is
          // client-controlled and must never establish administrator status.
          setIsAdmin(false);
          setAdminCheckComplete(false);
          // We don't set user object yet (need Supabase session), but setting authCheckComplete
          // allows ProtectedRoute to render children while Supabase validates in background
          setAuthCheckComplete(true);
          setLoading(false); // PERFORMANCE: Unblock UI immediately on cache hit
        }
        return hasLocalSession;
      } catch (err) {
        console.warn('Eager auth check failed:', err);
        return false;
      }
    };
    const hasLocalSession = eagerCheck();

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
        }

        if (session?.user) {
          setUser(session.user);

          // PERFORMANCE: Use cached profile for instant auth restoration
          const cachedProfile = getCachedProfile();
          if (cachedProfile && cachedProfile.id === session.user.id) {
            // Instant auth with cached data!
            setUserProfile(cachedProfile);
            setIsAdmin(false);
            setAdminCheckComplete(false);
            setAuthCheckComplete(true); // Unblock immediately
            setLoading(false);

            // Background refresh - don't block UI
            (async () => {
              try {
                const refCode =
                  typeof window !== 'undefined'
                    ? window.localStorage.getItem('referral_code')
                    : null;
                const [freshProfile] = await Promise.all([
                  User.me(refCode),
                  User.updateLastActive(), // Parallel!
                ]);
                if (isMounted && freshProfile) {
                  setUserProfile(freshProfile);
                  setCachedProfile(freshProfile);
                  setIsAdmin(freshProfile?.role === 'admin');
                  setAdminCheckComplete(true);
                  pushUserIdentity(freshProfile);
                  if (freshProfile?.id && refCode) {
                    window.localStorage.removeItem('referral_code');
                  }
                }
              } catch (err) {
                console.warn('Background profile refresh failed:', err);
              } finally {
                if (isMounted) setAdminCheckComplete(true);
              }
            })();
            return; // Already unblocked, exit early
          }

          // No cache - fetch profile (but parallelize updateLastActive)
          if (isFetchingProfile.current) return;
          isFetchingProfile.current = true;
          try {
            const refCode =
              typeof window !== 'undefined' ? window.localStorage.getItem('referral_code') : null;

            // PERFORMANCE: Fetch profile and update last_active in parallel
            const [profile] = await Promise.all([
              User.me(refCode),
              User.updateLastActive(), // No longer blocks completion!
            ]);
            if (!isMounted) return;
            setUserProfile(profile);
            setCachedProfile(profile); // Cache for next reload

            const adminStatus = profile?.role === 'admin';
            setIsAdmin(adminStatus);
            setAdminCheckComplete(true);
            pushUserIdentity(profile);

            if (profile?.id && refCode) {
              window.localStorage.removeItem('referral_code');
            }

            // Restore onboarding_completed localStorage if set in DB
            if (profile?.onboarding_completed && typeof window !== 'undefined') {
              window.localStorage.setItem('onboarding_completed', 'true');
            }

            // All checks complete
            setAuthCheckComplete(true);
          } catch (error) {
            console.error('Error getting user profile:', error);
            if (!isMounted) return;
            setUserProfile(null);
            setIsAdmin(false);
            setAdminCheckComplete(true);
            setAuthCheckComplete(true);
          } finally {
            isFetchingProfile.current = false;
          }
        } else {
          // No session found — always mark as complete so the UI can unblock
          // (regardless of whether getSession() returned an error or just null)
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
          setAdminCheckComplete(true);
          clearAdminAccess();
          setAuthCheckComplete(true);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
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

    const setupAuthListener = async () => {
      const { supabase, User } = await getDependencies();
      if (!isMounted) return;

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        console.info(
          'Auth state changed:',
          event,
          session?.user?.id ? 'User ID present' : 'No User ID'
        );

        // Strict handling: Only sign out on explicit SIGNED_OUT event
        if (event === 'SIGNED_OUT') {
          console.warn('Explicit SIGNED_OUT event received. Clearing user session.');
          setUser(null);
          setUserProfile(null);
          setIsAdmin(false);
          setAdminCheckComplete(false);
          clearAdminAccess();
          setAuthCheckComplete(false); // Reset for next login
          clearCachedProfile(); // Clear cached profile on sign out
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('onboarding_completed');
          }
          return;
        }

        // Update local state on token refresh
        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            // Update last_active on token refresh
            User.updateLastActive().catch(() => {});
          }
          return;
        }

        // For other events (SIGNED_IN, INITIAL_SESSION, USER_UPDATED), ensure we have user
        if (session?.user) {
          setUser(session.user); // Update user state with fresh session data

          // Refresh profile only on sign-in and initial load
          // Refresh profile only on sign-in and initial load
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setAdminCheckComplete(false);
            // Immediately fetch profile and admin status
            (async () => {
              if (!isMounted || isFetchingProfile.current) return;
              isFetchingProfile.current = true;
              // NOTE: Do NOT reset authCheckComplete here — doing so causes the
              // Login page to re-enter the infinite spinner if the profile fetch is slow.
              try {
                const refCode =
                  typeof window !== 'undefined'
                    ? window.localStorage.getItem('referral_code')
                    : null;
                const profile = await User.me(refCode);
                if (!isMounted) return;
                setUserProfile(profile);

                const adminStatus = profile?.role === 'admin';
                setIsAdmin(adminStatus);
                setAdminCheckComplete(true);
                pushUserIdentity(profile);

                if (profile?.id && refCode) {
                  window.localStorage.removeItem('referral_code');
                }

                // Restore onboarding_completed localStorage if set in DB
                // This fixes the issue where localStorage is cleared on sign-out
                // but needs to be restored on sign-in
                if (profile?.onboarding_completed && typeof window !== 'undefined') {
                  window.localStorage.setItem('onboarding_completed', 'true');
                }

                // Cache the fresh profile
                setCachedProfile(profile);

                // Update last_active on sign-in (fire and forget - don't block)
                User.updateLastActive().catch(() => {});

                setAuthCheckComplete(true);
              } catch (error) {
                console.error('Error reinforcing user profile:', error);
                setIsAdmin(false);
                setAdminCheckComplete(true);
                setAuthCheckComplete(true); // Still complete even on error
              } finally {
                isFetchingProfile.current = false;
              }
            })();
          }
        } else if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') {
          // Event happened but no user in session?
          // If it's TOKEN_REFRESHED but failed, Supabase might send SIGNED_OUT next.
          // We wait for explicit SIGNED_OUT.
          console.warn(
            `Auth event ${event} received without session user. Waiting for explicit sign out.`
          );
        }
      });

      authListener = data;
    };

    const initializeAuth = () => {
      getUser();
      setupAuthListener().catch((error) => {
        console.warn('Auth listener setup failed:', error);
      });
      refreshGlobalSettings();
    };

    const isAnonymousLanding =
      typeof window !== 'undefined' && window.location.pathname === '/' && !hasLocalSession;

    let idleHandle;
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

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(startDeferred, { timeout: 2500 });
      } else {
        idleHandle = window.setTimeout(startDeferred, 1200);
      }
    } else {
      initializeAuth();
    }

    return () => {
      isMounted = false;
      if (idleHandle !== undefined) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          window.cancelIdleCallback?.(idleHandle);
        }
        window.clearTimeout?.(idleHandle);
      }
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
      if (document.visibilityState === 'visible') refreshGlobalSettings();
    }, GLOBAL_SETTINGS_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshGlobalSettings();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
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
            User.updateLastActive().catch(() => {});
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
    const currentTier = normalizeSubscriptionTier(userProfile.subscription_tier);
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
      trackAppEvent('subscription_purchase', {
        path: window.location.pathname,
        plan_tier: currentTier,
        billing_interval: userProfile.billing_interval || 'monthly',
        value:
          Number.isFinite(subscriptionAmount) && subscriptionAmount > 0
            ? subscriptionAmount
            : undefined,
        currency: subscriptionCurrency || 'BDT',
        source: 'manual_bangladesh',
      });
    }

    setStoredSubscriptionTier(userId, currentTier);
  }, [userProfile]);

  const refreshProfile = useCallback(
    async (userOverride) => {
      const targetUser = userOverride || user;
      if (targetUser) {
        setAdminCheckComplete(false);
        try {
          const { User } = await loadAuthDependencies();
          const refCode =
            typeof window !== 'undefined' ? window.localStorage.getItem('referral_code') : null;
          const profile = await User.me(refCode);
          setUserProfile(profile);

          if (profile?.id && refCode) {
            window.localStorage.removeItem('referral_code');
          }

          // Restore onboarding_completed localStorage if set in DB
          if (profile?.onboarding_completed && typeof window !== 'undefined') {
            window.localStorage.setItem('onboarding_completed', 'true');
          }

          const adminStatus = profile?.role === 'admin';
          setIsAdmin(adminStatus);
          setAdminCheckComplete(true);
          pushUserIdentity(profile);
          return profile;
        } catch (error) {
          console.error('Error refreshing profile:', error);
          setIsAdmin(false);
          setAdminCheckComplete(true);
          throw error;
        }
      }
      return null;
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
      setAuthCheckComplete(false);
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
      maintenance: normalizeMaintenance(globalSettings?.maintenance_mode),
      announcement: normalizeAnnouncement(globalSettings?.public_announcement),
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
