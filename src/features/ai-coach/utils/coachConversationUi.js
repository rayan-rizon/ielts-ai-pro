const TOPICS = [
  {
    key: 'writing',
    pattern: /\b(writing|essay|task\s*[12]|introduction|paragraph|graph|chart)\b/i,
  },
  { key: 'speaking', pattern: /\b(speaking|pronunciation|fluency|hometown|part\s*[123])\b/i },
  { key: 'reading', pattern: /\b(reading|headings|true.?false|not given|passage)\b/i },
  { key: 'listening', pattern: /\b(listening|audio|transcript|section\s*[1-4])\b/i },
  { key: 'plan', pattern: /\b(plan|schedule|practise|practice|study|improv)\b/i },
];

export function coachTopic(text = '') {
  return TOPICS.find(({ pattern }) => pattern.test(String(text)))?.key || 'general';
}

export function coachFollowUps(messages = []) {
  const latest = messages.at(-1);
  if (latest?.role !== 'assistant') return [];
  const suggestions = latest.followUps || latest.follow_ups;
  if (!Array.isArray(suggestions)) return [];
  const seen = new Set(
    messages
      .filter(({ role }) => role === 'user')
      .map(({ content }) => content?.trim().toLocaleLowerCase())
  );
  return suggestions
    .filter(
      (question) =>
        typeof question === 'string' &&
        question.trim().length > 0 &&
        question.trim().length <= 140 &&
        !/^(?:would you like|do you want|would you prefer|shall we|let's)\b/iu.test(question.trim())
    )
    .map((question) => question.trim())
    .filter((question) => {
      const key = question.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function groupCoachConversations(conversations = [], now = new Date()) {
  const groups = [
    { label: 'Today', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Earlier', items: [] },
  ];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const conversation of conversations) {
    const date = new Date(conversation.last_message_at);
    const daysAgo = Number.isNaN(date.getTime())
      ? Infinity
      : Math.floor(
          (today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000
        );
    const group = daysAgo <= 0 ? groups[0] : daysAgo <= 7 ? groups[1] : groups[2];
    group.items.push(conversation);
  }
  return groups.filter(({ items }) => items.length);
}
