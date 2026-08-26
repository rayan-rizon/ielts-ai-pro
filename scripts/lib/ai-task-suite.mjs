// The benchmark suite for `npm run ai:bench`: one case per production AI route,
// using the same prompt shape, JSON contract and output budget the edge
// functions use, plus objective graders.
//
// Graders never ask a model to judge a model. Every check is mechanical:
// exact-substring grounding, band plausibility, ordering constraints, word
// limits, and the traps this product actually cares about (inventing a
// pronunciation band without audio, repairing text that is already correct).

const GRAMMAR_SOURCE = `If governments had invested in reliable buses earlier, fewer commuters would have bought cars. In many cities, public transport is treated as an afterthought, although it remains a essential service for workers who cannot drive. The policy makers should have consulted residents before the route was changed, because the new timetable do not reflect how people travel. It is possible that the delays are caused by funding, but this claim needs evidence rather than a assumption.`;

const WRITING_ESSAY = `Universities are often expected to produce workers for the economy. This view has merit because engineering, nursing and data skills can lead directly to employment, and public investment should have visible returns. However, reducing higher education to immediate job training is short-sighted. Employers also need people who can reason, communicate and adapt when technologies change.

For example, a student who studies history may not enter a history profession, but the student can learn to evaluate evidence and recognise biased narratives. These abilities are useful in journalism, public administration and business. Nevertheless, universities should not ignore labour-market needs: partnerships with employers and practical projects can connect abstract learning with responsible work.

In my view, universities should offer both pathways. Students deserve access to disciplines that develop independent judgement, while every programme should explain how its knowledge and skills transfer to work or civic life. This balanced approach protects the social value of education without treating students as units of production.`;

const SPEAKING_TRANSCRIPT = `Examiner: Should cities spend more money on public transport?
Candidate: I think they should, although, um, it depends on the city. In my hometown the buses are cheap but they are not reliable, so people who can afford it buy motorcycles. That creates congestion and, actually, it also makes the air more polluted. If the authority improved the bus frequency and made the routes connected with residential areas, I believe fewer people would need private vehicles. On the other hand, simply building an expensive metro system might not be fair if it only serves the business district. The investment should be planned according to where people live and work, and the government should publish the results so citizens can see whether the money is being used effectively.`;

const LEARNING_PATH_KEYS = [
  'writing:argument-support',
  'grammar:articles-transfer',
  'speaking:diagnostic-full',
  'listening:map-labeling',
  'reading:timed-maintenance',
  'vocabulary:review-due',
];

// --- grader helpers ---------------------------------------------------------

const check = (name, passed, detail = '') => ({ name, passed: Boolean(passed), detail });

const isBand = (value, min = 0, max = 9) =>
  Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;

const isHalfStep = (value) => Number.isFinite(Number(value)) && Math.abs(Number(value) * 2 - Math.round(Number(value) * 2)) < 1e-9;

const wordCount = (value) => String(value || '').trim().split(/\s+/).filter(Boolean).length;

/**
 * True only when the text *asserts* a pronunciation weakness. A model that says
 * "pronunciation weakness not claimed — no audio evidence" is doing the right
 * thing, so negated and evidence-absent sentences do not count.
 */
