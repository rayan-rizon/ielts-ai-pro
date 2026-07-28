export function getLearningActivityId(search = window.location.search) {
  return new URLSearchParams(search).get('activityId');
}

export function withLearningActivity(url, search = window.location.search) {
  const activityId = getLearningActivityId(search);
  if (!activityId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}activityId=${encodeURIComponent(activityId)}`;
}
