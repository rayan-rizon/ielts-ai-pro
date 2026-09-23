const COMMON_WORDS = new Set(
  'a an and are as at be been but by can could did do does for from had has have he her his i if in into is it its may my of often on or our she should so than that the their them there these they this those to was were which while who will with would you your'.split(
    ' '
  )
);

const LINKERS = {
  Addition: ['also', 'furthermore', 'moreover', 'in addition', 'additionally'],
  Similarity: ['similarly', 'likewise', 'in the same way'],
  Contrast: [
    'however',
    'although',
    'whereas',
    'on the other hand',
    'nevertheless',
    'conversely',
    'by contrast',
  ],
  Result: ['therefore', 'consequently', 'as a result', 'thus'],
  Example: ['for example', 'for instance', 'such as'],
  Sequence: ['firstly', 'first', 'secondly', 'next', 'then', 'subsequently', 'finally'],
  Clarification: ['specifically', 'in particular', 'in other words', 'that is'],
  Overview: ['overall', 'in general', 'in conclusion', 'to sum up'],
};

export const LINKING_RELATIONS = {
  Addition: 'Adds a point.',
  Similarity: 'Shows similar ideas.',
  Contrast: 'Shows a difference.',
  Result: 'Shows a result.',
  Example: 'Gives an example.',
  Sequence: 'Shows the order.',
  Clarification: 'Explains more clearly.',
  Overview: 'Summarizes the main idea.',
};

function splitSentences(source) {
  let cursor = 0;
  return source
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text) => {
      const start = source.indexOf(text, cursor);
      if (start < 0) return null;
      const end = start + text.length;
      cursor = end;
      return {
        text,
        start,
        end,
        paragraph: (source.slice(0, start).match(/\n/g) || []).length,
      };
    })
    .filter(Boolean);
}

export function plainWritingText(html = '') {
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = String(html);
    for (const node of container.querySelectorAll('script, style, iframe')) node.remove();
    for (const node of container.querySelectorAll('p, div, li, br')) {
      if (node.tagName === 'BR') node.replaceWith('\n');
      else node.prepend('\n');
    }
    return (container.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }
  return String(html)
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function analyzeWriting(text, prompt = '') {
  const source = plainWritingText(text);
  const promptWords = new Set(
    plainWritingText(prompt)
      .toLowerCase()
      .match(/[\p{L}]+/gu) || []
  );
  const words = source.toLowerCase().match(/[\p{L}]+(?:['’-][\p{L}]+)*/gu) || [];
  const sentenceSpans = splitSentences(source);
  const sentences = sentenceSpans.map(({ text }) => text);
  const locations = new Map();
  words.forEach((word, index) => {
    if (word.length < 4 || COMMON_WORDS.has(word)) return;
    locations.set(word, [...(locations.get(word) || []), index + 1]);
  });
  const repeated = [...locations]
    .filter(([, positions]) => positions.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([word, positions]) => ({
      word,
      count: positions.length,
      positions,
      inPrompt: promptWords.has(word),
      examples: sentences
        .filter((sentence) => new RegExp(`\\b${word}\\b`, 'i').test(sentence))
        .slice(0, 4),
    }));
  const linking = Object.entries(LINKERS)
    .map(([category, phrases]) => {
      const matches = phrases.flatMap((phrase) => {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return [...source.matchAll(new RegExp(`\\b${escaped}\\b`, 'gi'))].map((match) => {
          const sentenceIndex = sentenceSpans.findIndex(
            (sentence) => match.index >= sentence.start && match.index < sentence.end
          );
          const sentence = sentenceSpans[sentenceIndex];
          const previous = sentenceSpans[sentenceIndex - 1];
          return {
            phrase,
            sentence: sentence?.text || '',
            previousSentence:
              previous && sentence && previous.paragraph === sentence.paragraph
                ? previous.text
                : '',
          };
        });
      });
      return {
        category,
        count: matches.length,
        phrases: [...new Set(matches.map(({ phrase }) => phrase))],
        matches,
      };
    })
    .filter((item) => item.count);
  const paragraphs = source
    .split(/\n\s*\n|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const paragraphOpenings = paragraphs.map((part) => {
    const firstSentence = part.split(/(?<=[.!?])\s+/)[0] || part;
    if (firstSentence.length <= 90) return firstSentence;
    return `${firstSentence.slice(0, 87).replace(/\s+\S*$/, '')}…`;
  });
  return {
    wordCount: words.length,
    repeated,
    linking,
    paragraphCount: paragraphs.length,
    paragraphOpenings,
  };
}

/** Correct known meaning/fit issues in legacy generated suggestions before display. */
export function clarifyVocabularySuggestion(enhancement) {
  const original = String(enhancement?.original || '');
  const alternatives = (Array.isArray(enhancement?.alternatives) ? enhancement.alternatives : [])
    .filter(Boolean)
    .slice(0, 2);
  const normalizedOriginal = original.toLowerCase().replace(/\s+/g, ' ').trim();

  if (
    normalizedOriginal === 'forced upward' &&
    alternatives.some((item) => /^is lifted over the mountain$/i.test(item.trim()))
  ) {
    return {
      original,
      alternatives: ['driven upwards'],
      context: 'The mountain still forces the air upward.',
    };
  }

  if (
    normalizedOriginal === 'little to no rainfall' &&
    alternatives.some((item) => /^minimal precipitation$/i.test(item.trim()))
  ) {
    return {
      original,
      alternatives: ['negligible rainfall'],
      context: 'Means almost no rain. Use only if the diagram agrees.',
    };
  }

  return { ...enhancement, original, alternatives };
}

export function sourceForFeedback(feedback, fallback = '') {
  return plainWritingText(feedback?.originalSource || fallback);
}
