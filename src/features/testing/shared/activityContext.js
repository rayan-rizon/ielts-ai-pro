export function getLearningActivityId(search = window.location.search) {
  return new URLSearchParams(search).get('activityId');
}

export function getRequestedTestMode(search = window.location.search) {
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'exam' || mode === 'mock' ? 'exam' : 'practice';
}

export function withLearningActivity(url, search = window.location.search) {
  const source = new URLSearchParams(search);
  const targetUrl = new URL(url, 'https://learning-path.local');
  const activityId = source.get('activityId');
  const mode = source.get('mode');
  const writingTask = source.get('writingTask');
  if (activityId) targetUrl.searchParams.set('activityId', activityId);
  if (mode) targetUrl.searchParams.set('mode', mode);
  if (writingTask === 'Task 1' || writingTask === 'Task 2') {
    targetUrl.searchParams.set('writingTask', writingTask);
  }
  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}
