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
    partNumber === 'full'
      ? 'the COMPLETE speaking test (all 3 parts)'
      : `Part ${partNumber}`;

  return `Roles: Official IELTS Examiner. Task: Evaluate ${partContext}.

**TRANSCRIPT:**
${fullConversation}

**SCORING CONTEXT:**
- Transcripts are ASR-generated. Ignore spelling/punctuation errors.
- **ACOUSTIC ANALYSIS** (if present) is PRIMARY for Pronunciation/Fluency.
- Natural Speech Rate: 120-160 WPM. Short answers (<30 words) cap Fluency at 6.0.

**ANCHOR BANDS:**
9: Native-like, effortless, precise.
8: Fluent, rare hesitation, occasional inaccuracies.
7: Good length/vocab, some hesitation/errors, clear pronunciation.
6: Willing to speak, mixes simple/complex, some loss of coherence/control.
5: Basic fluency, frequent repetition/errors, limited vocab.
(Interpolate for half-bands, e.g., 6.5)

**OUTPUT FORMAT (JSON ONLY):**
{
  "fluency": <0-9.0>,
  "lexical": <0-9.0>,
  "grammar": <0-9.0>,
  "pronunciation": <0-9.0>,
  "feedback": "<2 sentence summary>",
  "partScores": {
    "part1": { "band": <score>, "keyObservation": "<text>" },
    "part2": { "band": <score>, "keyObservation": "<text>" },
    "part3": { "band": <score>, "keyObservation": "<text>" }
  },
  "criterionNotes": { "fluency": "<text>", "lexical": "<text>", "grammar": "<text>", "pronunciation": "<text>" },
  "strengths": ["<str1>", "<str2>", "<str3>"],
  "improvements": [{ "area": "<area>", "tip": "<actionable tip>" }, { "area": "<area>", "tip": "<actionable tip>" }],
  "targetBandTips": "<1-2 sentences>"
}`;
}

/**
 * Calculate IELTS overall band score (average rounded to nearest 0.5)
 */
export function calculateOverallBand(
  fluency: number,
  lexical: number,
  grammar: number,
  pronunciation: number
): number {
  const average = (fluency + lexical + grammar + pronunciation) / 4;
  return Math.round(average * 2) / 2; // Round to nearest 0.5
}
