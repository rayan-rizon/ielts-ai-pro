/** The plain facts around a Writing band: how long, when, and against what. */

/** Under a minute means the answer was pasted in, so the time says nothing. */
const MINIMUM_SECONDS = 60;

export function timeUsed(seconds) {
  const total = Math.round(Number(seconds));
  if (!(total >= MINIMUM_SECONDS)) return null;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Day, short month, year. Persian would otherwise switch to its own calendar. */
const LOCALES = { en: 'en-GB', fa: 'fa-u-ca-gregory' };

export function reportDate(value, language) {
  const date = new Date(value || Number.NaN);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(LOCALES[language] || language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const BAND_COLUMN = { 'Task 1': 'task1', 'Task 2': 'task2' };

/** From attempts listed newest first, the band this task last received. */
export function lastBandIn(rows, taskType) {
  const column = BAND_COLUMN[taskType];
  const row = (rows || []).find((item) => Number(item[column]) > 0);
  return row ? { band: Number(row[column]), at: row.evaluated_at } : null;
}

const MOVES = { 1: 'upFromLast', 0: 'sameAsLast', [-1]: 'downFromLast' };

export function compareWithLast(band, previous) {
  const difference = Number(band) - Number(previous?.band);
  if (!Number.isFinite(difference)) return null;
  const direction = Math.sign(difference);
  return { key: MOVES[direction], direction, delta: Math.abs(difference).toFixed(1) };
}
