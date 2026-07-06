// ---------------------------------------------------------------------------
// Progress helpers
// ---------------------------------------------------------------------------

export function countWords(text) {
  if (!text) return 0;
  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.split(/\s+/).filter((w) => w.length > 0).length;
}

export function getResponseFromJson(responseStr) {
  if (!responseStr) return null;
  try {
    const parsed = JSON.parse(responseStr);
    return {
      task1Text: parsed['Task 1'] || '',
      task2Text: parsed['Task 2'] || '',
    };
  } catch {
    return null;
  }
}

export function getResponseItem(savedContent) {
  if (!Array.isArray(savedContent)) return null;
  if (savedContent.length === 0) return null;
  const item = savedContent[0];
  return item && typeof item === 'object' ? item : null;
}

export function parseResponseTexts(savedContent) {
  const item = getResponseItem(savedContent);
  if (!item) return { task1Text: '', task2Text: '' };

  const task1 = item.task1_response || '';
  const task2 = item.task2_response || '';
  if (task1) return { task1Text: task1, task2Text: task2 };
  if (task2) return { task1Text: task1, task2Text: task2 };

  const parsed = getResponseFromJson(item.response);
  return parsed || { task1Text: '', task2Text: '' };
}

export function detectHasTask2(test) {
  try {
    const content = typeof test.content === 'string' ? JSON.parse(test.content) : test.content;
    return !!(content && content['Task 2']);
  } catch {
    return false;
  }
}

export function computeProgressValue(task1Words, task2Words, hasTask2) {
  if (hasTask2) {
    const t1 = task1Words >= 50 ? 50 : Math.min(Math.floor((task1Words / 50) * 50), 49);
    const t2 = task2Words >= 100 ? 50 : Math.min(Math.floor((task2Words / 100) * 50), 49);
    return Math.min(t1 + t2, 100);
  }
  if (task1Words >= 50) return 100;
  return Math.min(Math.floor((task1Words / 50) * 100), 99);
}

export function computeWritingProgress(session) {
  if (!session) return 0;
  const { task1Text, task2Text } = parseResponseTexts(session.user_responses);
  const task1Words = countWords(task1Text);
  const task2Words = countWords(task2Text);
  return computeProgressValue(task1Words, task2Words, false);
}

export function computeWritingProgressFull(session, test) {
  if (!session) return 0;
  const { task1Text, task2Text } = parseResponseTexts(session.user_responses);
  const hasTask2 = detectHasTask2(test);
  return computeProgressValue(countWords(task1Text), countWords(task2Text), hasTask2);
}
