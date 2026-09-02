/**
 * SRT Parser Utility
 * Parses SRT subtitle format into structured JSON with timestamps and speaker labels.
 */

const MAX_REASONABLE_TIMESTAMP = 900; // 15 minutes – covers all IELTS parts
const MAX_PLAUSIBLE_SEGMENT_DURATION = 45;
const START_ORDER_TOLERANCE = 0.25;
const OVERLAP_TOLERANCE = 0.75;
const GAP_PENALTY_THRESHOLD = 45;
const TIMESTAMP_TOKEN = String.raw`\d{1,2}:\d{1,2}(?::\d{1,3})?(?:[,.]\d{1,3})?`;
const SPLIT_END_TIMESTAMP_PATTERN = new RegExp(
  String.raw`^([ \t]*${TIMESTAMP_TOKEN}[ \t]*-->)[ \t]*\d+[ \t]*\n[ \t]*(${TIMESTAMP_TOKEN})[ \t]*$`,
  'gm'
);
const CUE_PATTERN = new RegExp(
  String.raw`(?:^|\n)[ \t]*(?:(\d+)[ \t]*\n[ \t]*)?(${TIMESTAMP_TOKEN})[ \t]*-->[ \t]*(${TIMESTAMP_TOKEN})[ \t]*\n([\s\S]*?)(?=(?:\n[ \t]*(?:\d+[ \t]*\n[ \t]*)?${TIMESTAMP_TOKEN}[ \t]*-->)|$)`,
  'g'
);

const ANNOUNCER_PATTERNS = [
  /^(?:section|part)\s+(?:\d+|one|two|three|four)\b/i,
  /^you will hear\b/i,
  /^first,? you have some time\b/i,
  /^before you hear\b/i,
  /^now listen(?: carefully)?\b/i,
  /^listen carefully\b/i,
  /^you should answer the questions\b/i,
  /^you will see that there is an example\b/i,
  /^on this occasion only\b/i,
  /^now we shall begin\b/i,
  /^that is the end of\b/i,
  /^you now have\b/i,
  /^the customer(?:'s|s') name\b/i,
];

const SILENCE_PATTERN = /^(?:\[|\()?\s*(?:silence|no speech|inaudible)\s*(?:\]|\))?[.!]?$/i;

/**
 * Repairs a narrowly defined malformed SRT shape produced by some AI responses:
 *
 *   00:58:300 --> 1
 *   00:58:900
 *
 * The standalone digit is not a timestamp; the following line is the intended
 * cue end. Valid SRT and plain transcript text are left unchanged.
 */
export function normalizeSrtContent(srtContent) {
  if (!srtContent || typeof srtContent !== 'string') return '';

  return srtContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^\s*```(?:srt)?[ \t]*\n?/i, '')
    .replace(/\n?[ \t]*```[ \t]*$/i, '')
    .replace(SPLIT_END_TIMESTAMP_PATTERN, '$1 $2')
    .trim();
}

