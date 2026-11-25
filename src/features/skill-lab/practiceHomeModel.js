// Pure calculations behind the Practice Lab home page and the session progress bar.
import { reviewItems } from './practiceReview';

const NEEDS_WORK_BELOW = 0.5;
const STRONG_FROM = 0.8;
const DAY_MS = 86_400_000;
// The reading multi-select stores its letters as one "A, C" string.
const LETTER_LIST = /^[A-Z](\s*,\s*[A-Z])+$/;

export function typeStatus(need) {
  if (!need?.total) return 'untried';
  const ratio = need.correct / need.total;
  if (ratio < NEEDS_WORK_BELOW) return 'needs_work';
  return ratio < STRONG_FROM ? 'getting_there' : 'strong';
}

const filled = (value) => String(value ?? '').trim() !== '';

function chosenCount(value) {
  if (Array.isArray(value)) return value.filter(filled).length;
  if (!filled(value)) return 0;
  const text = String(value).trim();
  return LETTER_LIST.test(text) ? text.split(',').length : 1;
}

export function answeredCount(answers, total) {
  const count = Object.values(answers || {}).reduce((sum, value) => sum + chosenCount(value), 0);
  return total > 0 ? Math.min(count, total) : count;
}

const startOfDay = (time) => new Date(time).setHours(0, 0, 0, 0);

export function startedAgo(createdAt, now = Date.now()) {
  const created = new Date(createdAt ?? Number.NaN).getTime();
  if (Number.isNaN(created)) return '';
  const days = Math.round((startOfDay(now) - startOfDay(created)) / DAY_MS);
  if (days <= 0) return 'Started today';
  return days === 1 ? 'Started yesterday' : `Started ${days} days ago`;
}

function progressText(answers, total) {
  const done = answeredCount(answers, total);
  if (!done) return 'Not started';
  return total > 0 ? `${done} of ${total} answered` : `${done} answered`;
}

export function sessionSummary(session, group, now) {
  return [
    session.focus?.startsWith('listening:') ? 'Listening' : 'Reading',
    group?.title,
    progressText(session.answers, group?.total),
    startedAgo(session.created_at, now),
  ]
    .filter(Boolean)
    .join(' · ');
}

const isSelection = (items) => items.length > 1 && String(items[1].id).includes('_option_');

/** Multi-select picks are not tied to a number, so they fill the slots in order. */
function selectionAnswered(items, answers) {
  const base = items[0].id;
  const keyed = items.slice(1).filter((item) => filled(answers[item.id])).length;
  const direct = chosenCount(answers[base]);
  const done = Math.max(direct, keyed + Math.min(direct, 1));
  return items.map((_, index) => index < done);
}

// The review rows are matched by position, so their ids are not always the keys
// the answer inputs write to. These two follow the renderers instead.
function paragraphSlotItems(question) {
  const matching = question.matching_features;
  if (matching?.mode !== 'paragraph') return null;
  const numbers = [...String(matching.text || '').matchAll(/\[(\d+)\]/g)].map((match) => match[1]);
  if (!numbers.length) return null;
  return numbers.map((number) => ({ id: `${question.id}_${number}`, number }));
}

/** Listening matching saves under the sub-question id alone. */
function answerKeys(question, item) {
  const nested = question.matching_features?.questions || [];
  const bare = nested.find((sub) => sub.id && `${question.id}_${sub.id}` === item.id);
  return bare ? [item.id, bare.id] : [item.id];
}

function slotItems(question, answers) {
  const items = paragraphSlotItems(question) || reviewItems(question);
  const answered = isSelection(items)
    ? selectionAnswered(items, answers)
    : items.map((item) => answerKeys(question, item).some((key) => chosenCount(answers[key]) > 0));
  return items.map((item, index) => ({
    id: String(item.id),
    questionId: question.id,
    number: Number(item.number),
    answered: answered[index],
  }));
}

export function questionSlots(questions, answers = {}) {
  return (questions || [])
    .flatMap((question) => slotItems(question, answers))
    .sort((a, b) => a.number - b.number);
}
