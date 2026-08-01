import {
  GEMINI_SCORING_MODEL,
  OPENROUTER_DEEPSEEK_MODEL,
  requestGeminiJson,
  requestOpenRouterDeepSeekJson,
} from '../supabase/functions/_shared/textAiProvider.ts';

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!openRouterApiKey || !geminiApiKey) {
  console.error(
    'Set OPENROUTER_API_KEY and GEMINI_API_KEY in the process environment. This script never accepts keys as command-line arguments.'
  );
  process.exit(1);
}

const simplePrompt = `You are a constrained Academic IELTS grammar transfer evaluator.
Assess only subject-verb agreement and articles. Never output an IELTS band.
Return JSON only in this exact shape:
{"outcome":"pass|needs_repair","groundedExamples":[{"quote":"exact source quote","issue":"short explanation","correction":"corrected wording"}],"explanation":"max 60 words"}

SOURCE TEXT:
Many students believes that the online education is always more effective, but this view ignores the importance of direct discussion.`;

const simpleValidator = (value) =>
  ['pass', 'needs_repair'].includes(String(value?.outcome || '')) &&
  Array.isArray(value?.groundedExamples) &&
  typeof value?.explanation === 'string';

async function timed(label, operation) {
  const startedAt = performance.now();
  const result = await operation();
  return {
    label,
    latencyMs: Math.round(performance.now() - startedAt),
    result,
  };
}