/**
 * Parses SRT timestamp into seconds.
 *
 * Handles all variants encountered in AI-generated and official SRT files:
 *   Standard:         00:02:03,500   →  123.5 s
 *   Short M:S:        02:03,500      →  123.5 s
 *   Colon-only M:S:   02:03:500      →  123.5 s  (ms written after last colon)
 *   Malformed H:M:S:  01:02:02,900   →   62.9 s  (hours digit is really minutes)
 *
 * The key insight: IELTS audio never exceeds ~10 minutes per part (~900 s).
 * If interpreting the first group as hours yields > 900 s, we re-interpret the
 * timestamp as M:S with fractional seconds.
 *
 * @param {string} timestamp - SRT-format timestamp string
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timestamp) {
  const candidates = buildTimestampCandidates(timestamp);

  if (!candidates.length) {
    return 0;
  }

  return candidates[0].value;
}

function pushCandidate(candidates, value, weight) {
  if (!Number.isFinite(value) || value < 0) {
    return;
  }

  const normalized = Number(value.toFixed(3));
  const existing = candidates.find((candidate) => candidate.value === normalized);

  if (existing) {
    existing.weight = Math.min(existing.weight, weight);
    return;
  }

  candidates.push({ value: normalized, weight });
}

function buildTimestampCandidates(timestamp) {
  if (!timestamp) return [];

  const trimmed = timestamp.trim();
  const candidates = [];

  // ── 3-part match: H:M:S,ms or malformed M:S:ms variants ────────────
  const threePartMatch = trimmed.match(/^(\d{1,2}):(\d{1,2}):(\d{1,3})(?:[,.](\d{1,3}))?$/);

  if (threePartMatch) {
    const [, p1, p2, p3, msFrac] = threePartMatch;
    const v1 = parseInt(p1, 10);
    const v2 = parseInt(p2, 10);
    const v3 = parseInt(p3, 10);
    const ms = msFrac ? parseFloat(`0.${msFrac}`) : 0;

    const asHMS = v1 * 3600 + v2 * 60 + v3 + ms;
    const asMinuteSecondMilliseconds = v1 * 60 + v2 + v3 / 1000;
    // A third, colon-delimited field over 59 cannot be seconds. Some source
    // exports write milliseconds as `MM:SS:mmm` (for example `00:01:400`).
    // Prefer that unambiguous interpretation before the usual H:M:S form;
    // otherwise a 1.4-second cue is incorrectly placed at 7:40.
    const isColonDelimitedMilliseconds = msFrac === undefined && v3 > 59;

    pushCandidate(
      candidates,
      asHMS,
      isColonDelimitedMilliseconds ? 3 : asHMS <= MAX_REASONABLE_TIMESTAMP ? 0 : 3
    );
    pushCandidate(candidates, asMinuteSecondMilliseconds, isColonDelimitedMilliseconds ? 0 : 1);

    // A second corruption seen in the same export family prefixes the minute
    // field with a trailing zero: `10:02:400` represents 1:02.400, not ten
    // minutes. Keep the normal interpretation as a candidate, but prefer the
    // compact form when the milliseconds field makes the format unambiguous.
    if (isColonDelimitedMilliseconds && v1 >= 10 && v1 % 10 === 0) {
      pushCandidate(candidates, (v1 / 10) * 60 + v2 + v3 / 1000, 0);
    }

    if (msFrac !== undefined) {
      // Some imported files encode the third group as whole seconds.
      pushCandidate(candidates, v1 * 60 + v2 + v3 + ms, 2);

      // Other malformed files encode the third group as centiseconds.
      pushCandidate(candidates, v1 * 60 + v2 + v3 / 100 + ms, 2);
    }

    return candidates.sort((a, b) => a.weight - b.weight || a.value - b.value);
  }

  // ── 2-part match: M:S or malformed duplicated-minute M:S ────────────
  const twoPartMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/);

  if (twoPartMatch) {
    const [, mStr, sStr, msStr] = twoPartMatch;
    const m = parseInt(mStr, 10);
    const s = parseInt(sStr, 10);
    const ms = msStr ? parseFloat(`0.${msStr}`) : 0;
    const asMinuteSecond = m * 60 + s + ms;

    pushCandidate(candidates, asMinuteSecond, 0);

    if (asMinuteSecond > MAX_REASONABLE_TIMESTAMP && mStr.length > 1) {
      pushCandidate(candidates, parseInt(mStr.slice(1), 10) * 60 + s + ms, 1);
    }

    return candidates.sort((a, b) => a.weight - b.weight || a.value - b.value);
  }

  return [];
}

function buildSegmentTimingOptions(segment) {
  const startCandidates = buildTimestampCandidates(segment.startRaw);
  const endCandidates = buildTimestampCandidates(segment.endRaw);
  const options = [];

  for (const startCandidate of startCandidates) {
    for (const endCandidate of endCandidates) {
      if (endCandidate.value <= startCandidate.value) {
        continue;
      }

      const duration = endCandidate.value - startCandidate.value;
      const overlongPenalty =
        duration > MAX_PLAUSIBLE_SEGMENT_DURATION
          ? (duration - MAX_PLAUSIBLE_SEGMENT_DURATION) * 5
          : 0;

      options.push({
        start: startCandidate.value,
        end: endCandidate.value,
        cost: startCandidate.weight + endCandidate.weight + overlongPenalty,
      });
    }
  }

  if (!options.length) {
    const fallbackStart = startCandidates[0]?.value ?? segment.start;
    const fallbackEnd = Math.max(endCandidates[0]?.value ?? segment.end, fallbackStart + 3);
    options.push({
      start: fallbackStart,
      end: fallbackEnd,
      cost: 50,
    });
  }

  return options.sort((a, b) => a.cost - b.cost || a.start - b.start || a.end - b.end);
}

function getTransitionCost(previousOption, currentOption) {
  if (currentOption.start < previousOption.start - START_ORDER_TOLERANCE) {
    return Number.POSITIVE_INFINITY;
  }

  const overlap = previousOption.end - currentOption.start;
  const overlapPenalty =
    overlap > OVERLAP_TOLERANCE
      ? (overlap - OVERLAP_TOLERANCE) * 20
      : overlap > 0
        ? overlap * 2
        : 0;

  const gap = currentOption.start - previousOption.end;
  const gapPenalty = gap > GAP_PENALTY_THRESHOLD ? (gap - GAP_PENALTY_THRESHOLD) * 0.2 : 0;

  return overlapPenalty + gapPenalty;
}

function repairNonMonotonicSegments(segments) {
  const timingOptions = segments.map(buildSegmentTimingOptions);
  const dp = timingOptions.map((options) => options.map(() => Number.POSITIVE_INFINITY));
  const backtrack = timingOptions.map((options) => options.map(() => -1));

  timingOptions[0].forEach((option, index) => {
    dp[0][index] = option.cost;
  });

  for (let i = 1; i < timingOptions.length; i++) {
    for (let currentIndex = 0; currentIndex < timingOptions[i].length; currentIndex++) {
      const currentOption = timingOptions[i][currentIndex];

      for (let previousIndex = 0; previousIndex < timingOptions[i - 1].length; previousIndex++) {
        const previousCost = dp[i - 1][previousIndex];

        if (!Number.isFinite(previousCost)) {
          continue;
        }

        const transitionCost = getTransitionCost(
          timingOptions[i - 1][previousIndex],
          currentOption
        );

        if (!Number.isFinite(transitionCost)) {
          continue;
        }

        const candidateCost = previousCost + currentOption.cost + transitionCost;

        if (candidateCost < dp[i][currentIndex]) {
          dp[i][currentIndex] = candidateCost;
          backtrack[i][currentIndex] = previousIndex;
        }
      }
    }
  }

  let bestIndex = 0;
  let bestCost = Number.POSITIVE_INFINITY;
  const lastRow = dp[dp.length - 1];

  lastRow.forEach((cost, index) => {
    if (cost < bestCost) {
      bestCost = cost;
      bestIndex = index;
    }
  });

  if (!Number.isFinite(bestCost)) {
    return segments;
  }

  const repaired = [...segments];
  for (let i = repaired.length - 1; i >= 0; i--) {
    const option = timingOptions[i][bestIndex];
    repaired[i] = {
      ...repaired[i],
      start: option.start,
      end: option.end,
    };
    bestIndex = i > 0 ? backtrack[i][bestIndex] : bestIndex;
  }

  return repaired;
}

function repairIsolatedHourSentinels(segments) {
  return segments.map((segment, index) => {
    const previous = segments[index - 1];
    const isHourSentinel = /^\d{1,2}:00:00(?:[,.]0{1,3})?$/.test(segment.startRaw);

    if (
      previous &&
      isHourSentinel &&
      segment.start < previous.end &&
      segment.end > previous.end + START_ORDER_TOLERANCE
    ) {
      return {
        ...segment,
        start: Math.min(segment.end - 0.05, previous.end + 0.1),
      };
    }

    return segment;
  });
}

/**
 * Extracts speaker label from text (e.g., "SPEAKER 1: Hello" -> { speaker: "SPEAKER 1", text: "Hello" })
 * @param {string} text - Raw subtitle text
 * @returns {{ speaker: string | null, text: string }}
 */
