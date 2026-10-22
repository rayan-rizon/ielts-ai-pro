import { describe, expect, it } from 'vitest';
import {
  buildRecommendationMap,
  getCourseSummary,
  getNextGuide,
  getPartProgress,
} from '@/features/grammar/data/courseProgress';
import {
  GRAMMAR_GUIDES,
  GRAMMAR_GUIDE_KITS,
  getGuidesForSkill,
} from '@/features/grammar/data/grammarGuideCatalog';

const free = { subscription_tier: 'free' };
const pro = { subscription_tier: 'pro' };

describe('course progress', () => {
  it('sends a brand-new learner to the start guide, then through the units in order', () => {
    expect(getNextGuide([], free).slug).toBe('start-here-how-grammar-lab-works');
    expect(getNextGuide(['start-here-how-grammar-lab-works'], free).unit_number).toBe(1);
    expect(
      getNextGuide(['start-here-how-grammar-lab-works', 'complete-sentences-and-clauses'], pro)
        .unit_number
    ).toBe(2);
  });

  it('never points a free learner at a locked unit', () => {
    const doneFreeSteps = GRAMMAR_GUIDES.filter(
      (guide) => guide.access_tier === 'free' && guide.slug !== 'four-week-grammar-study-plan'
    ).map((guide) => guide.slug);
    expect(getNextGuide(doneFreeSteps, free)).toBeNull();
    expect(getNextGuide(doneFreeSteps, pro).unit_number).toBe(4);
  });

  it('puts a guide recommended from the learner’s own results first', () => {
    const map = buildRecommendationMap({
      recommendations: [{ slug: 'conditionals', reason: 'Flagged in your Writing.' }],
      completedGuideSlugs: [],
    });
    expect(getNextGuide([], pro, map).slug).toBe('conditionals');
    expect(getNextGuide(['conditionals'], pro, map).slug).toBe('start-here-how-grammar-lab-works');
  });

  it('does not let the no-evidence diagnostic fallback jump ahead of the start guide', () => {
    const map = buildRecommendationMap({
      recommendations: [],
      recommendedSkill: { skillCode: 'grammar_sentence_boundaries', observations: 0 },
      completedGuideSlugs: [],
    });
    expect(map.size).toBe(1);
    expect(getNextGuide([], free, map).slug).toBe('start-here-how-grammar-lab-works');

    const withEvidence = buildRecommendationMap({
      recommendations: [],
      recommendedSkill: { skillCode: 'grammar_clause_control', observations: 8, mastery: 0.4 },
      completedGuideSlugs: [],
    });
    expect(getNextGuide([], pro, withEvidence).unit_number).toBe(5);
  });

  it('recommends the first unfinished unit of the selected skill when no results exist', () => {
    const map = buildRecommendationMap({
      recommendations: [],
      recommendedSkill: { skillCode: 'grammar_word_forms', observations: 0 },
      completedGuideSlugs: [],
    });
    expect([...map.keys()]).toEqual(['word-forms-and-word-families']);
  });

  it('counts only numbered units toward course completion', () => {
    const units = GRAMMAR_GUIDES.filter((guide) => guide.unit_number);
    expect(getCourseSummary([])).toEqual({ totalUnits: 19, completedUnits: 0, hasStarted: false });
    const summary = getCourseSummary([units[0].slug, 'grammar-for-speaking']);
    expect(summary).toEqual({ totalUnits: 19, completedUnits: 1, hasStarted: true });
  });

  it('reports progress per part', () => {
    const foundations = GRAMMAR_GUIDE_KITS.find((kit) => kit.slug === 'sentence-foundations');
    expect(getPartProgress(foundations, foundations.guideSlugs.slice(0, 2))).toEqual({
      total: 5,
      completed: 2,
    });
  });

  it('lists the units behind each skill so a missed question can link to its lesson', () => {
    expect(getGuidesForSkill('grammar_clause_control').map((guide) => guide.unit_number)).toEqual([
      5, 10, 11, 12, 16, 17,
    ]);
    expect(getGuidesForSkill('grammar_word_forms').map((guide) => guide.unit_number)).toEqual([19]);
  });
});
