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

  return `You are a senior IELTS examiner conducting an official assessment of ${partContext}.
Your evaluation must match the standard a real Cambridge/IDP trained examiner would produce.

**TRANSCRIPT:**
${fullConversation}

**PRE-SCORING RULES (execute before assigning any band):**

Rule 1 — Audio availability check:
- If the transcript section "=== PRONUNCIATION & FLUENCY ASSESSMENT (from audio analysis) ===" IS present: use that data as PRIMARY evidence for Pronunciation and Fluency.
- If that section is NOT present (text-only transcript): set pronunciation to 0 and write in criterionNotes.pronunciation: "Pronunciation cannot be assessed from a text transcript. This score is not available. Please use the app's audio recording feature for a pronunciation assessment." Do NOT assign any numeric value to pronunciation as a real score.

Rule 2 — Response length calibration for Fluency & Coherence:
- Estimate the total candidate word count per part from the transcript.
- Part 2 (Individual Long Turn) is particularly critical: Band 7+ Fluency requires 1–2 minutes of sustained extended speech (approx. 120–200+ words). If the candidate's Part 2 response is under 80 words, Fluency & Coherence CANNOT exceed 6.0.
- Very short Part 1 answers (under 20 words per question) and very short Part 3 answers (under 30 words per question) should also be reflected in lower Fluency scores.
- Do not assign Band 7 Fluency to a candidate whose entire test responses amount to fewer than 150 words total.

**SCORING CONTEXT:**
- Transcripts are ASR-generated: ignore spelling and punctuation in the transcript itself.
- Focus on LEXICAL CHOICES, GRAMMATICAL ACCURACY, RANGE, and COHERENCE visible in the text.
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
- 9: Native-like, effortless articulation. No impact on understanding.
- 8: Wide range of features. Minor L1 influence. Very easy to understand.
- 7: Generally clear. L1 influence evident. Occasional misunderstanding possible.
- 6: Intelligible. Consistent L1 features. Some listener effort required.
- 5: Frequent pronunciation errors causing some listener difficulty.

**OUTPUT FORMAT (JSON ONLY — no markdown, no extra text):**
{
  "fluency": <0–9.0 in 0.5 steps>,
  "lexical": <0–9.0 in 0.5 steps>,
  "grammar": <0–9.0 in 0.5 steps>,
  "pronunciation": <0–9.0 in 0.5 steps, OR 0 if no audio data>,
  "feedback": "<2 sentence overall performance summary — cite specific evidence from the transcript>",
  "partScores": {
    "part1": { "band": <score>, "keyObservation": "<1 sentence specific to Part 1 performance>" },
    "part2": { "band": <score>, "keyObservation": "<1 sentence specific to Part 2, note word length if short>" },
    "part3": { "band": <score>, "keyObservation": "<1 sentence specific to Part 3 analytical ability>" }
  },
  "criterionNotes": {
    "fluency": "<specific evidence from transcript — cite actual responses, note length calibration if applied>",
    "lexical": "<specific vocabulary examples from transcript — name actual words used or missing>",
    "grammar": "<name specific grammatical errors found in the transcript verbatim, or confirm accuracy if none found>",
    "pronunciation": "<audio-based notes if data present, or N/A message if text-only>"
  },
  "strengths": ["<specific strength with transcript evidence>", "<second strength>", "<third strength>"],
  "improvements": [
    {
      "area": "<criterion name>",
      "tip": "<concrete, actionable improvement. If Part 2 was short, first tip MUST be about extending length. If grammar errors found, correct them specifically BEFORE suggesting stylistic improvements.>"
    }
  ],
  "targetBandTips": "<1–2 sentences of coaching advice matched to the candidate's actual band level — not generic Band 7→8 tips if they are currently a Band 5>"
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
