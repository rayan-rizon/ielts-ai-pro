/**
 * Official IELTS Speaking Band Descriptors
 * Based on the public IELTS Speaking Band Descriptors (Assessment Criteria)
 *
 * These descriptors are used to evaluate speaking performance across 4 criteria:
 * - Fluency and Coherence
 * - Lexical Resource
 * - Grammatical Range and Accuracy
 * - Pronunciation
 */
import { averageBandScores } from './evaluationUtils.ts';

export interface BandDescriptor {
  band: number;
  fluency: string;
  lexical: string;
  grammar: string;
  pronunciation: string;
}

// NOTE: IELTS_BAND_DESCRIPTORS array and getBandDescriptor() were removed as dead code.
// They were defined here but never imported anywhere in the codebase.
// The evaluation prompt below uses condensed anchor bands directly.

/**
 * Generate the evaluation prompt with condensed IELTS Band Descriptors
 * Optimized for token efficiency — uses 3 anchor bands instead of 5 full descriptors
 */
export function generateEvaluationPrompt(
  fullConversation: string,
  partNumber: number | 'full'
): string {
  const partContext =
    partNumber === 'full' ? 'the COMPLETE speaking test (all 3 parts)' : `Part ${partNumber}`;

  return `You are a senior IELTS speaking evaluator conducting an IELTS-aligned practice assessment of ${partContext}.
Calibrate the feedback against the public IELTS Speaking band descriptors without claiming this is an official examiner result.

**TRANSCRIPT:**
${fullConversation}

**PRE-SCORING RULES (execute before assigning any band):**

Rule 1 — Audio availability check:
- If the transcript section "=== PRONUNCIATION & FLUENCY ASSESSMENT (from audio analysis) ===" IS present: use that data as PRIMARY evidence for Pronunciation and Fluency.
- If that section is NOT present (text-only transcript): set pronunciation to null and leave criterionNotes.pronunciation as an empty string. Score the transcript evidence for Fluency & Coherence, Lexical Resource, and Grammatical Range & Accuracy. Never infer pronunciation, accent, intonation, stress, pace, pauses, or intelligibility from punctuation or wording in a transcript.

Rule 2 — Response length calibration for Fluency & Coherence:
- Estimate the total candidate word count per part from the transcript.
- Treat short responses as limited evidence of sustained speech and idea development. Do not apply invented word-count-to-band conversion tables.
- Part 2 should normally demonstrate an extended turn. If it is brief, explain which Fluency & Coherence features were not demonstrated rather than imposing an automatic numeric ceiling.
- Very short Part 1 or Part 3 answers should affect the score only where they limit continuity, coherence, or development actually demonstrated.

**SCORING CONTEXT:**
- Transcripts are ASR-generated: ignore spelling and punctuation in the transcript itself.
- Focus on LEXICAL CHOICES, GRAMMATICAL ACCURACY, RANGE, and COHERENCE visible in the text.
- Without audio evidence, Fluency & Coherence may use response development and logical continuity, but must not claim evidence about speech rate, pausing, hesitation, or self-correction.
- Be calibrated and honest. Over-scoring provides false confidence. Under-scoring discourages genuine ability.

**BAND ANCHOR DESCRIPTORS:**
Fluency & Coherence:
- 9: Speaks fluently with only rare repetition or self-correction. Develops topics fully and coherently.
- 8: Fluent with only occasional hesitation. Sequences and develops ideas coherently.
- 7: Speaks at length with some repetition or self-correction. Generally coherent, some loss of coherence on complex topics.
- 6: Willing to speak at length but inconsistently. Some coherence issues; some repetition.
- 5: Usually maintains flow but frequent repetition/self-correction. Some incoherence.
- 4 and below: Frequent pauses, repetition, loss of coherence.

Lexical Resource:
- 9: Uses vocabulary with full flexibility and precision. Uses paraphrase naturally.
- 8: Wide resource, mostly precise. Some flexibility in less familiar topics.
- 7: Good range with some less common vocabulary. Some imprecision or inappropriate use.
- 6: Adequate resource for familiar topics. Limited range on complex topics. Some inappropriate use.
- 5: Limited vocabulary. Difficulty expressing ideas on unfamiliar topics.

Grammatical Range & Accuracy:
- 9: Wide range of structures naturally and accurately.
- 8: Wide range, mostly accurate. Only occasional slips.
- 7: Mix of complex and simple structures. Some errors but not systematic.
- 6: Mix of structures. Errors occur but generally does not impede communication.
- 5: Basic sentence forms mostly accurate. Limited range. Frequent errors in complex forms.

Pronunciation (score only if audio data is provided above):
- 9: Uses a full range of pronunciation features with precision and subtlety; is effortless to understand.
- 8: Wide range of features. Minor L1 influence. Very easy to understand.
- 7: Generally clear. L1 influence evident. Occasional misunderstanding possible.
- 6: Intelligible. Consistent L1 features. Some listener effort required.
- 5: Frequent pronunciation errors causing some listener difficulty.

**CONCISE REPORT RULES:**
- Avoid repeating the same issue across feedback, criterionNotes, improvements, and targetBandTips.
- feedback: maximum 2 short sentences.
- criterionNotes fields: maximum 1 sentence each.
- strengths: exactly 2-3 short bullets, each under 16 words.
- improvements: exactly 2-3 items, each tip under 22 words.
- targetBandTips: 1 sentence only, focused on the single highest-impact next action.

**OUTPUT FORMAT (JSON ONLY — no markdown, no extra text):**
{
  "fluency": <0–9.0 in 0.5 steps>,
  "lexical": <0–9.0 in 0.5 steps>,
  "grammar": <0–9.0 in 0.5 steps>,
  "pronunciation": <0–9.0 in 0.5 steps, OR null if no audio data>,
  "feedback": "<2 sentence overall performance summary — cite specific evidence from the transcript>",
  "partScores": {
    "part1": { "band": <score>, "keyObservation": "<1 sentence specific to Part 1 performance>" },
    "part2": { "band": <score>, "keyObservation": "<1 sentence specific to Part 2, note word length if short>" },
    "part3": { "band": <score>, "keyObservation": "<1 sentence specific to Part 3 analytical ability>" }
  },
  "criterionNotes": {
    "fluency": "<1 short sentence with transcript evidence; do not repeat feedback>",
    "lexical": "<1 short sentence with vocabulary evidence; do not repeat feedback>",
    "grammar": "<1 short sentence naming specific grammar errors, or accuracy if none found>",
    "pronunciation": "<audio-based notes if data is present, otherwise an empty string>"
  },
  "strengths": ["<short evidenced strength>", "<short evidenced strength>", "<short evidenced strength>"],
  "improvements": [
    {
      "area": "<criterion name>",
      "tip": "<short actionable fix. If Part 2 was short, first tip MUST be about extending length. Correct grammar specifically before style advice.>"
    }
  ],
  "targetBandTips": "<1 short sentence matched to the candidate's actual band level>"
}`;
}

/**
 * Calculate IELTS overall band score (average rounded to nearest 0.5)
 */
export function calculateOverallBand(
  fluency: number | null,
  lexical: number | null,
  grammar: number | null,
  pronunciation: number | null
): number | null {
  return averageBandScores([fluency, lexical, grammar, pronunciation]);
}
