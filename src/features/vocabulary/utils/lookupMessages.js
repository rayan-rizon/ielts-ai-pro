/** What the learner is told when a lookup is refused, and what they can do instead. */
export function describeLookupError(error, retryIn = 0) {
  if (!error) return null;
  switch (error.kind) {
    case 'not_a_word':
      return error.message;
    case 'quota':
      return 'You have used today’s AI lookups. Type the meaning yourself, or come back after midnight UTC.';
    case 'budget':
      return 'AI lookups are paused for today. You can still type the meaning yourself.';
    case 'burst':
    case 'busy':
      return retryIn > 0
        ? `You are looking up words quickly. Try again in ${retryIn}s.`
        : 'You can look up again now.';
    case 'offline':
      return 'You appear to be offline. Check your connection, or type the meaning yourself.';
    default:
      return `${error.message || 'AI lookup is unavailable right now.'} You can type the meaning yourself.`;
  }
}
