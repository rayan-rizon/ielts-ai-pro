import { supabase } from '@/lib/supabase';
import { emailSchema, signUpSchema } from '@/lib/validations';
import { UserProfile } from '@/types';
import { getCsrfHeaders } from '@/lib/csrf';
import { trackSignupCompleted, pushUserIdentity } from '@/lib/tracking';
import { getMissingSignupProfileFields, getSignupAttribution } from '@/lib/attribution';
import { resolveSignupCountry } from '@/lib/geo';

// Admin list options interface
interface ListOptions {
  orderBy?: string;
  pageSize?: number;
  page?: number;
  filters?: {
    subscription?: string;
    subscriptionStatus?: string;
    role?: string;
    channel?: string;
    inactiveDays?: string | number;
    search?: string;
    [key: string]: any;
  };
}

export const User = {
  async syncSignupContext(profile: any) {
    const patch = getMissingSignupProfileFields(profile, getSignupAttribution());
    if (Object.keys(patch).length === 0) return profile;

    const { data, error } = await supabase
      .from('users')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .is('signup_attribution_recorded_at', null)
      .or('signup_channel.is.null,signup_channel.in.(direct,unknown)')
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[User.me] Failed to synchronize signup context:', error.message);
      return profile;
    }
    return data || profile;
  },

  // Helper function to check if user is admin
  async isAdmin(authId: string | null = null): Promise<boolean> {
    try {
      let userId = authId;
      if (!userId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return false;
        userId = session.user.id;
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', userId)
        .single();

      if (error) return false;
      return userProfile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Helper function to get user role
  async getUserRole(authId: string | null = null): Promise<string | null> {
    try {
      let userId = authId;
      if (!userId) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return null;
        userId = session.user.id;
      }

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', userId)
        .single();

      if (error) return null;
      return userProfile?.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Update latest activity and the private daily activity history atomically.
  async updateLastActive(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return false;

      const { error } = await supabase.rpc('update_user_last_active', {
        user_auth_id: session.user.id,
      });

      if (error) {
        console.warn('Failed to record user activity:', error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Error recording user activity:', error);
      return false;
    }
  },
  async me(referralCode: string | null = null): Promise<UserProfile> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('User not logged in');

    // First, try to find by auth_id
    const { data: profileByAuth, error: authError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileByAuth) {
      const syncedProfile = await this.syncSignupContext(profileByAuth);
      return {
        ...user,
        ...syncedProfile,
        email: user.email!,
        full_name: syncedProfile.full_name || user.user_metadata?.full_name || user.email,
      } as UserProfile;
    }

    if (authError && authError.code !== 'PGRST116') {
      console.warn('[User.me] Error looking up by auth_id:', authError.message);
    }

    // If not found by auth_id, try by email
    const { data: profileByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (profileByEmail) {
      // Update the auth_id to link with current session
      const { data: updatedProfile, error: updateError } = await supabase

        .from('users')
        .update({ auth_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', profileByEmail.id)
        .select()
        .single();

      if (updatedProfile) {
        console.log('[User.me] Linked auth_id to existing profile');
        const syncedProfile = await this.syncSignupContext(updatedProfile);
        return {
          ...user,
          ...syncedProfile,
          email: user.email!,
        } as UserProfile;
      }

      if (updateError) {
        console.warn(
          '[User.me] Failed to link auth_id, returning existing profile:',
          updateError.message
        );
      }

      return {
        ...user,
        ...profileByEmail,
        email: user.email!,
      } as UserProfile;
    }

    if (emailError && emailError.code !== 'PGRST116') {
      console.warn('[User.me] Error looking up by email:', emailError.message);
    }

    // No profile found, create a new one
    console.log('[User.me] No existing profile, creating new one');
    // Country comes from the edge, not from a form field. It is normally
    // already cached from the visit that led here, so this resolves instantly;
    // when it does not, it fails to null rather than delaying account creation.
    const country = await resolveSignupCountry();

    const defaultProfile = {
      auth_id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email,
      role: 'user',
      subscription_tier: 'free',
      onboarding_completed: false,
      ...getSignupAttribution(),
      ...(country ? { country } : {}),
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('users')
      .insert(defaultProfile)
      .select()
      .single();

    if (insertError) {
      console.error('[User.me] Failed to create profile:', insertError.message);
      // Return a default profile object even on error
      return {
        ...user,
        id: undefined,
        auth_id: user.id,
        email: user.email!,
        full_name: defaultProfile.full_name,
        role: 'user',
        subscription_tier: 'free',
        onboarding_completed: false,
      } as UserProfile;
    }

    console.log('[User.me] Created new profile');

    // Set Advanced Matching (hashed email/external_id via fbq('init', ...))
    // before the CompleteRegistration pixel call below. The identity helper
    // is deliberately awaited only for this new-profile path so the browser
    // event has matching data while analytics failures remain non-blocking.
    if (insertedProfile) await pushUserIdentity(insertedProfile);

    // The only point in the app where a brand-new account definitively comes
    // into existence, regardless of provider. Reporting the registration here
    // covers Google OAuth and confirmed-email signups alike; previously only
    // the email/password branch reported, and only when Supabase returned a
    // session immediately, so the large majority of real signups were invisible
    // to Meta. trackSignupCompleted deduplicates per user id.
    trackSignupCompleted({
      userId: insertedProfile?.id || user.id,
      method: user.app_metadata?.provider || 'email',
      email: user.email || null,
      channel: insertedProfile?.signup_channel || defaultProfile.signup_channel,
    });

    // IF this is a new profile and we have a referral code, process it
    if (referralCode && insertedProfile?.id) {
      try {
        console.log('[User.me] Processing referral for new profile:', { referralCode });
        const { data: referralResult, error: referralError } = await supabase.rpc(
          'process_referral',
          {
            p_new_user_id: insertedProfile.id,
            p_referral_code: referralCode,
          }
        );
        if (referralError) {
          console.warn('[User.me] Referral processing failed:', referralError.message);
        } else {
          console.log('[User.me] Referral processed successfully:', referralResult);
          // If successfully processed, we can signal that the code was used
          // Note: We don't clear localStorage here as this is a stateless service,
          // but the successful RPC call is the key action.
        }
      } catch (refErr) {
        console.warn('[User.me] Error calling process_referral:', refErr);
      }
    }

    return {
      ...user,
      ...insertedProfile,
      email: user.email!,
    } as UserProfile;
  },

  async signUp(email: string, password: string, username = '', referralCode: string | null = null) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const normalizedEmail = emailSchema.parse(email);

    try {
      signUpSchema.shape.password.parse(password);
    } catch (e: any) {
      throw new Error(e.errors?.[0]?.message || 'Invalid password');
    }

    const signupAttribution = getSignupAttribution();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        // Auth metadata reaches the database hook even when it creates the
        // public profile before this browser can perform its own insert.
        data: { full_name: username, ...signupAttribution },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;

    // Only create profile if there's an active session (no email confirmation required)
    if (data.session?.user) {
      const u = data.session.user;
      try {
        const profileData: any = {
          auth_id: u.id,
          email: u.email,
          full_name: username || u.user_metadata?.full_name || u.email,
          role: 'user',
          subscription_tier: 'free',
          ...signupAttribution,
        };

        // Note: referred_by is set by the process_referral RPC, not here
        // (referred_by is a UUID, not the referral code string)

        const { data: insertedProfile, error: profileError } = await supabase
          .from('users')
          .insert(profileData)
          .select('id')
          .single();

        if (profileError) {
          console.warn(
            'Profile insert skipped/failed (will be created after login if missing):',
            profileError.message
          );
        }

        // Process the referral after profile is created
        // The RPC expects p_new_user_id to be the public.users.id (profile ID), not auth_id
        if (referralCode && insertedProfile?.id) {
          try {
            const { data: referralResult, error: referralError } = await supabase.rpc(
              'process_referral',
              {
                p_new_user_id: insertedProfile.id,
                p_referral_code: referralCode,
              }
            );
            if (referralError) {
              console.warn('Referral processing failed:', referralError.message);
            } else {
              console.log('Referral processed successfully:', referralResult);
            }
          } catch (refErr) {
            console.warn('Error calling process_referral:', refErr);
          }
        }
      } catch (profileError) {
        console.warn('Profile creation failed during signup:', profileError);
      }
    }

    // Return both user and session so caller can determine if user is actually logged in
    // If session is null, email confirmation is likely required
    return { user: data.user, session: data.session };
  },

  async signInWithGoogle(credential: string, nonce?: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
      nonce: nonce,
    });

    if (error) throw error;

    // Ensure user profile exists after successful login
    if (data?.session?.user) {
      try {
        // This creates/syncs profile using auth_id
        await this.me();
      } catch (profileError) {
        console.warn('Profile check/creation failed after google login:', profileError);
      }
      return data.user;
    }

    return data;
  },

  async signIn(email: string, password: string) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const normalizedEmail = emailSchema.parse(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }

    // Ensure user profile exists after successful login
    if (data.user) {
      try {
        await this.me(); // This will create profile if missing
      } catch (profileError) {
        console.warn('Profile check/creation failed after login:', profileError);
      }
    }

    return data.user;
  },

  async updatePassword(newPassword: string): Promise<boolean> {
    try {
      signUpSchema.shape.password.parse(newPassword);
    } catch (e: any) {
      throw new Error(e.errors?.[0]?.message || 'Invalid password');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  },

  async resetPasswordForEmail(email: string): Promise<boolean> {
    if (!email) throw new Error('Email is required');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
    return true;
  },

  async logout(): Promise<void> {
    try {
      // Try to sign out, but don't fail if the endpoint is unavailable
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error && !this.isNetworkError(error.message)) {
        console.warn('Logout error:', error.message);
      }
    } catch (err: any) {
      // Ignore network errors during logout
      if (!this.isNetworkError(err.message)) {
        console.warn('Logout failed:', err.message);
      }
    }
  },

  // Helper method to check if error is network-related
  isNetworkError(message: string): boolean {
    const networkErrors = [
      'Failed to fetch',
      'ERR_ABORTED',
      'net::ERR_ABORTED',
      'NetworkError',
      'fetch aborted',
      'Connection refused',
    ];
    return networkErrors.some((error) => message.includes(error));
  },

  async updateMyUserData(data: Partial<UserProfile>): Promise<UserProfile> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    // Sanitize payload: convert empty date strings to null to satisfy Postgres date type
    const sanitizePayload = (payload: any) => {
      const out = { ...payload };
      if ('test_date' in out) {
        out.test_date = out.test_date ? out.test_date : null;
        if (out.test_date && !('test_date_source' in out)) {
          out.test_date_source = 'confirmed';
          out.test_date_confirmed_at = new Date().toISOString();
        }
      }
      // Ensure onboarding_completed is a proper boolean
      if ('onboarding_completed' in out) {
        out.onboarding_completed = Boolean(out.onboarding_completed);
      }
      return out;
    };

    const payload = sanitizePayload(data);

    console.log('[User.updateMyUserData] Updating profile with:', {
      auth_id: user.id,
      email: user.email,
      payload,
    });

    // Try the atomic RPC function first (industry-standard approach)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('upsert_user_profile', {
        p_auth_id: user.id,
        p_email: user.email,
        p_updates: payload,
      });

      if (!rpcError && result) {
        console.log('[User.updateMyUserData] RPC success:', result);
        const updatedProfile = result as UserProfile;

        // Also update Auth metadata for things like avatar_url if provided
        if (payload.avatar_url || payload.full_name) {
          try {
            await supabase.auth.updateUser({
              data: {
                avatar_url: payload.avatar_url || updatedProfile.avatar_url,
                full_name: payload.full_name || updatedProfile.full_name,
              },
            });
          } catch (authError) {
            console.warn('[User.updateMyUserData] Failed to update auth metadata:', authError);
          }
        }

        // Dispatch event for AuthContext to sync state across the app
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedProfile }));
        }

        return updatedProfile;
      }

      if (rpcError) {
        console.warn(
          '[User.updateMyUserData] RPC failed, falling back to direct update:',
          rpcError.message
        );
      }
    } catch (rpcErr) {
      console.warn('[User.updateMyUserData] RPC not available, using fallback:', rpcErr);
    }

    // Fallback: Direct update with retry logic
    const baseProfile = {
      ...user,
      id: undefined,
      auth_id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email,
    } as UserProfile;

    // First try to update by auth_id
    const { data: updatedByAuth, error: updateError } = await supabase
      .from('users')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_id', user.id)
      .select()
      .maybeSingle();

    if (!updateError && updatedByAuth) {
      console.log('[User.updateMyUserData] Direct update by auth_id success');

      // Sync Auth metadata
      if (payload.avatar_url || payload.full_name) {
        try {
          await supabase.auth.updateUser({
            data: {
              avatar_url: payload.avatar_url || updatedByAuth.avatar_url,
              full_name: payload.full_name || updatedByAuth.full_name,
            },
          });
        } catch (authError) {
          console.warn(
            '[User.updateMyUserData] Fallback: Failed to update auth metadata:',
            authError
          );
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedByAuth }));
      }

      return updatedByAuth as UserProfile;
    }

    // If auth_id update affected 0 rows, try by email
    if (!updatedByAuth) {
      console.log('[User.updateMyUserData] No row found by auth_id, trying by email');

      const { data: updatedByEmail, error: emailError } = await supabase
        .from('users')
        .update({
          auth_id: user.id, // Link to current auth session
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('email', user.email)
        .select()
        .maybeSingle();

      if (!emailError && updatedByEmail) {
        console.log('[User.updateMyUserData] Update by email success, linked auth_id');

        // Sync Auth metadata
        if (payload.avatar_url || payload.full_name) {
          try {
            await supabase.auth.updateUser({
              data: {
                avatar_url: payload.avatar_url || updatedByEmail.avatar_url,
                full_name: payload.full_name || updatedByEmail.full_name,
              },
            });
          } catch (authError) {
            console.warn(
              '[User.updateMyUserData] Fallback (email): Failed to update auth metadata:',
              authError
            );
          }
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedByEmail }));
        }

        return updatedByEmail as UserProfile;
      }

      // Still no profile found, create a new one
      console.log('[User.updateMyUserData] No existing profile, creating new one');

      const newProfile = {
        auth_id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email,
        role: 'user',
        subscription_tier: 'free',
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('[User.updateMyUserData] Insert failed:', insertError);
        throw insertError;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: inserted }));
      }

      return inserted as UserProfile;
    }

    // Handle update error
    if (updateError) {
      console.error('[User.updateMyUserData] Update failed:', updateError);
      throw updateError;
    }

    // Return base profile as last resort
    return {
      ...baseProfile,
      ...payload,
    } as UserProfile;
  },

  // Admin-only function to list users with pagination support
  // overload: list(orderBy, limit) -> backward compat
  // overload: list({ page, pageSize, orderBy, filters }) -> new standard
  async list(
    arg1: string | ListOptions = 'created_at',
    arg2: number = 10000,
    pageArg: number | null = null
  ): Promise<any> {
    // Check if current user is admin
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    let orderBy = 'created_at';
    let limit = 10000;
    let page: number | null = null;
    let filters: Record<string, any> = {};

    // Detect arguments style
    if (typeof arg1 === 'object' && arg1 !== null) {
      // New object style
      const options = arg1 as ListOptions;
      orderBy = options.orderBy || 'created_at';
      limit = options.pageSize || 10000;
      page = options.page || null;
      filters = options.filters || {};
    } else {
      // Legacy positional style
      orderBy = (arg1 as string) || 'created_at';
      limit = arg2 || 10000;
      page = pageArg;
    }

    let query = supabase.from('users').select('*', { count: page !== null ? 'exact' : undefined });

    // Apply filters matching UserManagement logic (subscription, role)
    if (filters.subscription && filters.subscription !== 'all') {
      query = query.eq('subscription_tier', filters.subscription);
    }
    if (filters.subscriptionStatus === 'cancelling') {
      // Only subscriptions whose current paid period has not ended are actionable.
      query = query
        .eq('cancel_at_period_end', true)
        .not('stripe_subscription_id', 'is', null)
        .gt('subscription_end_date', new Date().toISOString());
    }
    if (filters.subscriptionStatus === 'expiring') {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query
        .in('subscription_tier', ['pro', 'premium'])
        .gt('subscription_end_date', now.toISOString())
        .lte('subscription_end_date', sevenDaysFromNow.toISOString());
    }
    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }
    // First-touch acquisition channel. Rows predating attribution tracking have a
    // NULL signup_channel and surface as "unknown" in the UI, so match both.
    if (filters.channel && filters.channel !== 'all') {
      if (filters.channel === 'unknown') {
        query = query.or('signup_channel.is.null,signup_channel.eq.unknown');
      } else if (filters.channel === 'paid') {
        query = query.in('signup_channel', ['paid_search', 'paid_social']);
      } else {
        query = query.eq('signup_channel', filters.channel);
      }
    }
    // Inactivity filter - filter by last_active or created_at
    if (filters.inactiveDays && filters.inactiveDays !== 'all') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(String(filters.inactiveDays)));
      // Use last_active if available, otherwise fall back to created_at
      query = query.or(
        `last_active.lt.${cutoffDate.toISOString()},and(last_active.is.null,created_at.lt.${cutoffDate.toISOString()})`
      );
      // Exclude admins from inactive filter
      query = query.neq('role', 'admin');
    }
    // Search filter (email or full_name) - rudimentary support
    if (filters.search) {
      // Sanitize search input to prevent PostgREST filter injection
      const safeSearch = filters.search.replace(/[(),]/g, '');
      if (safeSearch.trim()) {
        query = query.or(`email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
      }
    }

    // Date Range / Custom Date filter
    const dateTarget = filters.dateField || 'created_at';
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte(dateTarget, startOfDay);
      } else if (filters.dateRange === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte(dateTarget, d.toISOString());
      } else if (filters.dateRange === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte(dateTarget, d.toISOString());
      } else if (filters.dateRange === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte(dateTarget, startOfMonth);
      } else if (filters.dateRange === 'last_month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999
        ).toISOString();
        query = query.gte(dateTarget, startOfLastMonth).lte(dateTarget, endOfLastMonth);
      } else if (filters.dateRange === 'custom') {
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          query = query.gte(dateTarget, start.toISOString());
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          query = query.lte(dateTarget, end.toISOString());
        }
      }
    } else {
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query = query.gte(dateTarget, start.toISOString());
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte(dateTarget, end.toISOString());
      }
    }

    // Apply sorting
    const isAsc = !orderBy.startsWith('-');
    const column = orderBy.replace('-', '');
    query = query.order(column, { ascending: isAsc });

    // Apply pagination
    if (page !== null && limit) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    if (page !== null) {
      return { data, count };
    }
    return data;
  },

  // Admin-only function to get user by ID
  async getById(id: string) {
    // Check if current user is admin
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  // Admin-only function to update any user
  async update(id: string, updateData: Partial<UserProfile>) {
    // Check if current user is admin
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    // Role escalation protection is enforced by the BEFORE UPDATE trigger on the users table.
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedUser;
  },

  // Delete own account - calls edge function
  async deleteMyAccount() {
    const { data, error } = await supabase.functions.invoke('deleteUser', {
      headers: getCsrfHeaders(),
    });

    if (error) {
      const errorMessage =
        error.message ||
        error.error ||
        (typeof error === 'string' ? error : 'Failed to delete account');
      throw new Error(errorMessage);
    }

    // Sign out locally after successful deletion
    await supabase.auth.signOut({ scope: 'local' });
    return data;
  },

  // Admin function to delete another user - calls edge function
  async adminDeleteUser(targetAuthId: string) {
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase.functions.invoke('deleteUser', {
      body: { targetAuthId },
      headers: getCsrfHeaders(),
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete user');
    }

    return data;
  },

  // Admin function to update another user - calls edge function
  async adminUpdateUser(targetUserId: string, updates: any) {
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase.functions.invoke('updateUser', {
      body: { targetUserId, updates },
      headers: getCsrfHeaders(),
    });

    if (error) {
      throw new Error(error.message || 'Failed to update user');
    }

    return data;
  },

  // Note: Promoting users to admin is done via SQL only.
  // e.g. UPDATE public.users SET role = 'admin' WHERE email = 'user@example.com';

  // Admin function to list inactive users using RPC
  async listInactiveUsers({
    daysInactive = 30,
    page = 1,
    pageSize = 50,
    subscription = null,
  }: {
    daysInactive?: number;
    page?: number;
    pageSize?: number;
    subscription?: string | null;
  } = {}) {
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    const offset = (page - 1) * pageSize;

    // Get users via RPC
    const { data: users, error: usersError } = await supabase.rpc('get_inactive_users', {
      days_inactive: daysInactive,
      page_limit: pageSize,
      page_offset: offset,
      subscription_filter: subscription === 'all' ? null : subscription,
    });

    if (usersError) throw usersError;

    // Get total count
    const { data: count, error: countError } = await supabase.rpc('count_inactive_users', {
      days_inactive: daysInactive,
      subscription_filter: subscription === 'all' ? null : subscription,
    });

    if (countError) throw countError;

    return {
      data: users || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  // Admin function to send inactivity warning email
  async sendInactivityWarning(users: any[], { daysUntilDeletion = 14 } = {}) {
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    if (!users || users.length === 0) {
      throw new Error('No users selected');
    }

    // Import sendEmail dynamically to avoid circular deps
    const { sendEmail } = await import('@/utils/api');

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10;
    const results: any[] = [];

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const promises = batch.map((user: any) =>
        sendEmail({
          to: user.email,
          subject: 'Account Inactivity Notice - IELTS Ai Pro',
          content: `
Hello ${user.full_name || 'Valued User'},

We noticed you haven't logged into your IELTS Ai Pro account for a while. We miss you!

To keep your account active and retain all your progress, please log in within the next ${daysUntilDeletion} days.

If you don't log in, your account may be scheduled for removal to keep our platform secure and clean.

If you no longer wish to use IELTS Ai Pro, no action is needed - your account will be automatically removed.

Have questions? Just reply to this email!

Best regards,
The IELTS Ai Pro Team
          `.trim(),
          from_name: 'IELTS Ai Pro',
        }).catch((err: any) => ({ error: err, email: user.email }))
      );

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const failed = results.filter((r) => r?.error);

    return {
      sent: results.length - failed.length,
      failed: failed.length,
      errors: failed.map((f) => f.email),
    };
  },

  // Admin function to bulk delete users
  async adminBulkDeleteUsers(authIds: string[]) {
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      throw new Error('Admin access required');
    }

    if (!authIds || authIds.length === 0) {
      throw new Error('No users selected');
    }

    const results: any[] = [];

    // Delete users one by one using the existing Edge Function
    for (const authId of authIds) {
      try {
        const { data, error } = await supabase.functions.invoke('deleteUser', {
          body: { targetAuthId: authId },
          headers: getCsrfHeaders(),
        });

        if (error) {
          results.push({ authId, success: false, error: error.message });
        } else {
          results.push({ authId, success: true, data });
        }
      } catch (err: any) {
        results.push({ authId, success: false, error: err.message });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return {
      deleted: successful,
      failed: failed.length,
      errors: failed,
    };
  },
};
