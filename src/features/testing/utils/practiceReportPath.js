export function getFullReportPath(session) {
  if (!session) return null;
  switch (session.type) {
    case 'reading':
      return `/reading-test/${session.id}?view-results=true`;
    case 'listening':
      return `/listening-test/${session.id}?view-results=true`;
    case 'writing':
      return `/writing-task?sessionId=${session.id}&view=true`;
    case 'speaking':
      return `/speaking-test/${session.id}?view-score=true`;
    default:
      return null;
  }
}
