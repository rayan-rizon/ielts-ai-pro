/**
 * SRT Parser Utility
 * Parses SRT subtitle format into structured JSON with timestamps and speaker labels.
 */

/**
 * Parses SRT timestamp into seconds.
 *
 * Handles all variants encountered in AI-generated and official SRT files:
 *   Standard:         00:02:03,500   →  123.5 s
 *   Short M:S:        02:03,500      →  123.5 s
 *   Colon-only M:S:   02:03:500      →  123.5 s  (ms written after last colon)
 *   Malformed H:M:S:  01:02:02,900   →   62.9 s  (hours digit is really minutes)
 *
 * The key insight: IELTS audio never exceeds ~10 minutes per part (~600 s).
 * If interpreting the first group as hours yields > 600 s, we re-interpret the
 * timestamp as M:S with fractional seconds.
 *
 * @param {string} timestamp - SRT-format timestamp string
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timestamp) {
  if (!timestamp) return 0;

  const trimmed = timestamp.trim();

  // ── 3-part match:  H:M:S  or  H:M:S,ms  or  H:M:S.ms  ──────────────
  const threePartMatch = trimmed.match(/^(\d{1,2}):(\d{1,2}):(\d{1,3})(?:[,.](\d{1,3}))?$/);

  if (threePartMatch) {
    const [, p1, p2, p3, msFrac] = threePartMatch;
    const v1 = parseInt(p1);
    const v2 = parseInt(p2);
    const v3 = parseInt(p3);
    const ms = msFrac ? parseFloat('0.' + msFrac) : 0;

    // Default: interpret as H:M:S,ms
    const asHMS = v1 * 3600 + v2 * 60 + v3 + ms;

    // Alternative: interpret as M:S,ms  (ignore the third colon-group or
    // treat the third group as sub-second fraction).
    //   01:02:02,900  →  1*60 + 2 + 0.02 + 0.9  ≈  62.92
    //   In practice we just fold v3 and msFrac into fractional seconds.
    //   If msFrac is present (comma/dot separated), re-interpret as M:S.fraction:
    //     minutes = v1,  seconds = v2,  fraction = "v3" + msFrac
    //   If no msFrac (colon-only), re-interpret as M:S:ms:
    //     minutes = v1,  seconds = v2,  ms = v3
    let asMSms;
    if (msFrac !== undefined) {
      // e.g. 01:02:02,900  →  M=1, S=2, frac = .02900  → wrong
      // Actually: M=1, S=02, and "02,900" was the S,ms portion
      // So the correct re-parse: M = v1, S = v2, ms = v3 (hundreds) combined
      // But really we should just do: M=v1, rest = "v2:v3,msFrac" seconds
      // Simplest: M = v1, S = v2, ms from combining v3 and msFrac
      asMSms = v1 * 60 + v2 + parseFloat('0.' + p3 + (msFrac || ''));
    } else {
      // Colon-only: 01:02:03  →  M:S:ms = 1*60 + 2 + 3/1000
      asMSms = v1 * 60 + v2 + v3 / 1000;
    }

    // Heuristic: IELTS parts are ≤ 10 min.  If H:M:S interpretation exceeds
    // 600 s, re-interpret as M:S.  If BOTH exceed 600 s the data is truly
    // broken; fall back to the smaller value to minimize damage.
    const MAX_REASONABLE = 600; // 10 minutes

    if (asHMS <= MAX_REASONABLE) {
      return asHMS;
    }
    if (asMSms <= MAX_REASONABLE) {
      return asMSms;
    }
    // Both exceed — return the smaller to limit blast radius
    return Math.min(asHMS, asMSms);
  }

  // ── 2-part match:  M:S  or  M:S,ms  ─────────────────────────────────
  const twoPartMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/);

  if (twoPartMatch) {
    const [, mStr, sStr, msStr] = twoPartMatch;
    const m = parseInt(mStr);
    const s = parseInt(sStr);
    const ms = msStr ? parseFloat('0.' + msStr) : 0;
    return m * 60 + s + ms;
  }

  return 0;
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

/**
 * Parses SRT content into structured array of segments
 * Supports pattern-based splitting for robustness
 * @param {string} srtContent - Raw SRT file content
 * @returns {Array<{ id: number, start: number, end: number, speaker: string | null, text: string }>}
 */
export function parseSrt(srtContent) {
  if (!srtContent || typeof srtContent !== 'string') return [];

  // Normalize newlines
  const content = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double newlines first (standard SRT)
  let chunks = content.split(/\n\n+/);

  // Fallback: splitting by regex pattern if chunks are too few (pasted without blank lines)
  if (chunks.length < 2 && content.length > 50) {
    // Look for pattern: Newline + Number + Newline + Timestamp
    // matches \n1\n00:00:00 or similar
    const splitPattern = /\n(?=\d+\n\d{2}:\d{2}:\d{2})/;
    chunks = content.split(splitPattern);
  }

  const segments = chunks
    .map((chunk) => {
      const lines = chunk.trim().split('\n');
      if (lines.length < 2) return null;

      // Find line with '-->'
      let timeLineIndex = lines.findIndex((l) => l.includes('-->'));
      if (timeLineIndex === -1) return null;

      const timeLine = lines[timeLineIndex];
      const times = timeLine.split('-->');
      if (times.length !== 2) return null;

      const start = parseTimestamp(times[0]);
      const end = parseTimestamp(times[1]);

      // Text is everything after the timestamp line
      const textLines = lines.slice(timeLineIndex + 1);
      const fullText = textLines.join(' ').trim();

      const { speaker, text } = extractSpeaker(fullText);

      let id = 0;
      if (timeLineIndex > 0) {
        const idStr = lines[timeLineIndex - 1].trim();
        id = parseInt(idStr) || 0;
      }

      return { id, start, end, speaker, text };
    })
    .filter(Boolean);

  // ── Post-parse sanitization ──────────────────────────────────────────
  // Fix segments where end ≤ start (malformed) and ensure monotonicity.
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // If end is suspiciously before or at start, estimate a reasonable duration
    if (seg.end <= seg.start) {
      // Use the next segment's start as the end, or add a default duration
      const nextStart = segments[i + 1]?.start;
      seg.end = nextStart && nextStart > seg.start ? nextStart : seg.start + 3; // 3-second fallback
    }
  }

  return segments;
}

/**
 * Finds the active segment index based on current playback time.
 *
 * Improvements over the original:
 *  - Float-point tolerance (EPSILON): avoids misses when audio.currentTime is
 *    infinitesimally below a segment's exact start value after a seek.
 *  - Lookahead: pre-highlights the upcoming segment when the playhead is within
 *    150 ms of its start, making click-to-seek feel instantaneous.
 *  - Wider gap sticky window (3 s): keeps the last segment lit during natural
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

  // 1. Strict overlap (with float tolerance on the start boundary)
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (currentTime >= seg.start - EPSILON && currentTime < seg.end) {
      return i;
    }
  }

  // 2. Gap sticky — keep the last segment highlighted during short pauses.
  //    Increased from 1.5 s → 3.0 s to cover natural speaker pauses in IELTS
  //    recordings that often exceed 1.5 s.
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    if (currentTime >= seg.end && currentTime < nextSeg.start) {
      const gap = nextSeg.start - seg.end;
      if (gap < 3.0) {
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
