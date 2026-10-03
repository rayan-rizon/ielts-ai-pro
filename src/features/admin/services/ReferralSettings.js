import { supabase } from '@/lib/supabase';

/**
 * Service for managing referral reward tiers (admin only)
 */
export const ReferralSettings = {
  /**
   * List all reward tiers
   */
  async list() {
    const { data, error } = await supabase
      .from('referral_reward_tiers')
      .select('*')
      .order('referrals_required', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Create a new reward tier
   */
  async create(tier) {
    const { data, error } = await supabase
      .from('referral_reward_tiers')
      .insert({
        referrals_required: tier.referrals_required,
        extra_days: tier.extra_days || 0,
        writing_credits: tier.writing_credits || 0,
        speaking_credits: tier.speaking_credits || 0,
        is_active: tier.is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing reward tier
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('referral_reward_tiers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a reward tier
   */
  async delete(id) {
    const { error } = await supabase.from('referral_reward_tiers').delete().eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Toggle tier active status
   */
  async toggleActive(id, isActive) {
    return this.update(id, { is_active: isActive });
  },

  /**
   * Get referral statistics (admin)
   */
  async getStats() {
    const { data, error } = await supabase.rpc('get_admin_referral_stats', {}, { get: true });
    if (error) throw error;
    return data;
  },
};

export default ReferralSettings;
