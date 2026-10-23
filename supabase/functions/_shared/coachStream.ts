import { answerBreaksSafetyRules, claimNumbers, restoreLineBreaks } from './aiCoach.ts';

// Streams Ava's answer to the browser while the model is still writing it, without
// giving up the checks that normally run on the finished reply.
//
// The model is told to write `responseLanguage`, `groundingStatus` and `evidenceRefs`
// before `answer`. Nothing is shown until that prefix has been parsed and passes the same
// grounding rules as a finished reply. After that, only COMPLETE sentences are released,
// and each one is checked against the same safety rules (no score promises, no invented
// deadlines, no evidence metadata, and for personal questions every number must come from
// the cited evidence). If any check fails, streaming stops for good and the learner waits
// for the fully validated reply instead. The finished reply is always validated again and
// is what the app keeps, so a stream can only ever show less than the final answer, never
// something the final validation would have rejected.

export type CoachStreamContext = {
  language: string;
  evidenceById: Map<string, unknown>;
  /** The question asks about this learner's own results. */
  personalQuestion: boolean;
  /** What the learner typed; numbers they supplied are not claims about their results. */
  studentMessage?: string;
};

const ANSWER_KEY = /"answer"\s*:\s*"/;
const GROUNDING_STATUSES = ['supported', 'insufficient', 'general'];

/** The JSON written before `"answer"`, closed so it can be parsed; null if it cannot be. */
function parseHead(prefix: string) {
  try {
    return JSON.parse(`${prefix.replace(/[\s,]+$/, '')}}`);
  } catch {
    return null;
  }
}

const SIMPLE_ESCAPES: Record<string, string> = {
  n: '\n',
  t: '\t',
  r: '\r',
  b: '\b',
  f: '\f',
  '"': '"',
  '\\': '\\',
  '/': '/',
};

/** One escape sequence at `index` (a backslash). `null` means it is not complete yet. */
function readEscape(raw: string, index: number): { text: string; length: number } | null {
  const next = raw[index + 1];
  if (next === undefined) return null;
  if (next !== 'u') return { text: SIMPLE_ESCAPES[next] ?? next, length: 2 };
  const hex = raw.slice(index + 2, index + 6);
  if (hex.length < 4) return null;
  if (!/^[0-9a-fA-F]{4}$/.test(hex)) return { text: '', length: 6 };
  return { text: String.fromCharCode(parseInt(hex, 16)), length: 6 };
}

/** Decode the JSON string that starts at `start` as far as the text allows. */
export function decodePartialJsonString(raw: string, start: number) {
  let out = '';
  let index = start;
  while (index < raw.length) {
    const char = raw[index];
    if (char === '"') return { text: out, closed: true };
    if (char !== '\\') {
      out += char;
      index += 1;
      continue;
    }
    const escape = readEscape(raw, index);
    if (!escape) break;
    out += escape.text;
    index += escape.length;
  }
  return { text: out, closed: false };
}

/** End offset of the last complete sentence in `text` (0 when there is none yet). */
export function lastSentenceEnd(text: string) {
  let end = 0;
  const pattern = /[.!?।؟]["')\]”’]*(?=\s)|[。！？]["')\]”’]*|\n/gu;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) end = match.index + match[0].length;
  // Include the single whitespace that follows, so the next chunk starts on a word.
  return end > 0 && /\s/.test(text[end] ?? '') ? end + 1 : end;
}

export class CoachAnswerStreamer {
  private emittedLength = 0;
  private started = false;
  private citedText = '';
  stopped = false;
  emitted = '';

  constructor(
    private readonly context: CoachStreamContext,
    private readonly emit: (segment: string) => void
  ) {}

  /** Feed the whole raw JSON text received so far. */
  push(raw: string) {
    if (this.stopped) return;
    if (!this.started && !this.start(raw)) return;
    const match = ANSWER_KEY.exec(raw);
    if (!match) return;
    const { text, closed } = decodePartialJsonString(raw, match.index + match[0].length);
    const releasable = closed ? text.length : lastSentenceEnd(text);
    if (releasable <= this.emittedLength) return;
    const segment = text.slice(this.emittedLength, releasable);
    if (!this.segmentIsSafe(segment, text.slice(0, releasable))) {
      this.stopped = true;
      return;
    }
    this.emittedLength = releasable;
    this.emitted = text.slice(0, releasable);
    this.emit(restoreLineBreaks(segment));
  }

  private start(raw: string) {
    const match = ANSWER_KEY.exec(raw);
    if (!match) return false;
    const head = parseHead(raw.slice(0, match.index));
    const refs = head ? this.groundedRefs(head) : null;
    if (!refs) {
      // `answer` came first or the grounding fields failed, so nothing could be checked.
      this.stopped = true;
      return false;
    }
    this.citedText = refs
      .map((ref: any) => JSON.stringify(this.context.evidenceById.get(ref.id) ?? {}))
      .join(' ');
    this.started = true;
    return true;
  }

  /** The cited references when the grounding fields pass the same rules as a finished reply. */
  private groundedRefs(head: any) {
    const { language, evidenceById, personalQuestion } = this.context;
    const refs = Array.isArray(head.evidenceRefs) ? head.evidenceRefs : [];
    const status = head.groundingStatus;
    const refsKnown = refs.every(
      (ref: any) => typeof ref?.id === 'string' && evidenceById.has(ref.id)
    );
    const languageOk = head.responseLanguage === undefined || head.responseLanguage === language;
    if (!refsKnown || !languageOk || !GROUNDING_STATUSES.includes(status)) return null;
    if (!personalQuestion) return refs;
    const supported = evidenceById.size > 0;
    const personalOk = supported
      ? status === 'supported' && refs.length > 0
      : status === 'insufficient' && refs.length === 0;
    return personalOk ? refs : null;
  }

  private segmentIsSafe(segment: string, textSoFar: string) {
    if (answerBreaksSafetyRules(textSoFar)) return false;
    if (this.context.personalQuestion && this.context.evidenceById.size > 0) {
      const numbers = claimNumbers(segment, this.context.studentMessage);
      if (numbers.some((number) => !this.citedText.includes(number))) return false;
    }
    if (this.context.personalQuestion && this.context.evidenceById.size === 0) {
      if (/\b(?:band|score)\s*[0-9](?:\.[05])?\b/i.test(segment)) return false;
    }
    return true;
  }
}
