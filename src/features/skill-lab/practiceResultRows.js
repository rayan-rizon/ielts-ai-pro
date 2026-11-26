// Past results behind a suggestion, shaped for the history lists.

const NOT_COUNTED = {
  repeat: 'you had answered these before',
  blank: 'nothing was answered',
  assisted: 'you had help',
  older: 'newer results are used instead',
};

/** The server sends sources and history as two lists in the same order. */
export const resultRows = (need) =>
  (need?.sources || []).map((source, index) => ({
    ...need.history?.[index],
    ...source,
    focus: need.focus,
  }));

export function resultLink({ focus, sessionId, practice }) {
  if (practice) return `/practice-lab/session/${sessionId}?library=1`;
  const subject = focus.startsWith('listening:') ? 'listening' : 'reading';
  return `/${subject}-test/${sessionId}?view-results=true`;
}

/** Older server responses carry neither field, so they get no note. */
export function resultNotes({ answered, total, status }) {
  const blank = Number.isFinite(answered) ? total - answered : 0;
  return [
    blank > 0 && `${blank} not answered`,
    NOT_COUNTED[status] && `Not counted: ${NOT_COUNTED[status]}`,
  ].filter(Boolean);
}
