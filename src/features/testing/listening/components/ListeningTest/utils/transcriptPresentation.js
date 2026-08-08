import { parseIeltsAnswerVariations } from '@/lib/ieltsAnswerValidation';

const MIN_HIGHLIGHT_LENGTH = 2;
const MAX_HIGHLIGHT_LENGTH = 80;
const MAX_SOURCE_HIGHLIGHT_LENGTH = 500;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFlexiblePhrasePattern(phrase) {
  const words = (String(phrase || '').match(/[\p{L}\p{N}]+/gu) || []).map(escapeRegex);

  if (!words.length) return null;
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])(${words.join('[^\\p{L}\\p{N}]+')})(?=$|[^\\p{L}\\p{N}])`,
    'iu'
  );
}

export function buildTranscriptAnswerHighlights(correctAnswersMap = {}) {
  return Object.values(correctAnswersMap)
    .flatMap((answer) => {
      const questionNumber = Number.parseInt(answer?.questionNumber, 10);
      const correctAnswer = String(answer?.correctAnswer || '').trim();

      if (
        !Number.isFinite(questionNumber) ||
        correctAnswer === '—' ||
        correctAnswer.length < MIN_HIGHLIGHT_LENGTH ||
        correctAnswer.length > MAX_HIGHLIGHT_LENGTH
      ) {
        return [];
      }

      const variations = parseIeltsAnswerVariations(correctAnswer)
        .filter((variation) => variation.length >= MIN_HIGHLIGHT_LENGTH)
        .sort((a, b) => b.length - a.length);

      return variations.length
        ? [
            {
              highlightKey: `answer-${questionNumber}`,
              questionNumber,
              variations,
              showBadge: true,
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        Math.max(...b.variations.map((variation) => variation.length)) -
        Math.max(...a.variations.map((variation) => variation.length))
    );
}

export function buildSourceTranscriptHighlights(sourceHighlights = []) {
  return sourceHighlights.flatMap((highlight, highlightIndex) => {
    const questionNumber = Number.parseInt(
      highlight?.question_number ?? highlight?.questionNumber,
      10
    );
    const phrases = Array.isArray(highlight?.phrases)
      ? highlight.phrases
      : [highlight?.phrase ?? highlight?.text];

    if (!Number.isFinite(questionNumber)) return [];

    return phrases.flatMap((phrase, phraseIndex) => {
      const normalizedPhrase = String(phrase || '').trim();
      if (
        normalizedPhrase.length < MIN_HIGHLIGHT_LENGTH ||
        normalizedPhrase.length > MAX_SOURCE_HIGHLIGHT_LENGTH
      ) {
        return [];
      }

      return [
        {
          highlightKey: `source-${highlightIndex}-${phraseIndex}`,
          questionNumber,
          variations: [normalizedPhrase],
          showBadge: highlight?.show_badge ?? highlight?.showBadge ?? true,
        },
      ];
    });
  });
}

/**
 * Splits transcript text into plain/highlighted runs. Each question is marked
 * once across the full audioscript, matching the source-image convention.
 */
export function splitTranscriptHighlights(text, highlights, usedHighlightKeys = new Set()) {
  const matches = [];

  for (const highlight of highlights) {
    if (usedHighlightKeys.has(highlight.highlightKey)) continue;

    let bestMatch = null;
    for (const variation of highlight.variations) {
      const pattern = buildFlexiblePhrasePattern(variation);
      const match = pattern?.exec(text);
      if (!match) continue;

      const start = match.index + match[1].length;
      const candidate = {
        start,
        end: start + match[2].length,
        highlightKey: highlight.highlightKey,
        questionNumber: highlight.questionNumber,
        showBadge: highlight.showBadge,
      };

      if (!bestMatch || candidate.start < bestMatch.start) bestMatch = candidate;
    }

    if (bestMatch) matches.push(bestMatch);
  }

  const accepted = [];
  for (const match of matches.sort((a, b) => a.start - b.start || a.end - b.end)) {
    if (accepted.some((item) => match.start < item.end && match.end > item.start)) continue;
    accepted.push(match);
    usedHighlightKeys.add(match.highlightKey);
  }

  if (!accepted.length) return [{ text, questionNumber: null }];

  const parts = [];
  let cursor = 0;
  for (const match of accepted) {
    if (match.start > cursor) {
      parts.push({ text: text.slice(cursor, match.start), questionNumber: null });
    }
    parts.push({
      text: text.slice(match.start, match.end),
      questionNumber: match.questionNumber,
      showBadge: match.showBadge,
    });
    cursor = match.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), questionNumber: null });

  return parts;
}

export function buildHighlightedTranscript(
  segments,
  correctAnswersMap = {},
  sourceHighlights = []
) {
  const curatedHighlights = buildSourceTranscriptHighlights(sourceHighlights);
  const curatedQuestionNumbers = new Set(
    curatedHighlights.map((highlight) => highlight.questionNumber)
  );
  const answerFallbacks = buildTranscriptAnswerHighlights(correctAnswersMap).filter(
    (highlight) => !curatedQuestionNumbers.has(highlight.questionNumber)
  );
  // Image-derived evidence is authoritative. Scored-answer text fills only the
  // question numbers whose source image marker could not be resolved safely.
  const highlights = [...curatedHighlights, ...answerFallbacks];
  const usedHighlightKeys = new Set();

  return segments.map((segment) => ({
    ...segment,
    displayParts: splitTranscriptHighlights(segment.text, highlights, usedHighlightKeys),
  }));
}
