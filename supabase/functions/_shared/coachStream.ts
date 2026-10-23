import { answerBreaksSafetyRules, claimNumbers } from './aiCoach.ts';

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
    const next = raw[index + 1];
    if (next === undefined) break;
    if (next === 'u') {
      const hex = raw.slice(index + 2, index + 6);
      if (hex.length < 4) break;
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) return { text: out, closed: false };
      out += String.fromCharCode(parseInt(hex, 16));
      index += 6;
      continue;
    }
    const simple: Record<string, string> = {
      n: '\n',
      t: '\t',
      r: '\r',
      b: '\b',
      f: '\f',
      '"': '"',
      '\\': '\\',
      '/': '/',
    };
    out += simple[next] ?? next;
    index += 2;
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
    this.emit(segment);
  }

  private start(raw: string) {
    const match = ANSWER_KEY.exec(raw);
    if (!match) return false;
    // `answer` came before the grounding fields, so nothing could be checked first.
    const prefix = raw.slice(0, match.index).replace(/[\s,]+$/, '');
    let head: any;
    try {
      head = JSON.parse(`${prefix}}`);
    } catch {
      this.stopped = true;
      return false;
    }
    const { language, evidenceById, personalQuestion } = this.context;
    const refs = Array.isArray(head?.evidenceRefs) ? head.evidenceRefs : [];
    const validRefs = refs.every(
      (ref: any) => typeof ref?.id === 'string' && evidenceById.has(ref.id)
    );
    const status = head?.groundingStatus;
    const languageOk = head?.responseLanguage === undefined || head.responseLanguage === language;
    let grounded =
      validRefs && languageOk && ['supported', 'insufficient', 'general'].includes(status);
    if (personalQuestion && evidenceById.size > 0)
      grounded = grounded && status === 'supported' && refs.length > 0;
    if (personalQuestion && evidenceById.size === 0)
      grounded = grounded && status === 'insufficient' && refs.length === 0;
    if (!grounded) {
      this.stopped = true;
      return false;
    }
    this.citedText = refs
      .map((ref: any) => JSON.stringify(evidenceById.get(ref.id) ?? {}))
      .join(' ');
    this.started = true;
    return true;
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
