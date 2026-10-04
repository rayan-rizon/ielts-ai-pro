import { describe, expect, it, vi } from 'vitest';
import { updateSpeakingSessionSummary } from '../../../supabase/functions/_shared/speakingSessionSummary';

function database(row: any, afterRead?: () => void) {
  const writes: any[] = [];
  const from = vi.fn(() => {
    const predicates: Array<() => boolean> = [];
    let payload: any;
    const query: any = {
      select: () => query,
      eq: (key: string, value: any) => {
        predicates.push(() => row[key] === value);
        return query;
      },
      in: (key: string, values: any[]) => {
        predicates.push(() => values.includes(row[key]));
        return query;
      },
      maybeSingle: async () => {
        const snapshot = structuredClone(row);
        afterRead?.();
        return { data: snapshot, error: null };
      },
      update: (updates: any) => {
        payload = updates;
        return query;
      },
      then: (resolve: any) => {
        if (predicates.every((predicate) => predicate())) {
          writes.push(payload);
          Object.assign(row, payload);
        }
        return Promise.resolve({ error: null }).then(resolve);
      },
    };
    return query;
  });
  return { from, writes };
}

describe('Speaking V2 summary versus scoring races', () => {
  it.each(['pending', 'complete'])('leaves a %s evaluation untouched', async (status) => {
    const row = { id: 'session', is_completed: status === 'complete', evaluation_status: status };
    const db = database(row);
    const build = vi.fn(() => ({ content_data: { evaluationPending: false } }));
    await updateSpeakingSessionSummary(db, 'session', build);
    expect(build).not.toHaveBeenCalled();
    expect(db.writes).toHaveLength(0);
  });

  it.each(['pending', 'complete'])(
    'rejects a stale summary if scoring becomes %s after its read',
    async (status) => {
      const report = { finalEvaluation: { overallBand: 7 } };
      const row = {
        id: 'session',
        is_completed: false,
        evaluation_status: 'not_requested',
        content_data: {},
      };
      const db = database(row, () => {
        row.evaluation_status = status;
        row.is_completed = status === 'complete';
        row.content_data = report;
      });
      await updateSpeakingSessionSummary(db, 'session', () => ({
        content_data: { evaluationPending: false },
      }));
      expect(db.writes).toHaveLength(0);
      expect(row.content_data).toEqual(report);
      expect(row.evaluation_status).toBe(status);
    }
  );

  it.each(['not_requested', 'failed'])('updates progress while preserving %s', async (status) => {
    const row = {
      id: 'session',
      is_completed: false,
      evaluation_status: status,
      content_data: { existing: true },
    };
    const db = database(row);
    await updateSpeakingSessionSummary(db, 'session', (session) => ({
      content_data: { ...session.content_data, currentPart: 3 },
    }));
    expect(db.writes).toHaveLength(1);
    expect(row.evaluation_status).toBe(status);
    expect(row.content_data).toEqual({ existing: true, currentPart: 3 });
  });
});