export function extractSpeaker(text) {
  if (!text) return { speaker: null, text: '' };

  // Match patterns like "SPEAKER 1:", "INTERVIEWER:", "LUISA:", etc.
  const speakerMatch = text.match(/^([A-Z][A-Z0-9\s]+):\s*(.*)$/);

  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      text: speakerMatch[2].trim(),
    };
  }

  return { speaker: null, text: text.trim() };
}

export function isSilenceSegment(segmentOrText) {
  const text =
    typeof segmentOrText === 'string' ? segmentOrText : String(segmentOrText?.text || '');
  return SILENCE_PATTERN.test(text.trim());
}

export function isAnnouncerText(text) {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  return ANNOUNCER_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Adds presentation-only speaker continuity without changing cue timing.
 * Explicit labels remain authoritative. Announcer copy is recognized from the
 * fixed IELTS instructions, and dialogue cues inherit the last explicit
 * speaker until another label appears.
 */
export function resolveTranscriptSpeakers(segments) {
  let activeSpeaker = null;
  let previous = null;

  return segments.map((segment) => {
    let speaker = segment.speaker;

    if (speaker) {
      activeSpeaker = speaker;
    } else if (isAnnouncerText(segment.text)) {
      speaker = 'ANNOUNCER';
      activeSpeaker = speaker;
    } else if (activeSpeaker === 'ANNOUNCER') {
      const gap = previous ? segment.start - previous.end : Number.POSITIVE_INFINITY;
      speaker = gap <= 2 ? activeSpeaker : null;
      if (!speaker) activeSpeaker = null;
    } else if (activeSpeaker) {
      speaker = activeSpeaker;
    }

    const resolved = { ...segment, speaker };
    previous = resolved;
    return resolved;
  });
}

/**
 * Parses image-style/plain audioscripts that have speaker labels but no time
 * codes. These entries are deliberately unsynchronised: callers must not
 * invent seek positions for source text that has no timing evidence.
 */
export function parsePlainTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') return [];

  const content = transcript.replace(/\r\n?/g, '\n').trim();
  const labelPattern = /(?:^|\n)\s*[‘'"“]?([A-Z][A-Z0-9 .&'’-]{1,48}):\s*/g;
  const matches = [...content.matchAll(labelPattern)];

  return matches
    .map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? content.length;
      return {
        id: index + 1,
        start: null,
        end: null,
        speaker: match[1].trim(),
        text: content.slice(start, end).replace(/\s+/g, ' ').trim(),
      };
    })
    .filter((segment) => segment.text && !isSilenceSegment(segment));
}

