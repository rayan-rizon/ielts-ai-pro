import { parseIeltsAnswerVariations } from '@/lib/ieltsAnswerValidation';

const MIN_HIGHLIGHT_LENGTH = 2;
const MAX_HIGHLIGHT_LENGTH = 80;
const MAX_SOURCE_HIGHLIGHT_LENGTH = 500;

function parseQuestionNumbers(value) {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values.flatMap((item) => {
        const numbers = String(item ?? '').match(/\d+/g) || [];
        return numbers.map((number) => Number.parseInt(number, 10));
      })
    ),
  ].filter(Number.isFinite);
}

function normalizedHighlightPhrase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

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
  const candidates = sourceHighlights.flatMap((highlight, highlightIndex) => {
    const questionNumbers = parseQuestionNumbers(
      highlight?.question_numbers ??
        highlight?.questionNumbers ??
        highlight?.question_number ??
        highlight?.questionNumber
    );
    const phrases = Array.isArray(highlight?.phrases)
      ? highlight.phrases
      : [highlight?.phrase ?? highlight?.text];

    if (!questionNumbers.length) return [];

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
          questionNumber: questionNumbers[0],
          ...(questionNumbers.length > 1 ? { questionNumbers } : {}),
          variations: [normalizedPhrase],
          showBadge: highlight?.show_badge ?? highlight?.showBadge ?? true,
        },
      ];
    });
  });

  // Some source images intentionally attach one evidence phrase to a pair of
  // questions (for example, 21,22). Keep that as one mark and one badge. The
  // adjacent-only merge prevents repeated phrases in unrelated parts from
  // being combined accidentally.
  return candidates.reduce((highlights, candidate) => {
    const previous = highlights.at(-1);
    if (
      previous &&
      candidate.showBadge !== false &&
      previous.showBadge !== false &&
      normalizedHighlightPhrase(previous.variations[0]) ===
        normalizedHighlightPhrase(candidate.variations[0])
    ) {
      const previousQuestionNumbers = previous.questionNumbers || [previous.questionNumber];
      const candidateQuestionNumbers = candidate.questionNumbers || [candidate.questionNumber];
      previous.questionNumbers = [
        ...new Set([...previousQuestionNumbers, ...candidateQuestionNumbers]),
      ];
      previous.questionNumber = previous.questionNumbers[0];
      return highlights;
    }
    highlights.push(candidate);
    return highlights;
  }, []);
}

function findHighlightMatch(text, highlight, minimumStart = 0) {
  let bestMatch = null;
  const searchableText = String(text || '').slice(minimumStart);

  for (const variation of highlight.variations) {
    const pattern = buildFlexiblePhrasePattern(variation);
    const match = pattern?.exec(searchableText);
    if (!match) continue;

    const start = minimumStart + match.index + match[1].length;
    const candidate = {
      start,
      end: start + match[2].length,
      highlightKey: highlight.highlightKey,
      questionNumber: highlight.questionNumber,
      ...(highlight.questionNumbers?.length > 1
        ? { questionNumbers: highlight.questionNumbers }
        : {}),
      showBadge: highlight.showBadge,
    };

    if (!bestMatch || candidate.start < bestMatch.start) bestMatch = candidate;
  }

  return bestMatch;
}

function findAllHighlightMatches(text, highlight) {
  const matches = [];

  for (const variation of highlight.variations) {
    const pattern = buildFlexiblePhrasePattern(variation);
    let searchStart = 0;

    while (pattern && searchStart <= text.length) {
      const match = pattern.exec(text.slice(searchStart));
      if (!match) break;

      const start = searchStart + match.index + match[1].length;
      const end = start + match[2].length;
      matches.push({
        start,
        end,
        highlightKey: highlight.highlightKey,
        questionNumber: highlight.questionNumber,
        ...(highlight.questionNumbers?.length > 1
          ? { questionNumbers: highlight.questionNumbers }
          : {}),
        showBadge: highlight.showBadge,
      });

      const nextStart = Math.max(start + 1, end);
      if (nextStart <= searchStart) break;
      searchStart = nextStart;
    }
  }

  return [...new Map(matches.map((match) => [`${match.start}:${match.end}`, match])).values()].sort(
    (a, b) => a.start - b.start || b.end - a.end
  );
}

function sourceHighlightGroupKey(highlight) {
  return (highlight.questionNumbers || [highlight.questionNumber]).join(',');
}

