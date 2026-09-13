// A conditional UPDATE is the claim: only one reviewer can win a revision.
// External delivery happens afterwards and is never retried implicitly.
export async function claimCopilotReview(
  db: any,
  id: string,
  revision: string,
  profileId: string,
  decision: 'approve' | 'dismiss'
) {
  if (!revision) throw new Error('Refresh this action before reviewing it');
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('marketing_interventions')
    .update({
      status: decision === 'approve' ? 'approved' : 'cancelled',
      approved_by: decision === 'approve' ? profileId : null,
      approved_at: decision === 'approve' ? now : null,
      ...(decision === 'approve' ? { outcome: {} } : {}),
      suppression_reason: decision === 'dismiss' ? 'admin_dismissed' : null,
      updated_at: now,
    })
    .eq('id', id)
    .eq('updated_at', revision)
    .in('status', ['needs_approval', 'prepared'])
    .gt('expires_at', now)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error('This action changed, expired, or was already reviewed. Refresh to continue.');
  return data;
}

export async function saveCopilotDraft(db: any, intervention: any, patch: any) {
  const { data, error } = await db
    .from('marketing_interventions')
    .update(patch)
    .eq('id', intervention.id)
    .eq('updated_at', intervention.updated_at)
    .in('status', ['needs_approval', 'prepared'])
    .gt('expires_at', new Date().toISOString())
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error('Action changed while drafting. Refresh to review the current message.');
}