const difficultCases = [
  {
    id: 'writing-rubric',
    prompt: `You are an IELTS Writing Task 2 evaluator. Evaluate the synthetic essay below against the four official criteria.
Do not invent facts, do not award a band from a single sentence, and distinguish language errors from arguable style choices.
Return JSON only with this exact shape:
{"overallBand":0,"criteria":{"taskResponse":0,"coherenceCohesion":0,"lexicalResource":0,"grammar":0},"strengths":["evidence-based point"],"corrections":[{"quote":"exact quote","issue":"criterion-grounded issue","correction":"better wording"}],"uncertainty":["what cannot be judged reliably"]}

ESSAY:
Some people believe universities should focus only on employable skills, while others argue that broad education benefits society. Discuss both views and give your opinion.

Universities are often expected to produce workers for the economy. This view has merit because engineering, nursing and data skills can lead directly to employment, and public investment should have visible returns. However, reducing higher education to immediate job training is short-sighted. Employers also need people who can reason, communicate and adapt when technologies change.

For example, a student who studies history may not enter a history profession, but the student can learn to evaluate evidence and recognise biased narratives. These abilities are useful in journalism, public administration and business. Nevertheless, universities should not ignore labour-market needs: partnerships with employers and practical projects can connect abstract learning with responsible work.

In my view, universities should offer both pathways. Students deserve access to disciplines that develop independent judgement, while every programme should explain how its knowledge and skills transfer to work or civic life. This balanced approach protects the social value of education without treating students as units of production.`,
    maxOutputTokens: 1100,
    temperature: 0.15,
    geminiModel: GEMINI_SCORING_MODEL,
    validateJson: (value) =>
      Number.isFinite(Number(value?.overallBand)) &&
      value?.criteria &&
      ['taskResponse', 'coherenceCohesion', 'lexicalResource', 'grammar'].every((key) =>
        Number.isFinite(Number(value.criteria[key]))
      ) &&
      Array.isArray(value?.strengths) &&
      Array.isArray(value?.corrections) &&
      Array.isArray(value?.uncertainty),
  },
  {
    id: 'speaking-transcript',
    prompt: `You are an IELTS Speaking evaluator using transcript evidence only.
Score fluency/coherence, lexical resource, grammatical range/accuracy, and pronunciation only when acoustic evidence is supplied. Never infer pronunciation from spelling. Penalise neither normal self-correction nor transcript punctuation.
Return JSON only with this exact shape:
{"fluency":0,"lexical":0,"grammar":0,"pronunciation":null,"evidence":[{"criterion":"criterion name","quote":"exact transcript quote","interpretation":"brief evidence-based interpretation"}],"caveat":"one transcript limitation"}

PART 3 TRANSCRIPT:
Examiner: Should cities spend more money on public transport?
Candidate: I think they should, although, um, it depends on the city. In my hometown the buses are cheap but they are not reliable, so people who can afford it buy motorcycles. That creates congestion and, actually, it also makes the air more polluted. If the authority improved the bus frequency and made the routes connected with residential areas, I believe fewer people would need private vehicles. On the other hand, simply building an expensive metro system might not be fair if it only serves the business district. The investment should be planned according to where people live and work, and the government should publish the results so citizens can see whether the money is being used effectively.`,
    maxOutputTokens: 900,
    temperature: 0.1,
    geminiModel: GEMINI_SCORING_MODEL,
    validateJson: (value) =>
      ['fluency', 'lexical', 'grammar'].every((key) => Number.isFinite(Number(value?.[key]))) &&
      (value?.pronunciation === null || Number.isFinite(Number(value?.pronunciation))) &&
      Array.isArray(value?.evidence) &&
      typeof value?.caveat === 'string',
  },
  {
    id: 'learning-path-ranking',
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
writing:argument-support, grammar:articles-transfer, speaking:diagnostic-full, listening:map-labeling, reading:timed-maintenance, vocabulary:review-due`,
    maxOutputTokens: 600,
    temperature: 0.1,
    validateJson: (value) =>
      Array.isArray(value?.rankedActivityKeys) &&
      value.rankedActivityKeys.length === 6 &&
      typeof value?.rationale === 'string' &&
      Array.isArray(value?.safetyChecks),
  },
  {
    id: 'grammar-transfer-grounding',
    prompt: `You are a constrained IELTS Grammar Lab transfer evaluator.
Assess only verb forms, articles/determiners, and clause control. Do not output a band, confidence score, pronunciation judgement, or generic praise. Every repair must quote an exact contiguous substring from SOURCE TEXT. If a phrase is acceptable, do not repair it.
Return JSON only:
{"outcome":"pass|needs_repair","groundedExamples":[{"quote":"exact source substring","targetSkill":"verb_forms|articles_determiners|clause_control","issue":"short evidence-based issue","correction":"corrected wording"}],"correctedVersion":"complete source with only grounded repairs","observations":[{"skillCode":"verb_forms|articles_determiners|clause_control","outcome":"pass|needs_repair|not_observed","evidenceQuotes":["exact quote"],"explanation":"brief"}],"explanation":"max 80 words"}

SOURCE TEXT:
If governments had invested in reliable buses earlier, fewer commuters would have bought cars. In many cities, public transport is treated as an afterthought, although it remains a essential service for workers who cannot drive. The policy makers should have consulted residents before the route was changed, because the new timetable do not reflect how people travel. It is possible that the delays are caused by funding, but this claim needs evidence rather than a assumption.`,
    maxOutputTokens: 1000,
    temperature: 0.1,
    validateJson: (value) =>
      ['pass', 'needs_repair'].includes(String(value?.outcome || '')) &&
      Array.isArray(value?.groundedExamples) &&
      typeof value?.correctedVersion === 'string' &&
      Array.isArray(value?.observations) &&
      typeof value?.explanation === 'string',
  },
];

async function runComparison(testCase) {
  // Intentionally bounded to exactly one request per provider per case and no retries.
  const comparisons = await Promise.all([
    timed(`${testCase.id} / OpenRouter ${OPENROUTER_DEEPSEEK_MODEL}`, () =>
      requestOpenRouterDeepSeekJson({
        prompt: testCase.prompt,
        apiKey: openRouterApiKey,
        temperature: testCase.temperature,
        maxOutputTokens: testCase.maxOutputTokens,
        timeoutMs: 20_000,
        validateJson: testCase.validateJson,
      })
    ),
    timed(`${testCase.id} / ${testCase.geminiModel || 'Gemini 2.5 Flash-Lite'}`, () =>
      requestGeminiJson({
        prompt: testCase.prompt,
        apiKey: geminiApiKey,
        temperature: testCase.temperature,
        maxOutputTokens: testCase.maxOutputTokens,
        timeoutMs: 20_000,
        validateJson: testCase.validateJson,
        geminiModel: testCase.geminiModel,
      })
    ),
  ]);

  for (const comparison of comparisons) {
    console.log(`\n${comparison.label}`);
    console.log(
      JSON.stringify(
        {
          latencyMs: comparison.latencyMs,
          tokens: comparison.result.usage.tokensUsed,
          estimatedCostUsd: comparison.result.usage.estimatedProviderCostUsd,
          output: comparison.result.parsed,
        },
        null,
        2
      )
    );
  }
}

const suite = process.argv.includes('--suite')
  ? process.argv[process.argv.indexOf('--suite') + 1]
  : null;
if (
  suite === 'difficult' ||
  suite === 'difficult-scoring' ||
  suite === 'difficult-grammar' ||
  suite === 'difficult-learning'
) {
  const cases =
    suite === 'difficult-scoring'
      ? difficultCases.slice(0, 2)
      : suite === 'difficult-grammar'
        ? difficultCases.slice(3, 4)
        : suite === 'difficult-learning'
          ? difficultCases.slice(2, 3)
          : difficultCases;
  for (const testCase of cases) await runComparison(testCase);
} else {
  await runComparison({
    id: 'grammar-basic',
    prompt: simplePrompt,
    maxOutputTokens: 700,
    temperature: 0.1,
    validateJson: simpleValidator,
  });
}
