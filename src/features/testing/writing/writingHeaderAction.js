/** A reviewed test has nothing left to analyse; the button opens the report. */
const lockedAction = ({ hasFeedback, reviewed }) =>
  [hasFeedback, reviewed].some(Boolean) ? 'view' : 'analyze';

/** On a first sitting, Task 1 leads on to Task 2. */
const leadsToTask2 = ({ openHere, activeType, hasTask2 }) =>
  [!openHere, activeType === 'Task 1', hasTask2].every(Boolean);

/** What the Writing header's main button does for the task on screen. */
export function writingHeaderAction(state) {
  const { locked, hasFeedback, testMode } = state;
  if (locked) return lockedAction(state);
  if (leadsToTask2(state)) return 'next';
  if (testMode === 'exam') return 'submit';
  return hasFeedback ? 'redo' : 'feedback';
}
