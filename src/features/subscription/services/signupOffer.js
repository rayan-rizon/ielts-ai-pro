import { supabase } from '@/lib/supabase';

// The RPC binds the offer to auth.uid(); no client-supplied recipient or dates.
export async function getSignupOffer() {
  const { data, error } = await supabase.rpc('get_signup_subscription_offer');
  if (error) throw error;
  return data?.available ? data : null;
}

export async function getAppliedPromo() {
  const { data, error } = await supabase.rpc('get_applied_subscription_promo');
  if (error) throw error;
  return data;
}
