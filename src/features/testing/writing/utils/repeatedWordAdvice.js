/**
 * Plain advice for words a learner repeated, with alternatives for the words
 * IELTS candidates most often overuse. A fixed list in code: free, instant and
 * reviewed, rather than asking a model to invent synonyms that may not fit.
 *
 * Alternatives are only offered as options to swap into *some* sentences.
 * Repeating the key word of a topic is normal; using it in every sentence is
 * what limits a Lexical Resource score.
 */

const ALTERNATIVES = {
  people: ['individuals', 'citizens', 'the public'],
  important: ['essential', 'vital', 'significant'],
  good: ['beneficial', 'positive', 'valuable'],
  bad: ['harmful', 'negative', 'damaging'],
  big: ['large', 'considerable', 'substantial'],
  increase: ['rise', 'growth', 'climb'],
  decrease: ['fall', 'decline', 'drop'],
  rise: ['increase', 'growth', 'upward trend'],
  fall: ['decrease', 'decline', 'drop'],
  show: ['illustrate', 'indicate', 'reveal'],
  many: ['numerous', 'a large number of', 'a wide range of'],
  problem: ['issue', 'challenge', 'difficulty'],
  think: ['believe', 'feel', 'would argue'],
  help: ['support', 'assist', 'benefit'],
  change: ['shift', 'transformation', 'alteration'],
  number: ['figure', 'total', 'quantity'],
  percentage: ['proportion', 'share', 'rate'],
  proportion: ['share', 'percentage', 'part'],
  country: ['nation', 'state'],
  government: ['the authorities', 'the state', 'policymakers'],
  children: ['young people', 'the younger generation', 'kids'],
  money: ['funds', 'finances', 'income'],
  student: ['learner', 'pupil', 'undergraduate'],
  make: ['create', 'produce', 'cause'],
  very: ['highly', 'extremely', 'particularly'],
  work: ['employment', 'job', 'career'],
  place: ['location', 'area', 'site'],
  reduce: ['cut', 'lower', 'lessen'],
  traffic: ['congestion', 'vehicles on the road'],
  technology: ['digital tools', 'innovation'],
  society: ['the community', 'the public'],
  satisfied: ['content', 'pleased', 'happy'],
  satisfaction: ['approval', 'contentment'],
  user: ['customer', 'visitor', 'member'],
  highest: ['largest', 'top', 'peak'],
  lowest: ['smallest', 'minimum', 'bottom'],
  small: ['minor', 'modest', 'limited'],
  different: ['various', 'distinct', 'diverse'],
  benefit: ['advantage', 'gain', 'plus'],
  disadvantage: ['drawback', 'downside', 'limitation'],
  advantage: ['benefit', 'strength', 'plus point'],
  improve: ['enhance', 'develop', 'boost'],
  affect: ['influence', 'shape', 'have an impact on'],
  example: ['instance', 'case', 'illustration'],
  life: ['lifestyle', 'way of life', 'daily routine'],
  environment: ['nature', 'the natural world', 'surroundings'],
  pollution: ['contamination', 'emissions'],
  education: ['schooling', 'learning', 'teaching'],
  health: ['wellbeing', 'fitness'],
  result: ['outcome', 'effect', 'consequence'],
  reason: ['cause', 'factor', 'motive'],
  city: ['urban area', 'town', 'metropolis'],
  company: ['business', 'firm', 'organisation'],
  job: ['position', 'role', 'occupation'],
  study: ['learn', 'research', 'take courses'],
  data: ['figures', 'statistics', 'information'],
  graph: ['chart', 'figure', 'diagram'],
  chart: ['graph', 'figure', 'diagram'],
  stage: ['step', 'phase', 'point'],
  process: ['procedure', 'sequence', 'cycle'],
};

/** "students" → "student", "increased" → "increase", "showing" → "show". */
function baseForms(word) {
  const lower = word.toLowerCase();
  return [
    lower,
    lower.replace(/ies$/, 'y'),
    lower.replace(/es$/, ''),
    lower.replace(/s$/, ''),
    lower.replace(/ed$/, ''),
    lower.replace(/ed$/, 'e'),
    lower.replace(/ing$/, ''),
    lower.replace(/ing$/, 'e'),
  ];
}

export function alternativesFor(word) {
  const key = baseForms(word).find((form) => ALTERNATIVES[form]);
  return key ? ALTERNATIVES[key] : [];
}

/**
 * Whether this repetition is worth acting on, in one plain sentence, and
 * what to use instead.
 */
export function adviceForRepeatedWord({ word, count }) {
  const alternatives = alternativesFor(word);
  const severity = count >= 5 ? 'high' : 'some';
  const verdict =
    severity === 'high'
      ? `Using “${word}” ${count} times is a lot. Examiners notice it, and it can lower your Lexical Resource score.`
      : `You used “${word}” ${count} times. That is fine, but changing it once or twice shows a wider range.`;
  const tip = alternatives.length
    ? 'Swap it in some sentences, not all of them. Keep it where it is the clearest word.'
    : 'Try “it”, “they” or “this” when the meaning is clear, or describe it another way.';
  return { severity, verdict, tip, alternatives };
}
