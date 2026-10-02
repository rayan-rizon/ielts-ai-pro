import { describe, it, expect, vi } from 'vitest';
import { getInstitutionHistory } from '../../../supabase/functions/_shared/institutionHistory';
const school = '41c71765-eb41-4b5e-8c52-ffbc343db79e';
function database(role = 'admin', rows: unknown[] = []) {
  const calls: unknown[][] = [];
  const db = {
    from: vi.fn((table: string) => {
      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit', 'lt', 'in', 'ilike'])
        query[method] = (...args: unknown[]) => {
          calls.push([table, method, ...args]);
          return query;
        };
      query.maybeSingle = async () => ({
        data: table === 'users' ? { role } : { id: school },
        error: null,
      });
      query.then = (resolve: (data: unknown) => unknown) =>
        resolve({
          data:
            table === 'institution_audit'
              ? rows
              : [{ auth_id: 'admin-id', full_name: 'Admin Name', role: 'admin' }],
          error: null,
        });
      return query;
    }),
  };
  return { db, calls };
}
describe('institution history authorization and pagination', () => {
  it.each(['user', 'institution_owner'])('denies %s before reading any history', async (role) => {
    const { db } = database(role);
    await expect(
      getInstitutionHistory(db as never, 'actor', { institution_id: school })
    ).rejects.toThrow('Admin required');
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it('scopes history, applies cursor/filter, enriches actor, and returns next cursor', async () => {
    const rows = Array.from({ length: 26 }, (_, i) => ({ id: 100 - i, actor_auth_id: 'admin-id' }));
    const { db, calls } = database('admin', rows);
    const result = await getInstitutionHistory(db as never, 'actor', {
      institution_id: school,
      cursor: '101',
      category: 'pricing',
      search: 'trial',
    });
    expect(result.entries).toHaveLength(25);
    expect(result.next_cursor).toBe('76');
    expect(result.entries[0].actor.full_name).toBe('Admin Name');
    expect(calls).toContainEqual(['institution_audit', 'eq', 'institution_id', school]);
    expect(calls).toContainEqual(['institution_audit', 'lt', 'id', '101']);
    expect(calls).toContainEqual(['institution_audit', 'in', 'action', ['pricing']]);
  });
  it('rejects invalid filters before reading the audit table', async () => {
    const { db } = database();
    await expect(
      getInstitutionHistory(db as never, 'actor', { institution_id: school, cursor: '1,or' })
    ).rejects.toThrow('Invalid history cursor');
    expect(db.from.mock.calls.every(([table]) => table !== 'institution_audit')).toBe(true);
  });
});
