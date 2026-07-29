import { describe, expect, it } from 'vitest';
import {
  GRAMMAR_GUIDES,
  GRAMMAR_GUIDE_KITS,
  getGrammarGuide,
} from '@/features/grammar/data/grammarGuideCatalog';

describe('source-derived IELTS Grammar guides', () => {
  it('builds all 18 workbook units and four ordered learning kits', () => {
    expect(GRAMMAR_GUIDES).toHaveLength(18);
    expect(GRAMMAR_GUIDE_KITS).toHaveLength(4);
    expect(GRAMMAR_GUIDE_KITS.map((kit) => kit.guideCount)).toEqual([5, 3, 8, 2]);
    expect(GRAMMAR_GUIDES.map((guide) => guide.unit_number)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1)
    );
  });

  it('gives every guide substantive source content, practice, and a measured skill target', () => {
    const slugs = new Set(GRAMMAR_GUIDES.map((guide) => guide.slug));
    expect(slugs.size).toBe(18);

    GRAMMAR_GUIDES.forEach((guide) => {
      expect(guide.content_markdown.length).toBeGreaterThan(450);
      expect(guide.content_markdown).toMatch(/Practice \d+/);
      expect(guide.skill_code).toMatch(/^grammar_/);
      expect(getGrammarGuide(guide.slug)?.id).toBe(guide.id);
    });
  });

  it('keeps the workbook sequence navigable in both directions', () => {
    expect(GRAMMAR_GUIDES[0].previous_slug).toBeNull();
    expect(GRAMMAR_GUIDES[0].next_slug).toBe(GRAMMAR_GUIDES[1].slug);
    expect(GRAMMAR_GUIDES[17].previous_slug).toBe(GRAMMAR_GUIDES[16].slug);
    expect(GRAMMAR_GUIDES[17].next_slug).toBeNull();
  });
});
