import { supabase } from '@/lib/supabase';
import { pushUserIdentity, trackSignupCompleted } from '@/lib/tracking';
import { resolveSignupCountry } from '@/lib/geo';

const isRecentSignup = (profile: any) => {
  const age = Date.now() - Date.parse(profile.created_at);
  return age >= 0 && age <= 10 * 60_000;
};

async function processSignupReferral(profile: any, referralCode: string | null) {
  if (!referralCode) return;
  try {
    const { error } = await supabase.rpc('process_referral', {
      p_new_user_id: profile.id,
      p_referral_code: referralCode,
    });
    if (error) console.warn('[User.me] Referral processing failed:', error.message);
  } catch (error) {
    console.warn('[User.me] Referral processing unavailable:', error);
  }
}

// Auth may provision before the browser runs. These operations deduplicate
// registration and referrals without turning a later login into a new signup.
export async function completeRecentSignup(profile: any, user: any, referralCode: string | null) {
  if (!isRecentSignup(profile)) return;
  await pushUserIdentity(profile);
  trackSignupCompleted({
    userId: profile.id,
    method: user.app_metadata?.provider || 'email',
    email: user.email || null,
    channel: profile.signup_channel,
  });
  await processSignupReferral(profile, referralCode);
}

export async function syncNewProfileCountry(profile: any) {
  if (profile.country) return profile;
  if (!isRecentSignup(profile)) return profile;
  const country = await resolveSignupCountry();
  if (!country) return profile;
  const { data } = await supabase
    .from('users')
    .update({ country })
    .eq('id', profile.id)
    .is('country', null)
    .select()
    .maybeSingle();
  return data ? { ...profile, ...data } : profile;
}