/**
 * Parses SRT content into structured array of segments
 * Supports pattern-based splitting for robustness
 * @param {string} srtContent - Raw SRT file content
 * @returns {Array<{ id: number, start: number, end: number, speaker: string | null, text: string }>}
 */
export function parseSrt(srtContent) {
  if (!srtContent || typeof srtContent !== 'string') return [];

  const content = normalizeSrtContent(srtContent);

  const cueMatches = [...content.matchAll(CUE_PATTERN)];

  const segments = cueMatches
    .map((match, cueIndex) => {
      const [, idRaw, startRaw, endRaw, rawText] = match;
      const start = parseTimestamp(startRaw);
      const end = parseTimestamp(endRaw);
      const fullText = rawText.replace(/\n\s*(?=\S)/g, ' ').trim();

      const { speaker, text } = extractSpeaker(fullText);
      const id = parseInt(idRaw, 10) || cueIndex + 1;

      return { id, startRaw, endRaw, start, end, speaker, text };
    })
    .filter(Boolean)
    .filter((segment) => !isSilenceSegment(segment));

  const sentinelRepairedSegments = repairIsolatedHourSentinels(segments);

  const hasNonMonotonicStart = sentinelRepairedSegments.some(
    (segment, index) =>
      index > 0 && segment.start < sentinelRepairedSegments[index - 1].start - START_ORDER_TOLERANCE
  );

  let normalizedSegments = hasNonMonotonicStart
    ? repairNonMonotonicSegments(sentinelRepairedSegments)
    : sentinelRepairedSegments;

  // ── Post-parse sanitization ──────────────────────────────────────────
  // Repair malformed windows and clamp cues so each segment stays within
  // the chronological window implied by the next segment's start time.
  for (let i = 0; i < normalizedSegments.length; i++) {
    const seg = normalizedSegments[i];
    const nextStart = normalizedSegments[i + 1]?.start;

    // If end is suspiciously before or at start, estimate a reasonable duration
    if (seg.end <= seg.start) {
      // Use the next segment's start as the end, or add a default duration
      seg.end = nextStart && nextStart > seg.start ? nextStart : seg.start + 3; // 3-second fallback
      continue;
    }

    // Clamp overlong malformed cues so they cannot swallow later segments.
    if (typeof nextStart === 'number' && seg.end > nextStart) {
      seg.end = nextStart;
    }
  }

  return normalizedSegments.map(({ startRaw: _startRaw, endRaw: _endRaw, ...segment }) => segment);
}

