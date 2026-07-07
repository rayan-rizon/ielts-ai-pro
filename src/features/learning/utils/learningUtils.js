import { differenceInDays, format } from 'date-fns';
import { createPageUrl } from '@/utils';

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

export const formatTaskTitle = (title) => {
  const raw = String(title || '').trim();
  if (!raw) return '';
  return raw
    .replace(/\bdrills\b/gi, 'practice sets')
    .replace(/\bdrill\b/gi, 'practice')
    .replace(/\s+/g, ' ')
    .trim();
};

const MISTAKE_ADVICE_RULES = [
  {
    keywords: ['keyword'],
    title: 'Avoid keyword traps',
    tip: 'Underline keywords, then verify meaning matches the paraphrase in the passage/audio.',
    module: 'reading',
  },
  {
    keywords: ['paraphrase'],
    title: 'Paraphrase accuracy',
    tip: 'Before choosing an answer, restate it in your own words and match synonyms, not identical words.',
    module: 'reading',
  },
  {
    keywords: ['time'],
    title: 'Fix time pressure',
    tip: 'Use a hard checkpoint: Reading P1 17m, P2 20m, P3 23m. Skip + return.',
    module: 'reading',
  },
  {
    keywords: ['grammar', 'article', 'tense'],
    title: 'Grammar control',
    tip: 'Write 3 sentences using your error type, then rewrite them with correct forms.',
    module: 'writing',
  },
  {
    keywords: ['coherence', 'cohesion', 'linking'],
    title: 'Improve coherence',
    tip: 'Use 1 clear idea per paragraph: topic sentence → explanation → example → link back.',
    module: 'writing',
  },
  {
    keywords: ['pronunciation', 'fluency', 'hesitation'],
    title: 'Speaking fluency',
    tip: 'Record 60 seconds, then repeat with fewer pauses and stronger sentence stress.',
    module: 'speaking',
  },
];

export const mistakeAdvice = (tag) => {
  const t = String(tag || '').toLowerCase();
  for (const rule of MISTAKE_ADVICE_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) {
      return { title: rule.title, tip: rule.tip, module: rule.module };
    }
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

export function humanizeLabel(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toTaskObject(task) {
  if (typeof task === 'string') {
    return {
      title: task,
      module: inferModuleFromTitle(task),
      estimated_time: 30,
    };
  }
  return task || { title: 'Focused practice', module: 'general', estimated_time: 25 };
}

export function formatModuleName(module) {
  const value = String(module || 'general');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getModuleRoute(module) {
  const value = String(module || '').toLowerCase();
  if (!value || value === 'general') return null;
  return createPageUrl(formatModuleName(value));
}

function getModuleBand(module, stats, targetBand) {
  const current = stats.moduleAverages?.[module] || 0;
  if (current <= 0) return null;
  const gap = targetBand ? Math.max(0, targetBand - current) : 0;
  const trend = stats.moduleTrends?.[module] || 'stable';
  return { module, current, gap, trend };
}

export function calculateBandGaps(stats, targetBand) {
  const missingModules = [];
  const items = [];

  if (stats?.moduleAverages) {
    const modules = ['reading', 'listening', 'writing', 'speaking'];
    modules.forEach((module) => {
      const item = getModuleBand(module, stats, targetBand);
      if (item) {
        items.push(item);
      } else {
        missingModules.push(module);
      }
    });
  } else {
    return {
      hasAny: false,
      items: [],
      levers: [],
      missingModules: ['reading', 'listening', 'writing', 'speaking'],
    };
  }

  const hasAny = items.length > 0;
  items.sort((a, b) => b.gap - a.gap || a.current - b.current);
  const levers = items.filter((i) => i.gap > 0).slice(0, 2);

  return { hasAny, items, levers, missingModules };
}

function processCriterionScore(criterion, score, type, tagCounts) {
  const numScore = Number(score) || 0;
  if (numScore <= 0 || numScore >= 6.0) return;
  const key = humanizeLabel(criterion);
  if (!tagCounts[key]) {
    tagCounts[key] = { tag: key, count: 0, module: type };
  }
  tagCounts[key].count += Math.ceil((6.0 - numScore) * 2);
}

function countCriteriaScores(session, tagCounts) {
  const criteriaScores = session?.content_data?.criteriaScores;
  if (!criteriaScores) return;
  const type = session.test_type;
  if (type !== 'writing' && type !== 'speaking') return;

  Object.entries(criteriaScores).forEach(([criterion, score]) => {
    processCriterionScore(criterion, score, type, tagCounts);
  });
}

function getTroubleTypes(data) {
  const troubleTypes = data?.errorPatterns?.troubleTypes;
  if (troubleTypes && troubleTypes.length > 0) return troubleTypes;
  return null;
}

function getLegacyTags(data) {
  const legacyTags = data?.errorTags || data?.error_tags;
  return Array.isArray(legacyTags) ? legacyTags : [];
}

function getSessionErrorTags(session) {
  const data = session?.content_data;
  if (!data) return [];
  const troubleTypes = getTroubleTypes(data);
  if (troubleTypes) return troubleTypes;
  return getLegacyTags(data);
}

function processErrorTag(tag, type, tagCounts) {
  const key = humanizeLabel(tag);
  if (!key) return;
  if (!tagCounts[key]) {
    tagCounts[key] = { tag: key, count: 0, module: type };
  }
  tagCounts[key].count += 1;
}

function countErrorTags(session, tagCounts) {
  const errorTags = getSessionErrorTags(session);
  const type = session.test_type;

  errorTags.forEach((tag) => {
    processErrorTag(tag, type, tagCounts);
  });
}

function parseStatData(stat) {
  const total = Number(stat?.total) || 0;
  const correct = Number(stat?.correct) || 0;
  const accuracy = total > 0 ? correct / total : 0;
  return { total, accuracy };
}

function processTypeStat(typeKey, stat, type, tagCounts) {
  const { total, accuracy } = parseStatData(stat);
  if (total < 2 || accuracy >= 0.5) return;

  const key = humanizeLabel(typeKey);
  if (!key) return;

  if (!tagCounts[key]) {
    tagCounts[key] = { tag: key, count: 0, module: type };
  }
  tagCounts[key].count += Math.ceil(total * (1 - accuracy));
}

function countTypeStats(session, tagCounts) {
  const typeStats = session?.content_data?.typeStats;
  if (!typeStats) return;
  const type = session.test_type;

  Object.entries(typeStats).forEach(([typeKey, stat]) => {
    processTypeStat(typeKey, stat, type, tagCounts);
  });
}

export function buildMistakePatterns(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  const tagCounts = {};

  sessions.forEach((s) => {
    countCriteriaScores(s, tagCounts);
    countErrorTags(s, tagCounts);
    countTypeStats(s, tagCounts);
  });

  return Object.values(tagCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
