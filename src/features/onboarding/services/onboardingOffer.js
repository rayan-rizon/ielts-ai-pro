import { supabase } from '@/lib/supabase';

/**
 * Records what the onboarding plan offer did, for the admin funnel.
 *
 * PostHog already receives the same three moments, but the admin panel reads
 * Postgres — without this the offer is invisible to the person deciding whether
 * it is worth keeping. The server owns the timestamps and the write-once rules;
 * this only names the step.
 *
 * Never blocks the learner: a failed write costs one row of funnel data, and
 * refusing to advance them because analytics failed would be a far worse trade.
 */
export const recordOnboardingOffer = (step, tier = null) =>
  supabase
    .rpc('record_onboarding_offer', { p_step: step, p_tier: tier })
    .then(({ error }) => {
      if (error) console.warn('[onboarding] offer step not recorded:', error.message);
    })
    .catch((error) => {
      console.warn('[onboarding] offer step not recorded:', error?.message || error);
    });
