/**
 * SRT Parser Utility
 * Parses SRT subtitle format into structured JSON with timestamps and speaker labels.
 */

/**
 * Parses SRT timestamp (00:00:00,000) into seconds
 * Handles loose formatting (e.g. 0:0:5, 00:00:05.50)
 * @param {string} timestamp - SRT format timestamp
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timestamp) {
  if (!timestamp) return 0;

  // 1. Standard Regex (H:M:S,ms or M:S,ms)
  // Note: S is captured as (\d{1,2}). If 3 digits, this fails.
  const stdMatch = timestamp.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/);

  if (stdMatch) {
    const [, hStr, mStr, sStr, msStr] = stdMatch;
    const h = hStr ? parseInt(hStr) : 0;
    const m = parseInt(mStr);
    const s = parseInt(sStr);
    let ms = 0;
    if (msStr) ms = parseFloat('0.' + msStr);

    const seconds = h * 3600 + m * 60 + s + ms;

    // HEURISTIC: Fix Ambiguous "Colon-Separated MS" interpreted as H:M:S
    // If seconds > 3600 (1 hour) AND no standard MS separator was used...
    // AND input matches pattern A:B:C with no comma...
    // Re-interpret as M:S:ms
    const isColonOnly = !timestamp.includes(',') && !timestamp.includes('.');

    if (seconds > 3600 && isColonOnly) {
      const reM = h;
      const reS = m;
      const reMsVal = s;
      return reM * 60 + reS + reMsVal / 1000;
    }

    return seconds;
  }

  // 2. Fallback for 3-digit parts (failed std regex)
  const colonMatch = timestamp.trim().match(/^(\d{1,2}):(\d{1,2}):(\d{1,3})$/);
  if (colonMatch) {
    const [, p1, p2, p3] = colonMatch;
    const v1 = parseInt(p1);
    const v2 = parseInt(p2);
    const v3 = parseInt(p3);

    // Force M:S:ms interpretation
    return v1 * 60 + v2 + v3 / 1000;
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

  return segments;
}

/**
 * Finds the active segment index based on current playback time
 * @param {Array} segments - Parsed SRT segments
 * @param {number} currentTime - Current audio playback time in seconds
 * @returns {number} Index of active segment, or -1 if none
 */
export function findActiveSegment(segments, currentTime) {
  if (!segments || !segments.length) return -1;

  // 1. Check strict overlap first
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (currentTime >= seg.start && currentTime < seg.end) {
      return i;
    }
  }

  // 2. Check gaps (Sticky behavior)
  // If we are in a gap between segment i and i+1, and the gap is small (< 1.5s),
  // keep highlighting segment i to avoid flickering.
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    if (currentTime >= seg.end && currentTime < nextSeg.start) {
      const gap = nextSeg.start - seg.end;
      if (gap < 1.5) {
        return i; // Keep previous segment active
      }
    }
  }

  return -1;
}

export default parseSrt;
