import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
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

  it('routes a Grammar checkpoint through the existing scored IELTS test', () => {
    expect(
      buildActivityUrl({
        id: 'checkpoint-1',
        module: 'writing',
        routing: { route: 'writing', mode: 'practice' },
      })
    ).toBe('/writing?mode=practice&activityId=checkpoint-1');
  });

  it('does not infer an unknown activity as Reading', () => {
    expect(buildActivityUrl({ module: 'unknown' })).toBe('/dashboard');
  });

  it('keeps Grammar guides on a dedicated, bookmarkable route', () => {
    const slug = 'verb-forms-across-ielts-tasks';
    expect(`/grammar/guides/${slug}`).toBe('/grammar/guides/verb-forms-across-ielts-tasks');
  });

  it('restores the top of the learner panel whenever the Grammar screen changes', () => {
    const grammarPage = readFileSync(
      resolve(process.cwd(), 'src/features/grammar/pages/GrammarLab.jsx'),
      'utf8'
    );
    expect(grammarPage).toContain('function scrollGrammarPageToTop(pageElement)');
    expect(grammarPage).toContain("overflowY === 'auto' || overflowY === 'scroll'");
    expect(grammarPage).toContain('scrollParent.scrollTo({ top: 0, left: 0');
    expect(grammarPage).toContain('[guideSlug, screen]');
  });
});
