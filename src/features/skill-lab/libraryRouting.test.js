import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildActivityUrl } from '../learning/utils/activityRoutes';
import { PRACTICE_LIBRARY_ENABLED } from './skills';
afterEach(() => vi.unstubAllEnvs());
describe('library learning path links', () => {
  it('uses the library Practice Lab by default during local development', () => {
    expect(import.meta.env.DEV).toBe(true);
    expect(PRACTICE_LIBRARY_ENABLED).toBe(true);
  });

  it('preserves the exact question type, source result and activity', () => {
    vi.stubEnv('VITE_PRACTICE_LIBRARY_ENABLED', 'true');
    const url = new URL(
      buildActivityUrl({
        module: 'reading',
        activity_type: 'targeted_repair',
        skill_targets: ['reading_matching_headings'],
        source_session_id: 'result',
        id: 'activity',
      }),
      'https://example.test'
    );
    expect(url.pathname).toBe('/practice-lab');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      module: 'reading',
      focus: 'reading:matching_headings',
      sourceId: 'result',
      activityId: 'activity',
    });
  });
  it('preserves full tests and routes writing and speaking to existing practice', () => {
    vi.stubEnv('VITE_PRACTICE_LIBRARY_ENABLED', 'true');
    expect(buildActivityUrl({ module: 'listening', activity_type: 'full_test', id: 'a' })).toBe(
      '/listening?activityId=a'
    );
    for (const module of ['writing', 'speaking'])
      expect(buildActivityUrl({ module, routing: { route: 'practice-lab' }, id: 'a' })).toBe(
        `/${module}?activityId=a`
      );
  });
});
