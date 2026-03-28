import { supabase } from '@/lib/supabase';
import { User } from '@/features/auth/services/User';

interface TierRateLimitType {
    id: string;
    tier: string;
    currency: string;
    daily_limit: number;
    monthly_limit: number;
    burst_limit: number;
    writing_daily_limit: number;
    writing_monthly_limit: number;
    speaking_daily_limit: number;
    speaking_monthly_limit: number;
    created_at?: string;
    updated_at?: string;
    updated_by?: string;
    [key: string]: any;
}

export const TierRateLimit = {
    // Get all tier limits
    async list(): Promise<TierRateLimitType[]> {
        const { data, error } = await supabase.from('tier_rate_limits').select('*').order('tier').order('currency');

        if (error) throw error;
        return (data as TierRateLimitType[]) || [];
    },

    // Get limit for specific tier and currency
    async getByTier(tier: string, currency: string = 'ALL'): Promise<TierRateLimitType> {
        const { data, error } = await supabase
            .from('tier_rate_limits')
            .select('*')
            .match({ tier, currency: currency.toUpperCase() })
            .single();

        if (error) throw error;
        return data as TierRateLimitType;
    },

    // Update limits for a tier (backwards compatible, defaults to ALL)
    async update(tier: string, updates: Partial<TierRateLimitType>): Promise<TierRateLimitType> {
        return this.upsert(tier, 'ALL', updates);
    },

    // Upsert limits for a tier and currency (admin only)
    async upsert(tier: string, currency: string, updates: Partial<TierRateLimitType>): Promise<TierRateLimitType> {
        const isUserAdmin = await User.isAdmin();
        if (!isUserAdmin) {
            throw new Error('Admin access required');
        }

        // Get current user for updated_by field
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const { data: userProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user?.id)
            .single();

        const { data, error } = await supabase
            .from('tier_rate_limits')
            .upsert(
                {
                    tier,
                    currency: currency.toUpperCase(),
                    ...updates,
                    updated_at: new Date().toISOString(),
                    updated_by: userProfile?.id,
                },
                { onConflict: 'tier,currency' }
            )
            .select()
            .single();

        if (error) throw error;
        return data as TierRateLimitType;
    },
};
