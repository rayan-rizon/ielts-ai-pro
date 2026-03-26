import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/features/auth/services/User';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { setupCrossTabSync } from '@/lib/sessionLock';

const AuthContext = createContext();

// Session cache helpers for instant auth restoration
const PROFILE_CACHE_KEY = 'auth_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  } catch {}
};

const clearCachedProfile = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const isFetchingProfile = React.useRef(false);
  const getLocalOnboardingCompleted = () => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('onboarding_completed');
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    // PERFORMANCE: Immediate check for cached session/profile to skip "Verifying access..."
    // We look for the Supabase session token in localStorage to see if a user WAS logged in
    const eagerCheck = () => {
      try {
        const cachedProfile = getCachedProfile();
        // Look for Supabase local storage keys (standard pattern is sb-[project-id]-auth-token)
        const hasLocalSession = Object.keys(localStorage).some((key) => key.includes('auth-token'));

        if (cachedProfile && hasLocalSession) {
          console.log('[Auth] Eager cache hit. Unblocking UI instantly.');
          setUserProfile(cachedProfile);
          setIsAdmin(cachedProfile?.role === 'admin');
          // We don't set user object yet (need Supabase session), but setting authCheckComplete
          // allows ProtectedRoute to render children while Supabase validates in background
          setAuthCheckComplete(true);
          setLoading(false); // PERFORMANCE: Unblock UI immediately on cache hit
        }
      } catch (err) {
        console.warn('Eager auth check failed:', err);
      }
    };
    eagerCheck();

    const getUser = async () => {
      try {
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
            setIsAdmin(cachedProfile?.role === 'admin');
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
                  if (freshProfile?.id && refCode) {
                    window.localStorage.removeItem('referral_code');
                  }
                }
              } catch (err) {
                console.warn('Background profile refresh failed:', err);
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
            setAuthCheckComplete(true);
          } finally {
            isFetchingProfile.current = false;
          }
        } else {
          // Only set to null if we successfully checked and there is NO session
          if (!session && !error) {
            setUser(null);
            setUserProfile(null);
            setIsAdmin(false);
            setAuthCheckComplete(true);
          }
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        if (!isMounted) return;
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Defer the initial check slightly to prioritize First Meaningful Paint
    // and Largest Contentful Paint of the landing page
    const checkTimer = setTimeout(
      () => {
        getUser();
      },
      typeof window !== 'undefined' && window.location.pathname === '/' ? 100 : 0
    );

    // Setup cross-tab session sync
    // When another tab refreshes the token, we get notified and update our state
    const cleanupCrossTabSync = setupCrossTabSync(supabase, (newSession) => {
      if (isMounted && newSession?.user) {
        console.log('[CrossTabSync] Session updated from another tab');
        setUser(newSession.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log(
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
          // Immediately fetch profile and admin status
          (async () => {
            if (!isMounted || isFetchingProfile.current) return;
            isFetchingProfile.current = true;
            setAuthCheckComplete(false); // Reset while checking
            try {
              const refCode =
                typeof window !== 'undefined' ? window.localStorage.getItem('referral_code') : null;
              const profile = await User.me(refCode);
              if (!isMounted) return;
              setUserProfile(profile);

              const adminStatus = profile?.role === 'admin';
              setIsAdmin(adminStatus);

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

    const loadGlobalSettings = async () => {
      try {
        const settings = await SystemSetting.getAll();
        if (isMounted) setGlobalSettings(settings);
      } catch (e) {
        console.error('AuthContext: Failed to load system settings', e);
      } finally {
        if (isMounted) setSettingsLoading(false);
      }
    };

    // Load global settings
    loadGlobalSettings();

    return () => {
      isMounted = false;
      clearTimeout(checkTimer);
      cleanupCrossTabSync();
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Revalidate session when tab becomes visible
  // This ensures the session is still valid after returning from another tab
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (!error && session?.user) {
            setUser(session.user);
            console.log('[Visibility] Session revalidated on tab focus');
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
      console.log('User profile updated event received:', event.detail);
      setUserProfile((prev) => ({ ...prev, ...event.detail }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [user]);

  const refreshProfile = useCallback(
    async (userOverride) => {
      const targetUser = userOverride || user;
      if (targetUser) {
        try {
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
          return profile;
        } catch (error) {
          console.error('Error refreshing profile:', error);
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

  const signOut = useCallback(async () => {
    try {
      await User.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setAuthCheckComplete(false);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('onboarding_completed');
      }
    }
  }, []);

  // Helper function to check if current user is admin
  const checkIsAdmin = useCallback(async (userId = null) => {
    try {
      const adminStatus = await User.isAdmin(userId);
      if (adminStatus) {
        setIsAdmin(true);
      }
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, []);

  const localOnboardingCompleted = React.useMemo(
    () => getLocalOnboardingCompleted(),
    [userProfile]
  );
  const mergedUser = userProfile ? { ...user, ...userProfile } : user;
  const finalUser =
    mergedUser && localOnboardingCompleted !== null && mergedUser.onboarding_completed == null
      ? { ...mergedUser, onboarding_completed: localOnboardingCompleted }
      : mergedUser;

  const contextValue = useMemo(
    () => ({
      user: finalUser,
      userProfile,
      loading,
      authCheckComplete,
      isAdmin,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      checkIsAdmin,
      globalSettings,
      settingsLoading,
    }),
    [
      finalUser,
      userProfile,
      loading,
      authCheckComplete,
      isAdmin,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      checkIsAdmin,
      globalSettings,
      settingsLoading,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue} data-oid="e:4.tfn">
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
