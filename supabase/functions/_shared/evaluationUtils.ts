export const FEEDBACK_EVALUATOR_VERSION = '2026-06-14-v2';

const VALID_ANNOTATION_TYPES = new Set([
  'grammar',
  'spelling',
  'style',
  'vocabulary',
  'clarity',
  'positive',
]);

const VALID_ANNOTATION_SEVERITIES = new Set(['error', 'warning', 'suggestion', 'positive']);

const INVALID_SPEAKING_RESPONSES = [
  /^\s*$/,
  /^\s*\.\.\.\s*$/,
  /^\s*\(inaudible\)\s*$/i,
  /^\s*\(audio received but transcription failed\)\s*$/i,
  /^\s*\(unable to transcribe.*\)\s*$/i,
  /^\s*\(your response was recorded\)\s*$/i,
];

const PROCEDURAL_EXAMINER_PATTERNS = [
  /^hello!? welcome to/i,
  /^now it'?s time for part/i,
  /^excellent!? now let'?s move on/i,
  /^alright,? your preparation time is up/i,
  /^thank you(?: very much)?\.? that concludes/i,
  /^thank you for your response\.? that brings us/i,
  /^that'?s all the time we have for part/i,
  /^i'?m sorry,? i didn'?t quite catch that/i,
  /^i didn'?t hear anything/i,
];

const UNSUPPORTED_AUDIO_CLAIM_PATTERN =
  /\b(pronunciation|intonation|word stress|connected speech|without pauses|speech rate|speaking pace|accent clarity|flow of speech|smooth delivery|spoken delivery|hesitation)\b/i;

export type SpeakingEntry = {
  speaker?: string;
  text?: string;
  error?: boolean;
  isLoading?: boolean;
};

export type SpeakingPartStats = {
  candidateWordCount: number;
  validResponseCount: number;
  unintelligibleResponseCount: number;
};

export type PronunciationEvidence = {
  score: number | null;
  sampleCount: number;
  partCount: number;
  summary: string;
  problematicSounds: string[];
  wordIssues: Array<{ word: string; issue: string; severity: string }>;
};

export function countWords(text: unknown): number {
  if (typeof text !== 'string') return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

export function normalizeBandScore(value: unknown, allowZero = true): number | null {
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return null;
  if (!allowZero && numeric <= 0) return null;
  const clamped = Math.min(9, Math.max(allowZero ? 0 : 1, numeric));
  return Math.round(clamped * 2) / 2;
}

export function parseStructuredJson(text: unknown): Record<string, any> {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('AI response did not contain JSON');
  }

  let candidate = text.trim();
  if (candidate.startsWith('```')) {
    candidate = candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const objectStart = candidate.indexOf('{');
  const objectEnd = candidate.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidate = candidate.slice(objectStart, objectEnd + 1);
  }

  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AI response JSON must be an object');
  }
  return parsed;
}

export function averageBandScores(values: unknown[]): number | null {
  const normalized = values.map((value) => normalizeBandScore(value));
  if (normalized.some((value) => value === null)) return null;
  const scores = normalized as number[];
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 2) / 2;
}

function stringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems);
}

function exactSourceSubstring(sourceText: string, value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && sourceText.includes(value);
}

