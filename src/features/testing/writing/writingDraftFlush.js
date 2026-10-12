// Editors keep typing local for responsiveness. Submission must synchronize
// every mounted editor before taking a snapshot for validation or persistence.
const flushers = new Set();

export function registerWritingDraftFlusher(flush) {
  flushers.add(flush);
  return () => flushers.delete(flush);
}

export function flushPendingWritingDrafts() {
  for (const flush of flushers) flush();
}
