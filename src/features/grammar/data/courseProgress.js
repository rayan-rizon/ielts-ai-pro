import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import { GRAMMAR_GUIDES, getGrammarGuide } from './grammarGuideCatalog';

// The guided path: orientation, then every numbered unit, then the mixed review.
// Task guides and tools are reference material, not steps to finish.
const COURSE_STEPS = GRAMMAR_GUIDES.filter(
  (guide) =>
    guide.unit_number ||
    guide.slug === 'start-here-how-grammar-lab-works' ||
    guide.slug === 'mixed-ielts-review'
);

/**
 * The guide to open next. A guide recommended from the learner's own results
 * comes first; otherwise the first unfinished step of the course they can open.
 */
export function getNextGuide(completedSlugs = [], user, recommendationMap = new Map()) {
  const done = new Set(completedSlugs);
  const canOpen = (guide) =>
    guide && !done.has(guide.slug) && hasContentAccess(user, guide.access_tier);

  // Only recommendations backed by the learner's own answers or test results can
  // jump the queue; the "take the diagnostic first" fallback must not.
  const recommended = [...recommendationMap.values()]
    .filter((item) => !item.sources?.includes('grammar-lab-diagnostic'))
    .sort((a, b) => a.rank - b.rank)
    .map((item) => getGrammarGuide(item.slug))
    .find(canOpen);
  return recommended || COURSE_STEPS.find(canOpen) || null;
}

export function getCourseSummary(completedSlugs = []) {
  const done = new Set(completedSlugs);
  const units = GRAMMAR_GUIDES.filter((guide) => guide.unit_number);
  return {
    totalUnits: units.length,
    completedUnits: units.filter((guide) => done.has(guide.slug)).length,
    hasStarted: GRAMMAR_GUIDES.some((guide) => done.has(guide.slug)),
  };
}

export function getPartProgress(kit, completedSlugs = []) {
  const done = new Set(completedSlugs);
  return {
    total: kit.guideSlugs.length,
    completed: kit.guideSlugs.filter((slug) => done.has(slug)).length,
  };
}

function findNextUnitGuide(skillCode, completedGuideSlugs) {
  return GRAMMAR_GUIDES.find(
    (guide) =>
      guide.unit_number &&
      guide.skill_code === skillCode &&
      !completedGuideSlugs.includes(guide.slug)
  );
}

// A result-based reason once the learner has answered questions in this skill;
// otherwise a nudge to take the diagnostic, which must not jump the queue.
function describeSkillRecommendation(recommendedSkill, guide) {
  const mastery = Number(recommendedSkill.mastery);
  const hasObservedResult =
    Number(recommendedSkill.observations || 0) > 0 && Number.isFinite(mastery);
  if (!hasObservedResult) {
    return {
      reason:
        'Start here, then complete the Grammar Lab diagnostic for a result-based recommendation.',
      source: 'grammar-lab-diagnostic',
    };
  }
  const skillName = String(recommendedSkill.label || guide.kit).toLowerCase();
  return {
    reason: `Your Grammar Lab result shows ${Math.round(mastery * 100)}% mastery in ${skillName}.`,
    source: 'grammar-lab',
  };
}

export function buildRecommendationMap({ recommendations, recommendedSkill, completedGuideSlugs }) {
  const map = new Map(recommendations.map((item, index) => [item.slug, { ...item, rank: index }]));

  // Cross-test recommendations are more specific, so they always win. When one is
  // unavailable, the dashboard's selected Grammar skill still gets a visible,
  // actionable destination instead of only changing the sort order.
  if (map.size || !recommendedSkill?.skillCode) return map;

  const nextGuide = findNextUnitGuide(recommendedSkill.skillCode, completedGuideSlugs);
  if (!nextGuide) return map;

  const { reason, source } = describeSkillRecommendation(recommendedSkill, nextGuide);
  map.set(nextGuide.slug, { slug: nextGuide.slug, rank: 0, reason, sources: [source] });
  return map;
}
