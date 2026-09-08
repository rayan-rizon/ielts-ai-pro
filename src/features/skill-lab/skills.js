export const SKILL_LAB_ENABLED =
  import.meta.env.VITE_SKILL_LAB_ENABLED === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_SKILL_LAB_ENABLED !== 'false');
// Keep local development on the current Practice Lab by default. Production
// still requires an explicit flag so the live cutover remains controlled.
export const PRACTICE_LIBRARY_ENABLED =
  import.meta.env.VITE_PRACTICE_LIBRARY_ENABLED === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_PRACTICE_LIBRARY_ENABLED !== 'false');
const skills = {
  reading: [
    'reading_true_false_not_given',
    'reading_paraphrase_matching',
    'reading_matching_headings',
  ],
  listening: ['listening_distractors', 'listening_answer_limits', 'listening_paraphrase'],
  writing: ['writing_paragraph_support', 'writing_cohesion', 'writing_task1_overview'],
  speaking: ['speaking_answer_extension', 'speaking_organisation', 'speaking_paraphrasing'],
};
export function resolveSkill(module, value = '') {
  const key = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  if (skills[module]?.includes(key)) return key;
  const matches = {
    reading: [
      [/true.*false|not_given/, skills.reading[0]],
      [/paraphras/, skills.reading[1]],
      [/heading/, skills.reading[2]],
    ],
    listening: [
      [/distract|correction/, skills.listening[0]],
      [/spelling|word_limit|number/, skills.listening[1]],
      [/paraphras/, skills.listening[2]],
    ],
    writing: [
      [/support|idea.*develop|task_response/, skills.writing[0]],
      [/cohesion|coherence/, skills.writing[1]],
      [/overview/, skills.writing[2]],
    ],
    speaking: [
      [/extend|develop|relevance/, skills.speaking[0]],
      [/organis|organiz/, skills.speaking[1]],
      [/paraphras/, skills.speaking[2]],
    ],
  };
  return matches[module]?.find(([pattern]) => pattern.test(key))?.[1] || null;
}
export function skillLabUrl({ module, skill, sourceId, activityId } = {}) {
  const params = new URLSearchParams();
  if (PRACTICE_LIBRARY_ENABLED && ['reading', 'listening'].includes(module)) {
    params.set('module', module);
    if (skill)
      params.set('focus', `${module}:${String(skill).replace(new RegExp(`^${module}[_:]`), '')}`);
    if (sourceId) params.set('sourceId', sourceId);
    if (activityId) params.set('activityId', activityId);
    return `/practice-lab?${params}`;
  }
  const supported = resolveSkill(module, skill);
  if (supported) params.set('skill', supported);
  else if (skills[module]) params.set('module', module);
  if (sourceId) params.set('sourceId', sourceId);
  if (activityId) params.set('activityId', activityId);
  return `/practice-lab${params.size ? '?' + params : ''}`;
}
export function getRecommendations(lessons, evidence = [], sessions = [], disputed = []) {
  return lessons
    .map((lesson) => {
      const signals = evidence.filter((e) => resolveSkill(e.module, e.skill_code) === lesson.skill);
      const signal = signals[0];
      const recent = sessions.find((s) => s.skill === lesson.skill && s.completed_at);
      const due = recent?.next_review_at && new Date(recent.next_review_at) <= new Date();
      const reliable = signal?.practice_count >= 5 && signal?.confidence_level >= 0.4;
      return {
        ...lesson,
        due,
        recent,
        reason: disputed.includes(lesson.skill)
          ? 'Try a short check to see how you do.'
          : signal
            ? `${reliable ? 'Your saved results suggest' : 'A few answers suggest'} this could help. ${signal.practice_count} answers recorded.`
            : 'A useful starting lesson. No test result is needed.',
        priority: due ? 0 : reliable && signal.mastery_probability < 0.75 ? 1 : signal ? 2 : 3,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

export function existingPracticeUrl(module, skill = '') {
  if (!['writing', 'speaking'].includes(module)) return null;
  const label = String(skill).toLowerCase();
  if (/grammar|grammatical|agreement|plural subject|verb form|tense|article/.test(label))
    return '/grammar';
  if (/lexical resource|vocabulary|collocation|word choice/.test(label)) return '/vocabulary';
  return null;
}
