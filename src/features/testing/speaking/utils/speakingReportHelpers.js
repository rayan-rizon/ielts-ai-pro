export const compactText = (value, { maxSentences = 1, maxChars = 160 } = {}) => {
  if (typeof value !== 'string') return '';
  const normalized = value
    .trim()
    .replace(/^[`"'“”]+|[`"'“”]+$/g, '')
    .replace(/\s+/g, ' ');
  if (!normalized) return '';

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
  const selected = sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(' ');

  if (selected.length <= maxChars) return selected;
  const clipped = selected.slice(0, maxChars - 3);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : clipped.length).trim()}...`;
};

export const textKey = (value) =>
  compactText(value, { maxSentences: 1, maxChars: 220 })
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const uniqueCompactList = (items, options = {}) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => compactText(item, options))
    .filter((item) => {
      const key = textKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const cleanStrengthText = (value) => {
  const normalized = compactText(value, { maxSentences: 1, maxChars: 260 })
    .replace(/^(the\s+)?candidate\s+/i, '')
    .replace(/^(showed|demonstrated|displayed)\s+some\s+/i, '')
    .replace(/^(attempted|tried)\s+to\s+/i, 'Attempted to ')
    .replace(/^(can\s+)/i, 'Can ')
    .replace(/\s*,?\s*(for example|for instance|such as)\b.*$/i, '')
    .replace(/\s+,?\s*even with brief answers.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/[.,;:]+$/, '.');
};

export const compactStrengthList = (items, maxItems = 3) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map(cleanStrengthText)
    .filter((item) => {
      const key = item
        .toLowerCase()
        .replace(/\b(parts?|questions?|answers?|responses?)\b/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
};

const getDevelopmentAreaTitle = (item) => {
  if (typeof item === 'string') return 'Next step';
  if (!item) return 'Next step';
  return item.criterion || item.area || 'Next step';
};

const getDevelopmentAreaContent = (item) => {
  if (typeof item === 'string') return item;
  if (!item) return '';
  return item.tip || item.suggestion || item.feedback || '';
};

export const compactDevelopmentArea = (item) => {
  return {
    title: compactText(getDevelopmentAreaTitle(item), { maxSentences: 1, maxChars: 32 }),
    content: compactText(getDevelopmentAreaContent(item), { maxSentences: 1, maxChars: 170 }),
  };
};