function resolveSourceHighlightSegments(segments, highlights) {
  const placements = new Map();
  const accepted = [];

  const groups = new Map();
  for (const highlight of highlights) {
    const key = sourceHighlightGroupKey(highlight);
    const group = groups.get(key) || [];
    group.push(highlight);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const anchor = [...group].sort(
      (a, b) =>
        Math.max(...b.variations.map((variation) => variation.length)) -
        Math.max(...a.variations.map((variation) => variation.length))
    )[0];
    const anchorCandidates = segments.flatMap((segment, segmentIndex) =>
      findAllHighlightMatches(segment.text, anchor).map((match) => ({
        ...match,
        segmentIndex,
      }))
    );
    if (!anchorCandidates.length) continue;

    const anchorMatch = anchorCandidates[0];
    const groupPlacements = [];

    for (const highlight of group) {
      const candidates = segments.flatMap((segment, segmentIndex) =>
        findAllHighlightMatches(segment.text, highlight).map((match) => ({
          ...match,
          segmentIndex,
        }))
      );
      const rankedCandidates = candidates.sort((a, b) => {
        const aDistance =
          Math.abs(a.segmentIndex - anchorMatch.segmentIndex) * 1_000_000 +
          Math.abs(a.start - (a.segmentIndex === anchorMatch.segmentIndex ? anchorMatch.start : 0));
        const bDistance =
          Math.abs(b.segmentIndex - anchorMatch.segmentIndex) * 1_000_000 +
          Math.abs(b.start - (b.segmentIndex === anchorMatch.segmentIndex ? anchorMatch.start : 0));
        return aDistance - bDistance || a.start - b.start;
      });
      const match = rankedCandidates.find(
        (candidate) =>
          !accepted.some(
            (item) =>
              item.segmentIndex === candidate.segmentIndex &&
              candidate.start < item.end &&
              candidate.end > item.start
          )
      );

      // A short source phrase can be nested inside an earlier, longer source
      // phrase in the same segment. The longer evidence mark already covers it.
      if (!match) continue;

      const placement = { ...match, segmentIndex: match.segmentIndex };
      accepted.push(placement);
      groupPlacements.push({ highlight, match });
    }

    for (const { highlight, match } of groupPlacements) {
      const segmentPlacements = placements.get(match.segmentIndex) || [];
      segmentPlacements.push({ highlight, start: match.start, end: match.end });
      placements.set(match.segmentIndex, segmentPlacements);
    }
  }

  for (const [segmentIndex, segmentPlacements] of placements) {
    placements.set(
      segmentIndex,
      segmentPlacements
        .sort((a, b) => a.start - b.start || b.end - a.end)
        .map(({ highlight }) => highlight)
    );
  }

  return placements;
}

/**
 * Splits transcript text into plain/highlighted runs. Each question is marked
 * once across the full audioscript, matching the source-image convention.
 */
export function splitTranscriptHighlights(text, highlights, usedHighlightKeys = new Set()) {
  const matches = [];

  for (const highlight of highlights) {
    if (usedHighlightKeys.has(highlight.highlightKey)) continue;

    const bestMatch = findHighlightMatch(text, highlight);

    if (bestMatch) matches.push(bestMatch);
  }

  const accepted = [];
  for (const match of matches.sort((a, b) => a.start - b.start || b.end - a.end)) {
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
      ...(match.questionNumbers?.length > 1 ? { questionNumbers: match.questionNumbers } : {}),
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
    curatedHighlights.flatMap(
      (highlight) => highlight.questionNumbers || [highlight.questionNumber]
    )
  );
  const answerFallbacks = buildTranscriptAnswerHighlights(correctAnswersMap).filter(
    (highlight) => !curatedQuestionNumbers.has(highlight.questionNumber)
  );
  // Image-derived evidence is authoritative. Scored-answer text fills only the
  // question numbers whose source image marker could not be resolved safely.
  const sourcePlacements = resolveSourceHighlightSegments(segments, curatedHighlights);
  const usedHighlightKeys = new Set();

  return segments.map((segment, segmentIndex) => {
    const highlights = [...(sourcePlacements.get(segmentIndex) || []), ...answerFallbacks];

    return {
      ...segment,
      displayParts: splitTranscriptHighlights(segment.text, highlights, usedHighlightKeys),
    };
  });
}