function assertsPronunciationWeakness(text) {
  return String(text || '')
    .split(/(?<=[.!?;])\s+|\n+/)
    .some((sentence) => {
      const lower = sentence.toLowerCase();
      if (!lower.includes('pronunciation')) return false;
      if (!/\b(weak|weakness|poor|low|deficien|problem|issue|struggl)/.test(lower)) return false;
      return !/\b(not|no|never|cannot|can't|without|unavailable|missing|absent|avoid|unknown|unless)\b/.test(lower);
    });
}

/** Normalised substring test — quotes must come from the source, not be invented. */
function quotesAreGrounded(quotes, source) {
  const haystack = source.replace(/\s+/g, ' ').toLowerCase();
  const ungrounded = quotes.filter(
    (quote) => !haystack.includes(String(quote || '').replace(/\s+/g, ' ').toLowerCase().trim())
  );
  return { grounded: ungrounded.length === 0, ungrounded };
}

// --- cases ------------------------------------------------------------------

export const TASK_SUITE = [
  {
    id: 'grammar-transfer',
    route: 'grammar-transfer',
    label: 'Grammar Lab transfer evaluation',
    maxOutputTokens: 2200,
    temperature: 0.1,
    prompt: `You are a constrained IELTS Grammar Lab transfer evaluator.
Assess only verb forms, articles/determiners, and clause control. Do not output a band, confidence score, pronunciation judgement, or generic praise. Every repair must quote an exact contiguous substring from SOURCE TEXT. If a phrase is acceptable, do not repair it.
Return JSON only:
{"outcome":"pass|needs_repair","groundedExamples":[{"quote":"exact source substring","targetSkill":"verb_forms|articles_determiners|clause_control","issue":"short evidence-based issue","correction":"corrected wording"}],"correctedVersion":"complete source with only grounded repairs","observations":[{"skillCode":"verb_forms|articles_determiners|clause_control","outcome":"pass|needs_repair|not_observed","evidenceQuotes":["exact quote"],"explanation":"brief"}],"explanation":"max 80 words"}

SOURCE TEXT:
${GRAMMAR_SOURCE}`,
    validateJson: (value) =>
      ['pass', 'needs_repair'].includes(String(value?.outcome || '')) &&
      Array.isArray(value?.groundedExamples) &&
      typeof value?.correctedVersion === 'string' &&
      Array.isArray(value?.observations) &&
      typeof value?.explanation === 'string',
    grade(parsed) {
      const quotes = (parsed.groundedExamples || []).map((example) => example?.quote);
      const { grounded, ungrounded } = quotesAreGrounded(quotes, GRAMMAR_SOURCE);
      const corrected = String(parsed.correctedVersion || '').toLowerCase();
      const fixes = [
        ['an essential', 'a essential'],
        ['does not reflect', 'do not reflect'],
        ['an assumption', 'a assumption'],
      ];
      const missed = fixes.filter(([fixed]) => !corrected.includes(fixed)).map(([fixed]) => fixed);
      return [
        check('flags the text as needing repair', parsed.outcome === 'needs_repair', `outcome=${parsed.outcome}`),
        check('every quote is an exact source substring', grounded, ungrounded.length ? `invented: ${ungrounded.join(' | ')}` : ''),
        check('repairs all three real errors', missed.length === 0, missed.length ? `missing: ${missed.join(', ')}` : ''),
        check(
          'leaves the correct conditional alone',
          !corrected.includes('governments have invested') && !corrected.includes('governments invested'),
          'must not "fix" the valid third conditional'
        ),
        check('explanation within 80 words', wordCount(parsed.explanation) <= 80, `${wordCount(parsed.explanation)} words`),
        check('never emits a band', parsed.band === undefined && parsed.overallBand === undefined),
      ];
    },
  },
  {
    id: 'writing-rubric',
    route: 'writing-detailed-feedback',
    label: 'Writing Task 2 rubric scoring',
    maxOutputTokens: 1100,
    temperature: 0.15,
    prompt: `You are an IELTS Writing Task 2 evaluator. Evaluate the essay below against the four official criteria.
Do not invent facts, do not award a band from a single sentence, and distinguish language errors from arguable style choices.
Return JSON only with this exact shape:
{"overallBand":0,"criteria":{"taskResponse":0,"coherenceCohesion":0,"lexicalResource":0,"grammar":0},"strengths":["evidence-based point"],"corrections":[{"quote":"exact quote","issue":"criterion-grounded issue","correction":"better wording"}],"uncertainty":["what cannot be judged reliably"]}

PROMPT: Some people believe universities should focus only on employable skills, while others argue that broad education benefits society. Discuss both views and give your opinion.

ESSAY:
${WRITING_ESSAY}`,
    validateJson: (value) =>
      Number.isFinite(Number(value?.overallBand)) &&
      value?.criteria &&
      ['taskResponse', 'coherenceCohesion', 'lexicalResource', 'grammar'].every((key) =>
        Number.isFinite(Number(value.criteria[key]))
      ) &&
      Array.isArray(value?.strengths) &&
      Array.isArray(value?.corrections) &&
      Array.isArray(value?.uncertainty),
    grade(parsed) {
      const criteria = parsed.criteria || {};
      const quotes = (parsed.corrections || []).map((correction) => correction?.quote);
      const { grounded, ungrounded } = quotesAreGrounded(quotes, WRITING_ESSAY);
      const criterionValues = Object.values(criteria).map(Number);
      return [
        // This essay is a well-organised band 7-8 script. Anything outside the
        // range is a calibration failure, not a matter of taste.
        check('overall band in the 6.5-8.5 reference range', isBand(parsed.overallBand, 6.5, 8.5), `band=${parsed.overallBand}`),
        check('overall band uses half-band steps', isHalfStep(parsed.overallBand)),
        check('all four criteria scored 0-9', criterionValues.every((value) => isBand(value)), JSON.stringify(criteria)),
        check(
          'criteria are consistent with the overall band (within 1.5)',
          criterionValues.every((value) => Math.abs(value - Number(parsed.overallBand)) <= 1.5)
        ),
        check('correction quotes are exact essay substrings', grounded, ungrounded.length ? `invented: ${ungrounded.join(' | ')}` : ''),
        check('gives at least one strength', (parsed.strengths || []).length >= 1),
        check('states what it cannot judge', (parsed.uncertainty || []).length >= 1),
      ];
    },
  },
  {
    id: 'speaking-transcript',
    route: 'speaking-evaluation',
    label: 'Speaking scoring, transcript-only',
    maxOutputTokens: 900,
    temperature: 0.1,
    prompt: `You are an IELTS Speaking evaluator using transcript evidence only.
Score fluency/coherence, lexical resource, grammatical range/accuracy, and pronunciation only when acoustic evidence is supplied. No audio or pronunciation evidence is supplied here. Never infer pronunciation from spelling. Penalise neither normal self-correction nor transcript punctuation.
Return JSON only with this exact shape:
{"fluency":0,"lexical":0,"grammar":0,"pronunciation":null,"evidence":[{"criterion":"criterion name","quote":"exact transcript quote","interpretation":"brief evidence-based interpretation"}],"caveat":"one transcript limitation"}

PART 3 TRANSCRIPT:
${SPEAKING_TRANSCRIPT}`,
    validateJson: (value) =>
      ['fluency', 'lexical', 'grammar'].every((key) => Number.isFinite(Number(value?.[key]))) &&
      (value?.pronunciation === null || Number.isFinite(Number(value?.pronunciation))) &&
      Array.isArray(value?.evidence) &&
      typeof value?.caveat === 'string',
    grade(parsed) {
      const quotes = (parsed.evidence || []).map((item) => item?.quote);
      const { grounded, ungrounded } = quotesAreGrounded(quotes, SPEAKING_TRANSCRIPT);
      const bands = ['fluency', 'lexical', 'grammar'].map((key) => Number(parsed[key]));
      return [
        // The product's hardest safety rule: no audio means no pronunciation band.
        check('refuses to score pronunciation without audio', parsed.pronunciation === null, `pronunciation=${parsed.pronunciation}`),
        check('three bands in the 5.5-8.0 reference range', bands.every((band) => isBand(band, 5.5, 8)), bands.join(' / ')),
        check('bands use half-band steps', bands.every(isHalfStep)),
        check('evidence quotes are exact transcript substrings', grounded, ungrounded.length ? `invented: ${ungrounded.join(' | ')}` : ''),
        check('cites evidence for at least three criteria', new Set((parsed.evidence || []).map((item) => item?.criterion)).size >= 3),
        check('states a transcript limitation', wordCount(parsed.caveat) >= 3),
      ];
    },
  },
  {
    id: 'learning-path-ranking',
    route: 'adaptive-learning-path',
    label: 'Adaptive learning path ranking',
    maxOutputTokens: 600,
    temperature: 0.1,
    prompt: `You are ranking a pre-validated IELTS learning schedule. Use only the supplied evidence and activity keys.
Never invent activities, routes, scores, capacity, or predicted improvement. Rank every key exactly once. Put diagnostic work before optional enrichment when evidence is missing. Return JSON only:
{"rankedActivityKeys":["exact keys"],"rationale":"max 90 words","safetyChecks":["evidence or constraint checked"]}

EVIDENCE:
- Target band: 7.0; exam in 11 weeks; capacity: 210 minutes/week.
- Writing: two recent scored attempts, Task Response 6.5 and Grammar 6.0; recurring issue is unsupported examples.
- Speaking: one scored attempt only; pronunciation evidence is unavailable; do not claim pronunciation weakness.
- Reading: stable 7.5 across three attempts; Listening: 6.5 with map-labeling errors.
- Grammar Lab: four completed transfer attempts; article errors recur in two writing samples.

ACTIVITY KEYS:
${LEARNING_PATH_KEYS.join(', ')}`,
    validateJson: (value) =>
      Array.isArray(value?.rankedActivityKeys) &&
      value.rankedActivityKeys.length === 6 &&
      typeof value?.rationale === 'string' &&
      Array.isArray(value?.safetyChecks),
    grade(parsed) {
      const ranked = parsed.rankedActivityKeys || [];
      const known = ranked.every((key) => LEARNING_PATH_KEYS.includes(key));
      const unique = new Set(ranked).size === LEARNING_PATH_KEYS.length;
      const index = (key) => ranked.indexOf(key);
      return [
        check('ranks only the supplied keys', known, ranked.filter((key) => !LEARNING_PATH_KEYS.includes(key)).join(', ')),
        check('ranks every key exactly once', unique && ranked.length === 6),
        check('weakest evidenced area (writing) in the top two', index('writing:argument-support') >= 0 && index('writing:argument-support') <= 1),
        check('diagnostic before optional enrichment', index('speaking:diagnostic-full') < index('vocabulary:review-due')),
        check('stable reading not prioritised over weak listening', index('listening:map-labeling') < index('reading:timed-maintenance')),
        check('rationale within 90 words', wordCount(parsed.rationale) <= 90, `${wordCount(parsed.rationale)} words`),
        check(
          'does not claim a pronunciation weakness',
          !assertsPronunciationWeakness(
            [parsed.rationale, ...(parsed.safetyChecks || [])].join(' ')
          )
        ),
      ];
    },
  },
];

export function selectCases(filter) {
  if (!filter || filter === 'all') return TASK_SUITE;
  const ids = filter.split(',').map((value) => value.trim());
  const selected = TASK_SUITE.filter((testCase) => ids.includes(testCase.id) || ids.includes(testCase.route));
  if (selected.length === 0) {
    throw new Error(
      `No suite case matches "${filter}". Available: ${TASK_SUITE.map((testCase) => testCase.id).join(', ')}`
    );
  }
  return selected;
}
