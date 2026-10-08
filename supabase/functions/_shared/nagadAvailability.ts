/**
 * Who may pay with Nagad right now. One rule, used by the checkout (to
 * refuse) and by the payment modal (to show or hide the option), so the two
 * can never disagree.
 *
 * system_settings.nagad_payments.audience: 'off' | 'admins' | 'everyone'.
 * Sandbox credentials are admin-only whatever the setting says: a learner's
 * real wallet cannot pay on Nagad's sandbox.
 */

import type { NagadConfig } from './nagad.ts';

export type NagadAudience = 'off' | 'admins' | 'everyone';

export interface NagadAvailability {
  available: boolean;
  /** Sandbox: payments are verified but grant no plan. */
  testMode: boolean;
}

const AUDIENCES = new Set<NagadAudience>(['off', 'admins', 'everyone']);

/** Missing or unreadable setting means admins only: never open by accident. */
export async function loadNagadAudience(serviceClient: any): Promise<NagadAudience> {
  const { data, error } = await serviceClient
    .from('system_settings')
    .select('value')
    .eq('key', 'nagad_payments')
    .maybeSingle();
  const audience = data?.value?.audience;
  if (error || !AUDIENCES.has(audience)) return 'admins';
  return audience;
}

export function nagadAvailability(
  config: NagadConfig | null,
  audience: NagadAudience,
  isAdmin: boolean
): NagadAvailability {
  if (!config || audience === 'off') return { available: false, testMode: false };
  const testMode = config.environment === 'sandbox';
  const open = !testMode && audience === 'everyone';
  return { available: open || isAdmin, testMode };
}