export function normalizeWritingEvaluation(
  raw: Record<string, any>,
  taskType: 'Task 1' | 'Task 2',
  sourceText: string
) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Writing evaluation is not an object');
  }

  const criteria = raw.criteriaScores || raw.criteria_scores || {};
  const taskCriterionKey = taskType === 'Task 1' ? 'TaskAchievement' : 'TaskResponse';
  const taskCriterion = normalizeBandScore(
    criteria[taskCriterionKey] ??
      criteria.TaskAchievement ??
      criteria.TaskResponse ??
      criteria.task_achievement ??
      criteria.task_response ??
      criteria.TA ??
      criteria.TR
  );
  const coherence = normalizeBandScore(
    criteria.CoherenceAndCohesion ?? criteria['Coherence & Cohesion'] ?? criteria.CC
  );
  const lexical = normalizeBandScore(
    criteria.LexicalResource ?? criteria['Lexical Resource'] ?? criteria.LR
  );
  const grammar = normalizeBandScore(
    criteria.GrammaticalRangeAndAccuracy ??
      criteria['Grammatical Range & Accuracy'] ??
      criteria.GrammaticalRange ??
      criteria.GRA
  );

  if ([taskCriterion, coherence, lexical, grammar].some((score) => score === null)) {
    throw new Error('Writing evaluation is missing one or more criterion scores');
  }

  const criteriaScores = {
    [taskCriterionKey]: taskCriterion,
    CoherenceAndCohesion: coherence,
    LexicalResource: lexical,
    GrammaticalRangeAndAccuracy: grammar,
  };

  const annotations = Array.isArray(raw.annotations)
    ? raw.annotations
        .filter(
          (annotation: any) =>
            annotation &&
            exactSourceSubstring(sourceText, annotation.originalText) &&
            VALID_ANNOTATION_TYPES.has(annotation.type) &&
            VALID_ANNOTATION_SEVERITIES.has(annotation.severity) &&
            typeof annotation.suggestion === 'string' &&
            typeof annotation.explanation === 'string'
        )
        .slice(0, 15)
    : [];

  const corrections = Array.isArray(raw.corrections)
    ? raw.corrections
        .filter(
          (correction: any) =>
            correction &&
            exactSourceSubstring(sourceText, correction.original) &&
            typeof correction.correction === 'string' &&
            correction.correction.trim().length > 0 &&
            correction.correction.trim() !== correction.original.trim() &&
            typeof correction.explanation === 'string'
        )
        .slice(0, 12)
    : [];

  const vocabularyEnhancements = Array.isArray(
    raw.vocabularyEnhancements || raw.vocabulary_enhancements
  )
    ? (raw.vocabularyEnhancements || raw.vocabulary_enhancements)
        .filter(
          (item: any) =>
            item &&
            exactSourceSubstring(sourceText, item.original) &&
            Array.isArray(item.alternatives) &&
            item.alternatives.some(
              (alternative: unknown) =>
                typeof alternative === 'string' && alternative.trim().length > 0
            )
        )
        .map((item: any) => ({
          original: item.original,
          alternatives: stringArray(item.alternatives, 3),
          context: typeof item.context === 'string' ? item.context.trim() : '',
        }))
        .slice(0, 8)
    : [];

  const wordCount = countWords(sourceText);
  const minimumWords = taskType === 'Task 1' ? 150 : 250;
  const weaknesses = stringArray(raw.weaknesses, 8);
  if (wordCount < minimumWords) {
    const deterministicLengthNote = `Response length: ${wordCount} words, below the ${minimumWords}-word minimum. This limits how fully the task can be addressed, but language criteria are still judged from the language actually demonstrated.`;
    if (!weaknesses.some((item) => /\bword(?:s| count| length)\b/i.test(item))) {
      weaknesses.unshift(deterministicLengthNote);
    }
  }

  return {
    overallBand: averageBandScores([taskCriterion, coherence, lexical, grammar]),
    criteriaScores,
    annotations,
    strengths: stringArray(raw.strengths, 6),
    weaknesses,
    suggestions: stringArray(raw.suggestions, 10),
    corrections,
    vocabularyEnhancements,
    wordCount,
    taskType,
    evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
  };
}

export function isMeaningfulSpeakingResponse(entry: SpeakingEntry): boolean {
  if (!entry || entry.speaker !== 'user' || entry.isLoading || entry.error) return false;
  const text = typeof entry.text === 'string' ? entry.text.trim() : '';
  return !INVALID_SPEAKING_RESPONSES.some((pattern) => pattern.test(text));
}