/**
 * Finds the active segment index based on current playback time.
 *
 * Improvements over the original:
 *  - Float-point tolerance (EPSILON): avoids misses when audio.currentTime is
 *    infinitesimally below a segment's exact start value after a seek.
 *  - Lookahead: pre-highlights the upcoming segment when the playhead is within
 *    150 ms of its start, making click-to-seek feel instantaneous.
 *  - Latest overlap wins: if malformed data creates overlapping cues, prefer
 *    the most recent matching segment so highlighting keeps moving forward.
 *  - Wider gap sticky window (5 s): keeps the last segment lit during natural
 *    pauses between speakers that are longer than 1.5 s.
 *
 * @param {Array} segments - Parsed SRT segments
 * @param {number} currentTime - Current audio playback time in seconds
 * @returns {number} Index of active segment, or -1 if none
 */
export function findActiveSegment(segments, currentTime) {
  if (!segments || !segments.length) return -1;

  // Small tolerance to absorb floating-point imprecision after seeks.
  const EPSILON = 0.05; // 50 ms

  // 1. Strict overlap (with float tolerance on the start boundary).
  //    Scan backwards so the newest matching cue wins when malformed data
  //    creates overlapping segment ranges.
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (currentTime >= seg.start - EPSILON && currentTime < seg.end) {
      return i;
    }
  }

  // 2. Gap sticky — keep the last segment highlighted during short pauses.
  //    Set to 5.0 s to cover natural speaker pauses in IELTS Part 2 monologues
  //    which can have longer topic-transition pauses.
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    if (currentTime >= seg.end && currentTime < nextSeg.start) {
      const gap = nextSeg.start - seg.end;
      if (gap < 5.0) {
        return i; // Keep previous segment active across the gap
      }
    }
  }

  // 3. Lookahead — pre-highlight the next segment when we are within 150 ms
  //    of its start.  This makes click-to-seek feel immediate because the
  //    Zustand update from seek() arrives before the audio element actually
  //    enters the segment window.
  const LOOKAHEAD = 0.15; // 150 ms
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (currentTime >= seg.start - LOOKAHEAD && currentTime < seg.start) {
      return i;
    }
  }

  return -1;
}

export default parseSrt;
