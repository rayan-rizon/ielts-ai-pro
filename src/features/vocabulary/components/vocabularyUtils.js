const NOUN_PREFIXES = ['a ', 'an ', 'the '];
const ADJ_KEYWORDS = ['quality of', 'relating to', 'having'];

const POS_RULES = [
  { test: (def) => NOUN_PREFIXES.some((p) => def.startsWith(p)), pos: 'n.' },
  { test: (def) => ADJ_KEYWORDS.some((k) => def.includes(k)), pos: 'adj.' },
  { test: (def) => def.startsWith('to ') || def.includes('action of'), pos: 'v.' },
];

export const getPartOfSpeech = (item) => {
  const explicitPos = item?.pos || item?.part_of_speech;
  if (explicitPos) return explicitPos;

  const def = (item?.definition || '').toLowerCase();
  const matched = POS_RULES.find((rule) => rule.test(def));
  return matched ? matched.pos : 'word';
};

const MEMORY_LEVELS = [
  {
    minLevel: 4,
    label: 'Mastered',
    percent: 85,
    color: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    minLevel: 2,
    label: 'Learning',
    percent: 55,
    color: 'bg-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
];

const DEFAULT_MEMORY = {
  label: 'New',
  percent: 30,
  color: 'bg-indigo-500',
  badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
};

export const getMemoryStrength = (masteryLevel = 0) => {
  return MEMORY_LEVELS.find((m) => masteryLevel >= m.minLevel) || DEFAULT_MEMORY;
};

export const computeCounts = (words) => {
  let total = 0;
  let mastered = 0;
  let learning = 0;
  let newCount = 0;

  for (let i = 0; i < words.length; i++) {
    total++;
    const m = words[i]?.mastery_level || 0;
    if (m >= 4) {
      mastered++;
    } else if (m > 0) {
      learning++;
    } else {
      newCount++;
    }
  }

  return { total, mastered, learning, newCount };
};

export const matchesTabFilter = (masteryLevel, activeTab) => {
  if (activeTab === 'mastered') return masteryLevel >= 4;
  if (activeTab === 'learning') return masteryLevel > 0 && masteryLevel < 4;
  if (activeTab === 'new') return masteryLevel === 0;
  return true;
};

export const matchesCategory = (source, categoryFilter) => {
  if (categoryFilter === 'all') return true;
  return (source || 'Academic').toLowerCase() === categoryFilter.toLowerCase();
};

export const matchesPos = (item, posFilter) => {
  if (posFilter === 'all') return true;
  return getPartOfSpeech(item).toLowerCase() === posFilter.toLowerCase();
};

const SORT_COMPARATORS = {
  alphabetical: (a, b) => (a.word || '').localeCompare(b.word || ''),
  reverse: (a, b) => (b.word || '').localeCompare(a.word || ''),
  mastery: (a, b) => (b.mastery_level || 0) - (a.mastery_level || 0),
};

export const sortWordList = (list, sortOption) => {
  const comparator = SORT_COMPARATORS[sortOption];
  return comparator ? [...list].sort(comparator) : list;
};

export const isFilterActive = (categoryFilter, posFilter, sortOption, activeTab) => {
  return (
    categoryFilter !== 'all' ||
    posFilter !== 'all' ||
    sortOption !== 'recent' ||
    activeTab !== 'all'
  );
};