function isProceduralExaminerText(text: string): boolean {
  return PROCEDURAL_EXAMINER_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

function normalizePartContext(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim().slice(0, 4000);
  if (typeof value === 'object') {
    const context = value as Record<string, unknown>;
    return [context.title, context.questions]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
  }
  return '';
}

export function buildSpeakingTranscript(
  allPartsConversation: Record<string | number, SpeakingEntry[]>,
  partContexts: Record<string | number, unknown> = {}
) {
  let transcript = '';
  const partStats: Record<string, SpeakingPartStats> = {};
  const candidateSource: Record<string, string> = {};

  for (const part of [1, 2, 3]) {
    const entries = Array.isArray(allPartsConversation?.[part])
      ? allPartsConversation[part]
      : Array.isArray(allPartsConversation?.[String(part)])
        ? allPartsConversation[String(part)]
        : [];
    const context = normalizePartContext(partContexts?.[part] ?? partContexts?.[String(part)]);
    let candidateWordCount = 0;
    let validResponseCount = 0;
    let unintelligibleResponseCount = 0;
    const candidateResponses: string[] = [];
    const lines: string[] = [];

    if (context) lines.push(`Task context: ${context}`);

    for (const entry of entries) {
      if (!entry || entry.isLoading || typeof entry.text !== 'string') continue;
      const text = entry.text.replace(/\s+/g, ' ').trim();
      if (!text) continue;

      if (entry.speaker === 'user') {
        if (isMeaningfulSpeakingResponse(entry)) {
          candidateWordCount += countWords(text);
          validResponseCount += 1;
          candidateResponses.push(text);
          lines.push(`Candidate: ${text}`);
        } else {
          unintelligibleResponseCount += 1;
          lines.push('Candidate: [No intelligible response]');
        }
      } else if (!isProceduralExaminerText(text)) {
        lines.push(`Examiner: ${text}`);
      }
    }

    partStats[String(part)] = {
      candidateWordCount,
      validResponseCount,
      unintelligibleResponseCount,
    };
    candidateSource[String(part)] = candidateResponses.join('\n');
    transcript += `=== PART ${part} ===\n${lines.join('\n') || '[No response data]'}\n\n`;
  }

  return {
    transcript: transcript.trim(),
    partStats,
    candidateSource,
    totalCandidateWords: Object.values(partStats).reduce(
      (sum, stats) => sum + stats.candidateWordCount,
      0
    ),
  };
}

export function aggregatePronunciationEvidence(
  allPartsPronunciation: Record<string | number, any[]> | null | undefined
): PronunciationEvidence {
  const scores: number[] = [];
  const coveredParts = new Set<string>();
  const summaryLines: string[] = [];
  const problematicSounds = new Set<string>();
  const wordIssues: Array<{ word: string; issue: string; severity: string }> = [];

  if (allPartsPronunciation && typeof allPartsPronunciation === 'object') {
    for (const [part, samples] of Object.entries(allPartsPronunciation)) {
      if (!Array.isArray(samples)) continue;
      const partScores: number[] = [];
      const fluencyNotes: string[] = [];

      for (const sample of samples) {
        const score = normalizeBandScore(sample?.pronunciationScore, false);
        if (score !== null) {
          scores.push(score);
          partScores.push(score);
          coveredParts.add(part);
        }
        if (typeof sample?.fluencyNotes === 'string' && sample.fluencyNotes.trim()) {
          fluencyNotes.push(sample.fluencyNotes.trim());
        }
        if (Array.isArray(sample?.problematicSounds)) {
          for (const sound of sample.problematicSounds) {
            if (typeof sound === 'string' && sound.trim()) problematicSounds.add(sound.trim());
          }
        }
        if (Array.isArray(sample?.wordLevelFeedback)) {
          for (const issue of sample.wordLevelFeedback) {
            if (
              issue &&
              typeof issue.word === 'string' &&
              typeof issue.issue === 'string' &&
              typeof issue.severity === 'string'
            ) {
              wordIssues.push({
                word: issue.word.trim(),
                issue: issue.issue.trim(),
                severity: issue.severity.trim(),
              });
            }
          }
        }
      }

      if (partScores.length > 0) {
        summaryLines.push(
          `Part ${part}: ${partScores.length} audio sample(s), average ${averageBandScores(partScores)}/9.`
        );
        if (fluencyNotes.length > 0) {
          summaryLines.push(`Part ${part} audio observations: ${fluencyNotes.join('; ')}`);
        }
      }
    }
  }

  return {
    score: scores.length > 0 ? averageBandScores(scores) : null,
    sampleCount: scores.length,
    partCount: coveredParts.size,
    summary: summaryLines.join('\n'),
    problematicSounds: [...problematicSounds].slice(0, 12),
    wordIssues: wordIssues.slice(0, 20),
  };
}

function removeUnsupportedAudioClaims(items: string[], hasAudioEvidence: boolean): string[] {
  if (hasAudioEvidence) return items;
  return items.filter((item) => !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(item));
}

function removeUnsupportedAudioSentences(value: unknown, hasAudioEvidence: boolean): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  if (hasAudioEvidence) return value.trim();
  return value
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(sentence))
    .join(' ')
    .trim();
}

