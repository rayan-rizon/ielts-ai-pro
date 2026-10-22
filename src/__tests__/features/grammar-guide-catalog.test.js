import { describe, expect, it } from 'vitest';
import {
  FREE_GRAMMAR_GUIDE_UNIT_COUNT,
  GRAMMAR_GUIDES,
  GRAMMAR_GUIDE_KITS,
  GRAMMAR_UNIT_COUNT,
  getGrammarGuide,
  getGuidesForSkill,
} from '@/features/grammar/data/grammarGuideCatalog';
import { GRAMMAR_SKILL_CODES } from '@/features/grammar/constants';

const units = GRAMMAR_GUIDES.filter((guide) => guide.unit_number);
const reference = GRAMMAR_GUIDES.filter((guide) => !guide.unit_number);

describe('source-derived IELTS Grammar guides', () => {
  it('builds every numbered unit plus the orientation, mixed review and task guides', () => {
    expect(GRAMMAR_UNIT_COUNT).toBe(19);
    expect(units.map((guide) => guide.unit_number)).toEqual(
      Array.from({ length: 19 }, (_, index) => index + 1)
    );
    expect(reference.map((guide) => guide.slug)).toEqual([
      'start-here-how-grammar-lab-works',
      'mixed-ielts-review',
      'grammar-for-writing-task-1',
      'grammar-for-writing-task-2',
      'grammar-for-general-training-letters',
      'grammar-for-speaking',
      'grammar-for-reading-and-listening',
      'common-ielts-grammar-errors',
      'four-week-grammar-study-plan',
    ]);
    expect(new Set(GRAMMAR_GUIDES.map((guide) => guide.slug)).size).toBe(GRAMMAR_GUIDES.length);
  });

  it('teaches every one of the six measured skills', () => {
    GRAMMAR_SKILL_CODES.forEach((skillCode) => {
      expect(getGuidesForSkill(skillCode).length, skillCode).toBeGreaterThan(0);
    });
  });

  it('gives every guide substantive content and a clear label', () => {
    GRAMMAR_GUIDES.forEach((guide) => {
      expect(guide.content_markdown.length, guide.slug).toBeGreaterThan(450);
      expect(guide.label, guide.slug).toBeTruthy();
      expect(getGrammarGuide(guide.slug)?.id).toBe(guide.id);
    });
    units.forEach((guide) => {
      expect(guide.content_markdown).toMatch(/Practice \d+/);
      expect(guide.skill_code).toMatch(/^grammar_/);
    });
  });

  it('does not leak raw markdown artefacts from the workbook into guide text', () => {
    GRAMMAR_GUIDES.forEach((guide) => {
      expect(guide.content_markdown, guide.slug).not.toMatch(/<\/?aside>|⚠️/);
      expect(guide.content_markdown, guide.slug).not.toMatch(/^\s*##\s*$/m);
    });
  });

  it('keeps the whole sequence navigable in both directions', () => {
    expect(GRAMMAR_GUIDES[0].previous_slug).toBeNull();
    GRAMMAR_GUIDES.forEach((guide, index) => {
      if (index > 0) expect(guide.previous_slug).toBe(GRAMMAR_GUIDES[index - 1].slug);
      if (index < GRAMMAR_GUIDES.length - 1) {
        expect(guide.next_slug).toBe(GRAMMAR_GUIDES[index + 1].slug);
      }
    });
    expect(GRAMMAR_GUIDES.at(-1).next_slug).toBeNull();
  });

  it('groups every guide into exactly one part and keeps part counts honest', () => {
    const slugsInParts = GRAMMAR_GUIDE_KITS.flatMap((kit) => kit.guideSlugs);
    expect(slugsInParts.sort()).toEqual(GRAMMAR_GUIDES.map((guide) => guide.slug).sort());
    expect(GRAMMAR_GUIDE_KITS.map((kit) => kit.guideCount)).toEqual([1, 5, 3, 8, 4, 7]);
    GRAMMAR_GUIDE_KITS.filter((kit) => kit.kind === 'practice').forEach((kit) => {
      expect(kit.skills.length, kit.title).toBeGreaterThan(0);
    });
    GRAMMAR_GUIDE_KITS.filter((kit) => kit.kind === 'reference').forEach((kit) => {
      expect(kit.skills, kit.title).toEqual([]);
    });
  });

  it('keeps orientation and the study plan free alongside the three free foundations', () => {
    expect(FREE_GRAMMAR_GUIDE_UNIT_COUNT).toBe(3);
    const free = GRAMMAR_GUIDES.filter((guide) => guide.access_tier === 'free').map(
      (guide) => guide.slug
    );
    expect(free).toEqual([
      'start-here-how-grammar-lab-works',
      ...units.slice(0, 3).map((guide) => guide.slug),
      'four-week-grammar-study-plan',
    ]);
  });
});

describe('workbook answers a learner can actually check', () => {
  it('gives Unit 17 model rewrites instead of pairing claims with generic tips', () => {
    const unit = getGrammarGuide('hedging-and-precision');
    expect(unit.content_markdown).toContain('Heavy social-media use may contribute');
    expect(unit.content_markdown).toContain('## Model answers');
  });

  it('gives full model sentences where the workbook only listed the changed phrase', () => {
    expect(getGrammarGuide('nouns-countability-and-quantity').content_markdown).toContain(
      '_The company bought new equipment._'
    );
    expect(getGrammarGuide('punctuation-for-grammar-accuracy').content_markdown).toContain(
      '_Although the policy was unpopular, it reduced waste._'
    );
  });
});
