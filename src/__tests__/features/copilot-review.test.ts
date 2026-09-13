import { describe, it, expect } from 'vitest';
import {
  claimCopilotReview,
  saveCopilotDraft,
} from '../../../supabase/functions/_shared/copilotReview';

// An in-memory conditional UPDATE models the database claim at execution time,
// including competing requests constructed from the same displayed revision.
function database() {
  const row = {
    id: 'action',
    status: 'needs_approval',
    updated_at: 'revision-1',
    expires_at: '2099-01-01',
    content: { message: 'Reviewed copy' },
  };
  const db = {
    from: () => ({
      update: (patch: object) => {
        const predicates: Array<(r: any) => boolean> = [];
        const query = {
          eq: (key: string, value: unknown) => {
            predicates.push((r) => r[key] === value);
            return query;
          },
          in: (key: string, values: unknown[]) => {
            predicates.push((r) => values.includes(r[key]));
            return query;
          },
          gt: (key: string, value: string) => {
            predicates.push((r) => r[key] > value);
            return query;
          },
          select: () => query,
          maybeSingle: async () => {
            await Promise.resolve();
            if (!predicates.every((p) => p(row))) return { data: null, error: null };
            Object.assign(row, patch);
            return { data: { ...row }, error: null };
          },
        };
        return query;
      },
    }),
  };
  return { db, row };
}

describe('Copilot review concurrency', () => {
  it('allows exactly one concurrent approval of a displayed revision', async () => {
    const { db, row } = database();
    const results = await Promise.allSettled([
      claimCopilotReview(db, 'action', 'revision-1', 'admin-a', 'approve'),
      claimCopilotReview(db, 'action', 'revision-1', 'admin-b', 'approve'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(row.status).toBe('approved');
  });
  it('does not overwrite approved copy when an AI rewrite finishes late', async () => {
    const { db, row } = database();
    const original = { ...row };
    await claimCopilotReview(db, 'action', 'revision-1', 'admin', 'approve');
    await expect(
      saveCopilotDraft(db, original, { content: { message: 'Late copy' } })
    ).rejects.toThrow('Action changed');
    expect(row.content.message).toBe('Reviewed copy');
  });
  it('rejects stale revisions, expired actions, and repeat approvals', async () => {
    const { db, row } = database();
    await expect(claimCopilotReview(db, 'action', 'old', 'admin', 'approve')).rejects.toThrow(
      'changed'
    );
    row.expires_at = '2000-01-01';
    await expect(
      claimCopilotReview(db, 'action', 'revision-1', 'admin', 'approve')
    ).rejects.toThrow('expired');
    expect(row.status).toBe('needs_approval');
  });
  it('dismisses without approving and prevents a later send', async () => {
    const { db, row } = database();
    await claimCopilotReview(db, 'action', 'revision-1', 'admin', 'dismiss');
    await expect(
      claimCopilotReview(db, 'action', row.updated_at, 'admin', 'approve')
    ).rejects.toThrow('reviewed');
    expect(row.status).toBe('cancelled');
  });
});
