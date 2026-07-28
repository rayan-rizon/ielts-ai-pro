import { describe, expect, it } from 'vitest';
import { buildActivityUrl } from '@/features/learning/utils/activityRoutes';

describe('explicit Learning Path activity routing', () => {
  it('routes Grammar modes, skills, and linked activities explicitly', () => {
    expect(
      buildActivityUrl({
        id: 'activity-1',
        module: 'grammar',
        skill_targets: ['grammar_articles_determiners'],
        routing: { route: 'grammar', mode: 'review' },
      })
    ).toBe('/grammar?mode=review&skill=grammar_articles_determiners&activityId=activity-1');
  });

  it('routes Grammar transfer provenance without changing IELTS module routes', () => {
    expect(
      buildActivityUrl({
        module: 'grammar',
        routing: { route: 'grammar', mode: 'transfer', transferTarget: 'speaking' },
      })
    ).toBe('/grammar?mode=transfer&transfer=speaking');
    expect(
      buildActivityUrl({
        module: 'writing',
        routing: { route: 'writing', mode: 'practice' },
      })
    ).toBe('/writing');
  });

  it('does not infer an unknown activity as Reading', () => {
    expect(buildActivityUrl({ module: 'unknown' })).toBe('/dashboard');
  });
});
