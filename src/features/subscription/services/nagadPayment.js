import { supabase } from '@/lib/supabase';
import { requirePublicEnv } from '@/lib/publicEnv';
import { OUTAGE_COPY } from '@/lib/serviceOutage';

const SUPABASE_URL = requirePublicEnv('VITE_SUPABASE_URL');

async function callFunction(name, body, method = 'POST') {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    const error = new Error('Please sign in again to continue.');
    error.code = 'signed_out';
    throw error;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });

  // A downed gateway answers with an HTML page, not JSON.
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* handled below */
  }
  if (!response.ok || !data) {
    const error = new Error(
      response.status >= 500 && !data?.error
        ? OUTAGE_COPY.checkout
        : data?.error || 'Something went wrong. Please try again.'
    );
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

/**
 * Whether this learner may pay with Nagad now, and whether it is a sandbox
 * test. The server decides (rollout setting + admin role + credentials), so
 * the modal and the checkout always agree. Any failure reads as unavailable.
 */
export async function getNagadAvailability() {
  try {
    const data = await callFunction('nagad-checkout', null, 'GET');
    return { available: data.available === true, testMode: data.testMode === true };
  } catch {
    return { available: false, testMode: false };
  }
}

/**
 * Open a Nagad payment for the plan the card shows. Resolves with the Nagad
 * page to send the learner to; the server prices the plan and refuses if the
 * amount no longer matches `expectedAmount`.
 */
export function startNagadCheckout({ tier, interval, expectedAmount, attribution }) {
  return callFunction('nagad-checkout', {
    tier,
    interval,
    expected_amount: expectedAmount,
    marketing_campaign_id: attribution?.campaignId || null,
    marketing_delivery_id: attribution?.deliveryId || null,
  });
}

/** Current state of one of the learner's own Nagad orders. */
export function fetchNagadPaymentStatus(orderId) {
  return callFunction('nagad-payment-status', { order_id: orderId });
}
