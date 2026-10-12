import { handleWritingFeedback, deleteTemporaryWritingCheckerObject } from './writingEvaluation.ts';
import { finalizeApiUsage } from './security.ts';

export async function processWritingJob(
  db: any,
  slotToken: string,
  evaluate = handleWritingFeedback
) {
  const { data: job, error: claimError } = await db.rpc('claim_writing_feedback', {
    p_slot_token: slotToken,
  });
  if (claimError) throw claimError;
  if (!job) return;
  let status = 503;
  let response: any = { error: 'Writing feedback is temporarily unavailable. Please try again.' };
  try {
    const { data: auth, error: authError } = await db.auth.admin.getUserById(job.authId);
    if (authError || !auth.user) {
      status = 401;
      response = { error: 'Your account is unavailable. Please sign in again.' };
    } else {
      const result = await evaluate(
        new Request('https://ieltsai.pro/internal-writing-job', {
          method: 'POST',
          headers: {
            Origin: 'https://ieltsai.pro',
            'Content-Type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
          },
          body: JSON.stringify(job.payload),
        }),
        { user: auth.user, reservationId: job.reservationId, inputHash: job.inputHash }
      );
      status = result.status;
      response = await result.json();
    }
  } catch (error) {
    console.error('Writing job failed', error instanceof Error ? error.message : 'Unknown error');
  }
  // Invalid input/auth/entitlement is terminal. Network/provider failures can
  // retry twice; completed quota responses are recovered before provider work.
  const retry =
    (status >= 500 ||
      (status === 429 &&
        response?.dailyUsed === undefined &&
        response?.rateLimitType !== 'quota')) &&
    job.attempts < 3;
  if (status !== 200)
    await finalizeApiUsage(
      db,
      job.reservationId,
      0,
      false,
      {
        failureReason: response?.error || 'Writing worker failed',
      },
      'failed'
    );
  const { data: finished, error: finishError } = await db.rpc('finish_writing_feedback', {
    p_job_id: job.id,
    p_slot_token: slotToken,
    p_status: status,
    p_response: response,
    p_retry: retry,
  });
  if (finishError || !finished)
    throw new Error('Writing completion was not acknowledged; lease recovery will retry');
  if (!retry && job.payload.imageUrl) {
    try {
      const url = new URL(job.payload.imageUrl);
      const key = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const origin = Deno.env.get('R2_PUBLIC_URL');
      if (
        origin &&
        url.origin === new URL(origin).origin &&
        key.startsWith(`writing-checker/${job.authId}/`) &&
        !key.includes('..')
      ) {
        await deleteTemporaryWritingCheckerObject(key);
      }
    } catch {
      console.warn('Writing job image cleanup deferred to R2 lifecycle');
    }
  }
  await db.rpc('dispatch_writing_feedback_worker');
}
