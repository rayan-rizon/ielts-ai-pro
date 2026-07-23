import {
  compactDevelopmentArea,
  compactStrengthList,
  compactText,
  textKey,
} from './speakingReportHelpers';

const CRITERIA = [
  {
    key: 'fluency',
    label: 'Fluency & Coherence',
    shortLabel: 'Fluency',
    noteKey: 'fluency',
    legacyKey: 'fluencyAnalysis',
  },
  {
    key: 'lexical',
    label: 'Lexical Resource',
    shortLabel: 'Vocabulary',
    noteKey: 'lexical',
    legacyKey: 'lexicalAnalysis',
  },
  {
    key: 'grammar',
    label: 'Grammatical Range & Accuracy',
    shortLabel: 'Grammar',
    noteKey: 'grammar',
    legacyKey: 'grammarAnalysis',
  },
  {
    key: 'pronunciation',
    label: 'Pronunciation',
    shortLabel: 'Pronunciation',
    noteKey: 'pronunciation',
    legacyKey: 'pronunciationAnalysis',
  },
];

const PARTS = [
  { key: 'part1', label: 'Part 1', subtitle: 'Introduction & Interview' },
  { key: 'part2', label: 'Part 2', subtitle: 'Long Turn' },
  { key: 'part3', label: 'Part 3', subtitle: 'Discussion' },
];

export const BAND_LEVELS = [
  {
    min: 8.5,
    label: 'Expert Level',
    description: 'Precise, natural, and highly effective spoken English.',
  },
  {
    min: 7.5,
    label: 'Advanced Level',
    description: 'Fluent, detailed communication with minimal inaccuracies.',
  },
  {
    min: 6.5,
    label: 'Upper Intermediate',
    description: 'Effective communication in most situations with good clarity.',
  },
  {
    min: 5.5,
    label: 'Intermediate Level',
    description: 'Can communicate main ideas with room for detail and fluency growth.',
  },
  {
    min: 4.5,
    label: 'Pre-Intermediate',
    description: 'Basic communication on familiar everyday topics.',
  },
  {
    min: 0,
    label: 'Basic Level',
    description: 'Building foundational vocabulary and speaking confidence.',
  },
];

const BAND_UNAVAILABLE = {
  label: 'Score Unavailable',
  description: 'Not enough assessment evidence was captured to calculate this score.',
};

const isFiniteScore = (value) => value != null && Number.isFinite(Number(value));

export const formatBandScore = (score) => {
  if (!isFiniteScore(score)) return 'N/A';
  const numericScore = Number(score);
  return numericScore % 1 === 0 ? String(numericScore) : numericScore.toFixed(1);
};

export const getBandInfo = (score) => {
  if (!isFiniteScore(score)) return BAND_UNAVAILABLE;
  return BAND_LEVELS.find((level) => Number(score) >= level.min) || BAND_UNAVAILABLE;
};

const buildCriteria = (finalEvaluation, hasPronunciation) => {
  const notes = finalEvaluation.criterionNotes || {};
  const legacy = finalEvaluation.analysis || {};

  return CRITERIA.map((criterion) => ({
    ...criterion,
    value: isFiniteScore(finalEvaluation[criterion.key])
      ? Number(finalEvaluation[criterion.key])
      : null,
    note: compactText(notes[criterion.noteKey] || legacy[criterion.legacyKey], {
      maxSentences: 1,
      maxChars: 155,
    }),
  })).filter(
    (criterion) =>
      (criterion.value != null || criterion.note) &&
      (criterion.key !== 'pronunciation' || hasPronunciation)
  );
};

const buildImprovements = (rawImprovements) =>
  (Array.isArray(rawImprovements) ? rawImprovements : [])
    .map(compactDevelopmentArea)
    .filter((item) => item.title && item.content)
    .filter((item, index, items) => {
      const key = textKey(item.content);
      return key && items.findIndex((candidate) => textKey(candidate.content) === key) === index;
    })
    .slice(0, 3);

const PART_SCORE_UNAVAILABLE = 'A part score was not saved for this completed session.';

const getPartScoreValue = (partScores, partNumber) => {
  if (Array.isArray(partScores)) return partScores[partNumber - 1];
  if (!partScores || typeof partScores !== 'object') return undefined;

  return (
    partScores[`part${partNumber}`] ??
    partScores[`part_${partNumber}`] ??
    partScores[`Part ${partNumber}`] ??
    partScores[String(partNumber)]
  );
};

const normalizePartScore = (rawPart) => {
  if (rawPart == null) return { band: null, observation: PART_SCORE_UNAVAILABLE };

  if (typeof rawPart !== 'object') {
    return {
      band: isFiniteScore(rawPart) ? Number(rawPart) : null,
      observation: isFiniteScore(rawPart)
        ? ''
        : 'No score could be assigned for this part from the saved report.',
    };
  }

  const band = rawPart.band ?? rawPart.score ?? rawPart.overallBand;
  const observation = compactText(
    rawPart.keyObservation ?? rawPart.observation ?? rawPart.feedback ?? rawPart.note,
    { maxSentences: 1, maxChars: 145 }
  );

  return {
    band: isFiniteScore(band) ? Number(band) : null,
    observation:
      observation ||
      (isFiniteScore(band)
        ? ''
        : 'No score could be assigned for this part from the saved report.'),
  };
};

const buildParts = (finalEvaluation) => {
  const partScores = finalEvaluation?.partScores ?? finalEvaluation?.part_scores;

  return PARTS.map((part, index) => ({
    ...part,
    ...normalizePartScore(
      getPartScoreValue(partScores, index + 1) ??
        finalEvaluation?.[`part${index + 1}Score`] ??
        finalEvaluation?.[`part${index + 1}Band`]
    ),
  }));
};

export const buildSpeakingReportSummary = (finalEvaluation = {}) => {
  const overallScore = isFiniteScore(finalEvaluation.overallBand)
    ? Number(finalEvaluation.overallBand)
    : null;
  const hasPronunciation = isFiniteScore(finalEvaluation.pronunciation);
  const isTranscriptEstimate = finalEvaluation.scoreBasis === 'transcript' || !hasPronunciation;
  const conciseFeedback = compactText(finalEvaluation.feedback, {
    maxSentences: 2,
    maxChars: 240,
  });
  const conciseTargetTip = compactText(finalEvaluation.targetBandTips, {
    maxSentences: 1,
    maxChars: 190,
  });

  return {
    overallScore,
    bandInfo: getBandInfo(overallScore),
    isTranscriptEstimate,
    conciseFeedback,
    criteria: buildCriteria(finalEvaluation, hasPronunciation),
    strengths: compactStrengthList(finalEvaluation.strengths),
    improvements: buildImprovements(finalEvaluation.improvements),
    conciseTargetTip,
    showTargetTip:
      Boolean(conciseTargetTip) && textKey(conciseTargetTip) !== textKey(conciseFeedback),
    parts: buildParts(finalEvaluation),
  };
};
