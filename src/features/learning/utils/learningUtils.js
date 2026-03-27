import { differenceInDays, format } from 'date-fns';

export const inferModuleFromTitle = (title) => {
  const t = String(title || '').toLowerCase();
  return t.includes('reading')
    ? 'reading'
    : t.includes('writing')
      ? 'writing'
      : t.includes('listening')
        ? 'listening'
        : t.includes('speaking')
          ? 'speaking'
          : 'reading';
};

export const mistakeAdvice = (tag) => {
  const t = String(tag || '').toLowerCase();
  if (t.includes('keyword')) {
    return {
      title: 'Avoid keyword traps',
      tip: 'Underline keywords, then verify meaning matches the paraphrase in the passage/audio.',
      module: 'reading',
    };
  }
  if (t.includes('paraphrase')) {
    return {
      title: 'Paraphrase accuracy',
      tip: 'Before choosing an answer, restate it in your own words and match synonyms, not identical words.',
      module: 'reading',
    };
  }
  if (t.includes('time')) {
    return {
      title: 'Fix time pressure',
      tip: 'Use a hard checkpoint: Reading P1 17m, P2 20m, P3 23m. Skip + return.',
      module: 'reading',
    };
  }
  if (t.includes('grammar') || t.includes('article') || t.includes('tense')) {
    return {
      title: 'Grammar control',
      tip: 'Write 3 sentences using your error type, then rewrite them with correct forms.',
      module: 'writing',
    };
  }
  if (t.includes('coherence') || t.includes('cohesion') || t.includes('linking')) {
    return {
      title: 'Improve coherence',
      tip: 'Use 1 clear idea per paragraph: topic sentence → explanation → example → link back.',
      module: 'writing',
    };
  }
  if (t.includes('pronunciation') || t.includes('fluency') || t.includes('hesitation')) {
    return {
      title: 'Speaking fluency',
      tip: 'Record 60 seconds, then repeat with fewer pauses and stronger sentence stress.',
      module: 'speaking',
    };
  }
  return {
    title: 'Targeted improvement',
    tip: 'Repeat a short set and track the exact mistake so your next attempt is cleaner.',
    module: null,
  };
};

export const getDaysLeft = (testDate) => {
  if (!testDate) return null;
  const d = differenceInDays(new Date(testDate), new Date());
  return d >= 0 ? d : null;
};

export const formatTestDate = (testDate) => {
  if (!testDate) return null;
  try {
    return format(new Date(testDate), 'MMM d');
  } catch {
    return null;
  }
};
