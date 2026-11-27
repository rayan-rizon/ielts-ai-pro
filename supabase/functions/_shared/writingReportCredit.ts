/*
 * A report translation costs one writing task review. It is recorded under the
 * marking endpoint because that is what the writing allowance counts. It is
 * charged once per learner, report and language; a failed run is given back.
 */
export const CREDIT_ENDPOINT = 'generateDetailedFeedback';

export type Credits = {
  /** The atomic quota reservation used for marking. */
  reserve: (
    authId: string,
    key: string,
    metadata: Record<string, unknown>
  ) => Promise<{ allowed: boolean; reservationId?: string; alreadyReserved?: boolean }>;
  finalize: (
    reservationId: string,
    succeeded: boolean,
    metadata: Record<string, unknown>
  ) => Promise<unknown>;
};

export class CreditError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string
  ) {
    super(message);
  }
}

async function alreadyPaid(db: any, profileId: string, key: string) {
  const { data, error } = await db
    .from('ai_api_usage')
    .select('request_metadata')
    .eq('user_id', profileId)
    .eq('endpoint', CREDIT_ENDPOINT)
    .eq('request_metadata->>idempotencyKey', key)
    .maybeSingle();
  if (error) throw new Error('Could not check the writing allowance');
  return data?.request_metadata?.reservationStatus === 'completed';
}

type Charge = {
  db: any;
  credits: Credits;
  authId: string;
  profileId: string;
  key: string;
  agreed: boolean;
  metadata: Record<string, unknown>;
};

async function reserved({ credits, authId, key, metadata }: Charge) {
  const reservation = await credits.reserve(authId, key, metadata);
  if (!reservation.allowed || !reservation.reservationId)
    throw new CreditError(429, 'You have no writing reviews left right now.', 'no_credit');
  if (reservation.alreadyReserved)
    throw new CreditError(409, 'This translation is already being prepared.', 'rate_limited');
  return reservation.reservationId;
}

/** Runs `work`, charging for it unless this learner has already paid. */
export async function withCredit<T>(charge: Charge, work: () => Promise<T>): Promise<T> {
  if (await alreadyPaid(charge.db, charge.profileId, charge.key)) return work();
  if (!charge.agreed)
    throw new CreditError(402, 'Translating this report uses one task review.', 'credit_required');

  const reservationId = await reserved(charge);
  let result: T;
  try {
    result = await work();
  } catch (error) {
    await charge.credits.finalize(reservationId, false, charge.metadata);
    throw error;
  }
  await charge.credits.finalize(reservationId, true, charge.metadata);
  return result;
}