export function normalizeSpeakingEvaluation(
  raw: Record<string, any>,
  partStats: Record<string, SpeakingPartStats>,
  pronunciationEvidence: PronunciationEvidence
) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Speaking evaluation is not an object');
  }

  const fluency = normalizeBandScore(raw.fluency);
  const lexical = normalizeBandScore(raw.lexical);
  const grammar = normalizeBandScore(raw.grammar);
  if ([fluency, lexical, grammar].some((score) => score === null)) {
    throw new Error('Speaking evaluation is missing one or more language criterion scores');
  }

  const pronunciation = pronunciationEvidence.score;
  const hasPronunciationEvidence = pronunciation !== null;
  const transcriptOverallBand = averageBandScores([fluency, lexical, grammar]);
  const overallBand =
    pronunciation === null
      ? transcriptOverallBand
      : averageBandScores([fluency, lexical, grammar, pronunciation]);
  const rawPartScores = raw.partScores || {};
  const partScores: Record<string, { band: number | null; keyObservation: string }> = {};

  for (const part of [1, 2, 3]) {
    const key = `part${part}`;
    const stats = partStats[String(part)] || {
      candidateWordCount: 0,
      validResponseCount: 0,
      unintelligibleResponseCount: 0,
    };
    const rawPart = rawPartScores[key] || {};
    const rawObservation =
      typeof rawPart.keyObservation === 'string' ? rawPart.keyObservation.trim() : '';
    const keyObservation = removeUnsupportedAudioSentences(
      rawObservation,
      hasPronunciationEvidence
    );
    partScores[key] = {
      band:
        stats.validResponseCount === 0 ? null : normalizeBandScore(rawPart.band ?? rawPart.score),
      keyObservation:
        stats.validResponseCount === 0
          ? 'No intelligible response was available for this part.'
          : keyObservation
            ? keyObservation
            : `${stats.candidateWordCount} candidate words were available for assessment.`,
    };
  }

  const criterionNotes = raw.criterionNotes || {};
  const pronunciationNote = hasPronunciationEvidence
    ? `${pronunciationEvidence.sampleCount} audio sample(s) across ${pronunciationEvidence.partCount} part(s) were available. Final pronunciation score uses the rounded audio-sample average.`
    : '';
  const totalCandidateWords = Object.values(partStats).reduce(
    (sum, stats) => sum + stats.candidateWordCount,
    0
  );
  const totalValidResponses = Object.values(partStats).reduce(
    (sum, stats) => sum + stats.validResponseCount,
    0
  );
  const fluencyNote =
    removeUnsupportedAudioSentences(criterionNotes.fluency, hasPronunciationEvidence) ||
    (hasPronunciationEvidence
      ? ''
      : `The transcript contains ${totalCandidateWords} words across ${totalValidResponses} developed response(s). This score reflects response development and logical continuity visible in the transcript.`);
  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements
        .filter((item: any) => {
          if (hasPronunciationEvidence) return true;
          return !UNSUPPORTED_AUDIO_CLAIM_PATTERN.test(`${item?.area || ''} ${item?.tip || ''}`);
        })
        .slice(0, 8)
    : [];

  return {
    fluency,
    lexical,
    grammar,
    pronunciation,
    overallBand,
    provisionalOverallBand: transcriptOverallBand,
    assessmentStatus: hasPronunciationEvidence ? 'complete' : 'transcript',
    scoreBasis: hasPronunciationEvidence ? 'audio-and-transcript' : 'transcript',
    pronunciationEvidence: {
      sampleCount: pronunciationEvidence.sampleCount,
      partCount: pronunciationEvidence.partCount,
    },
    feedback:
      removeUnsupportedAudioSentences(raw.feedback, hasPronunciationEvidence) ||
      'Speaking evaluation completed.',
    partScores,
    criterionNotes: {
      fluency: fluencyNote,
      lexical: typeof criterionNotes.lexical === 'string' ? criterionNotes.lexical.trim() : '',
      grammar: typeof criterionNotes.grammar === 'string' ? criterionNotes.grammar.trim() : '',
      pronunciation: pronunciationNote,
    },
    strengths: removeUnsupportedAudioClaims(
      stringArray(raw.strengths, 6),
      hasPronunciationEvidence
    ),
    improvements,
    targetBandTips: removeUnsupportedAudioSentences(raw.targetBandTips, hasPronunciationEvidence),
    evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
  };
}

export function normalizeDetailedSpeakingEvaluation(
  raw: unknown,
  candidateSource: Record<string, string>
) {
  if (!Array.isArray(raw)) {
    throw new Error('Detailed speaking evaluation is not an array');
  }

  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => {
      const part = Number(item.part);
      const source = candidateSource[String(part)] || '';
      if (![1, 2, 3].includes(part) || !exactSourceSubstring(source, item.candidateAnswer)) {
        return null;
      }
      const grammaticalErrors = Array.isArray(item.grammaticalErrors)
        ? item.grammaticalErrors
            .filter(
              (error: any) =>
                error &&
                exactSourceSubstring(item.candidateAnswer, error.incorrect) &&
                typeof error.correct === 'string' &&
                error.correct.trim().length > 0 &&
                error.correct.trim() !== error.incorrect.trim() &&
                typeof error.explanation === 'string'
            )
            .slice(0, 12)
        : [];

      return {
        part,
        question: typeof item.question === 'string' ? item.question.trim() : '',
        candidateAnswer: item.candidateAnswer,
        grammaticalErrors,
        topicDrift:
          typeof item.topicDrift === 'string' && item.topicDrift.trim()
            ? item.topicDrift.trim()
            : 'null',
        suggestedAnswer:
          typeof item.suggestedAnswer === 'string' ? item.suggestedAnswer.trim() : '',
        feedback: typeof item.feedback === 'string' ? item.feedback.trim() : '',
      };
    })
    .filter(Boolean);
}
