import {
  BookOpen,
  Flag,
  Headphones,
  Mic2,
  PenLine,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import {
  aggregateReadiness,
  buildRoadmap,
  stableStringify,
  STUDY_DAYS,
  summarizeEvidence,
} from '../../../../../supabase/functions/_shared/learningPathV2';

export const MODULE_STYLE = {
  reading: {
    icon: BookOpen,
    label: 'Reading',
    color: 'text-emerald-700 dark:text-emerald-300',
    surface:
      'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    border: 'border-emerald-200/80 dark:border-emerald-500/30',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    badge: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
  writing: {
    icon: PenLine,
    label: 'Writing',
    color: 'text-rose-700 dark:text-rose-300',
    surface:
      'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    border: 'border-rose-200/80 dark:border-rose-500/30',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    badge: 'bg-rose-100/80 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    color: 'text-sky-700 dark:text-sky-300',
    surface:
      'bg-sky-50/90 text-sky-800 border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    border: 'border-sky-200/80 dark:border-sky-500/30',
    bar: 'bg-gradient-to-r from-sky-500 to-blue-500',
    badge: 'bg-sky-100/80 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  },
  speaking: {
    icon: Mic2,
    label: 'Speaking',
    color: 'text-amber-700 dark:text-amber-300',
    surface:
      'bg-amber-50/90 text-amber-800 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    border: 'border-amber-200/80 dark:border-amber-500/30',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    badge: 'bg-amber-100/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  },
  general: {
    icon: Sparkles,
    label: 'General',
    color: 'text-indigo-700 dark:text-indigo-300',
    surface:
      'bg-indigo-50/90 text-indigo-800 border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    border: 'border-indigo-200/80 dark:border-indigo-500/30',
    bar: 'bg-gradient-to-r from-indigo-600 to-violet-600',
    badge: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
  },
};

export const ROADMAP_PRESENTATION = [
  {
    key: 'foundation',
    name: 'Foundation & diagnosis',
    shortName: 'Build foundations',
    icon: Sprout,
    objective: 'Check your starting level and close essential knowledge gaps.',
    checkpoint: 'Two recent scored practices in every IELTS subject.',
    checkpointShort: '2 recent scores in every subject',
    surface: 'bg-[#fcf8ff]/80 border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-500/20',
    nodeStyle:
      'bg-purple-100/90 border-2 border-purple-300 text-purple-600 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300 shadow-[0_4px_14px_rgba(168,85,247,0.2)]',
    bar: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    phaseBadge: 'bg-purple-100/90 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    bullets: ['Understand test format', 'Build core vocabulary', 'Develop basic strategies'],
  },
  {
    key: 'repair',
    name: 'Targeted repair',
    shortName: 'Repair priority skills',
    icon: BookOpen,
    objective: 'Improve the skills that recent answers confirm need attention.',
    checkpoint: 'Focus skills reach 70%+ across 20 new answers.',
    checkpointShort: '70%+ across 20 new answers',
    surface: 'bg-[#f4f9ff]/80 border-blue-200/80 dark:bg-blue-950/20 dark:border-blue-500/20',
    nodeStyle:
      'bg-blue-100/90 border-2 border-blue-300 text-blue-600 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300 shadow-[0_4px_14px_rgba(59,130,246,0.2)]',
    bar: 'bg-gradient-to-r from-blue-600 to-cyan-500',
    phaseBadge: 'bg-blue-100/90 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    bullets: ['Improve accuracy', 'Expand ideas & examples', 'Practice under timed conditions'],
  },
  {
    key: 'integration',
    name: 'Timed integration',
    shortName: 'Practise under time',
    icon: TrendingUp,
    objective: 'Combine skills in timed sections and review errors.',
    checkpoint: 'Two timed modules completed within official time limits.',
    checkpointShort: '2 modules within official time limits',
    surface: 'bg-[#fffdf5]/80 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-500/20',
    nodeStyle:
      'bg-amber-100/90 border-2 border-amber-300 text-amber-600 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300 shadow-[0_4px_14px_rgba(245,158,11,0.2)]',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    phaseBadge: 'bg-amber-100/90 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    bullets: ['Advanced strategies', 'Strengthen weak areas', 'Increase speed & accuracy'],
  },
  {
    key: 'readiness',
    name: 'Mock & test readiness',
    shortName: 'Get exam ready',
    icon: Flag,
    objective: 'Use full mocks to confirm pacing and score stability.',
    checkpoint: 'A recent mock reaches your target in all four subjects.',
    checkpointShort: 'Recent mock scores at target in all subjects',
    surface: 'bg-[#fff5f7]/80 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-500/20',
    nodeStyle:
      'bg-rose-100/90 border-2 border-rose-300 text-rose-600 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300 shadow-[0_4px_14px_rgba(244,63,94,0.2)]',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    phaseBadge: 'bg-rose-100/90 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    bullets: ['Full-length simulations', 'Score consistency', 'Exam-day confidence'],
  },
];

export const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export const dateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatSkill = (code = '') =>
  code
    .split('_')
    .slice(1)
    .join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Core skill';

const titleCaseWords = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const matchOriginalTitlePattern = (originalTitle) => {
  const diagnosticMatch = originalTitle.match(
    /^(Reading|Writing|Listening|Speaking)(?:\s+Full)?\s+(?:Diagnostic|Level Check)$/i
  );
  if (diagnosticMatch) return `${titleCaseWords(diagnosticMatch[1])} level check`;

  const fullDiagnosticMatch = originalTitle.match(
    /^Full\s+(Reading|Writing|Listening|Speaking)\s+Diagnostic$/i
  );
  if (fullDiagnosticMatch) return `${titleCaseWords(fullDiagnosticMatch[1])} level check`;

  const timedSetMatch = originalTitle.match(
    /^(Reading|Writing|Listening|Speaking)\s+.+\s+Timed Set$/i
  );
  if (timedSetMatch) return `Timed ${timedSetMatch[1].toLowerCase()} practice`;

  const repairMatch = originalTitle.match(
    /^(Reading|Writing|Listening|Speaking)\s+(.+)\s+Repair$/i
  );
  if (repairMatch) {
    return `${titleCaseWords(repairMatch[1])}: ${repairMatch[2].toLowerCase()} practice`;
  }

  const reviewMatch = originalTitle.match(
    /^(Reading|Writing|Listening|Speaking)\s+(.+)\s+Review$/i
  );
  if (reviewMatch) return `${titleCaseWords(reviewMatch[2])} review`;

  return originalTitle;
};

const getModuleLabel = (moduleKey) => {
  const key = String(moduleKey || '').toLowerCase();
  return MODULE_STYLE[key]?.label || titleCaseWords(key) || 'IELTS';
};

const getSkillTitle = (skillCode) => {
  const raw = String(skillCode || '').replace(
    /^(reading|writing|listening|speaking|general)[_:\s-]*/i,
    ''
  );
  return titleCaseWords(raw);
};

const formatDrillTitle = (label, skill) => {
  const isCore = !skill || skill === 'Core Skill';
  return isCore ? `${label} skills practice` : `${label}: ${skill.toLowerCase()} practice`;
};

const formatReviewTitle = (label, skill) => {
  const isCore = !skill || skill === 'Core Skill';
  return isCore ? `${label} review` : `${skill} review`;
};

const ACTIVITY_TITLE_BUILDERS = {
  diagnostic: (label) => `${label} level check`,
  timed_assessment: (label) => `Timed ${label.toLowerCase()} practice`,
  targeted_drill: (label, skill) => formatDrillTitle(label, skill),
  spaced_review: (label, skill) => formatReviewTitle(label, skill),
  maintenance: (label) => `${label} skills practice`,
};

/**
 * Keeps persisted activity titles and routes untouched while presenting tasks
 * in plain language. This also makes older V1 activity names readable.
 */
export function getFriendlyTaskTitle(task = {}) {
  const label = getModuleLabel(task.module);
  const skill = getSkillTitle(task.skill_code);
  const type = String(task?.activity_type || '').toLowerCase();
  const builder = ACTIVITY_TITLE_BUILDERS[type];
  if (builder) return builder(label, skill);

  const rawTitle = task?.title || 'Study task';
  return matchOriginalTitlePattern(titleCaseWords(rawTitle));
}

export function formatMinutes(totalMinutes = 0) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes} min`;
}

export function getModuleStyle(module = 'general') {
  const normalizedModule = String(module).toLowerCase();
  return MODULE_STYLE[normalizedModule] || MODULE_STYLE.general;
}

export function getPrioritiesList(evidence) {
  if (!evidence) return [];
  const measured = (evidence.measured_priorities || []).map((item) => ({
    ...item,
    kind: 'Measured',
  }));
  const earlySignals = (evidence.early_signals || evidence.unmeasured_priorities || []).map(
    (item) => ({
      ...item,
      kind: 'Early signal',
    })
  );
  const reviews = (evidence.due_reviews || []).map((item) => ({
    ...item,
    kind: 'Review due',
  }));

  return [...measured, ...earlySignals, ...reviews].slice(0, 4);
}

export function getFriendlyPlanText(text = '') {
  if (!text) return '';

  return String(text)
    .replace(/\bdiagnostics?\b/gi, 'level check')
    .replace(/\bdiagnostic check\b/gi, 'level check')
    .replace(/\bdiagnostic test\b/gi, 'level check')
    .replace(/\b(reading|writing|listening|speaking) diagnostic\b/gi, '$1 level check')
    .replace(/\breadiness diagnostic\b/gi, 'score check')
    .replace(/\bproactive_rebalance\b/gi, 'Plan updated for your target date')
    .replace(/\brebalance\b/gi, 'Plan updated for target date')
    .replace(/\bgoal_change\b/gi, 'Updated for your new goals')
    .replace(/\btest_completed\b/gi, 'Updated from recent practice')
    .replace(/\bmanual_refresh\b/gi, 'Refreshed by request')
    .replace(/\bfirst_plan\b/gi, 'Initial plan created')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildDashboardDays(days = []) {
  return days.map((day) => {
    const rawDate = String(day.date || '').slice(0, 10);
    const dateObj = rawDate ? new Date(`${rawDate}T12:00:00`) : new Date();
    return {
      dateKey: rawDate,
      date: dateObj,
      capacity: Number(day.capacity || 0),
      tasks: day.tasks || [],
    };
  });
}

export function computeEvidence(path, skillMap = {}) {
  const savedEvidence = path?.evidence_summary;
  if (savedEvidence && typeof savedEvidence === 'object') {
    return {
      ...savedEvidence,
      measured_priorities: savedEvidence.measured_priorities || [],
      early_signals: savedEvidence.early_signals || savedEvidence.unmeasured_priorities || [],
      diagnostics: savedEvidence.diagnostics || [],
      due_reviews: savedEvidence.due_reviews || [],
      maintenance: savedEvidence.maintenance || [],
    };
  }

  const skills = Object.values(skillMap?.byModule || {})
    .flat()
    .map((skill) => ({
      ...skill,
      mastery_probability: skill?.mastery_probability ?? skill?.mastery,
      confidence_level: skill?.confidence_level ?? skill?.confidence,
    }));

  return summarizeEvidence(skills);
}

export function computeSevenDays(path, activityByKey = {}, availability = {}) {
  const schedule = path?.weekly_schedule || path?.schedule || path?.daily_schedule || {};
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    const scheduledDate = dateKey(date);
    const dayName = STUDY_DAYS[(date.getDay() + 6) % 7];
    const dayTasks = Array.isArray(schedule)
      ? schedule.filter((task) => task?.scheduled_date === scheduledDate)
      : schedule?.[dayName] || [];
    const tasks = dayTasks
      .filter(
        (task) =>
          !task?.scheduled_date || String(task.scheduled_date).slice(0, 10) === scheduledDate
      )
      .map((task) => {
        const activity = activityByKey?.[task.activity_key] || {};
        return {
          ...task,
          ...activity,
          activity_key: task.activity_key,
          scheduled_day: activity.scheduled_day || task.scheduled_day || dayName,
          scheduled_date: activity.scheduled_date || task.scheduled_date || scheduledDate,
          estimated_time:
            activity.estimated_minutes || task.estimated_time || task.estimated_minutes || 0,
          is_completed: Boolean(activity.is_completed),
        };
      })
      .sort((first, second) => Number(first.is_optional) - Number(second.is_optional));

    return {
      dateKey: scheduledDate,
      date,
      dayName,
      capacity: Number(availability?.days?.[dayName] || 0),
      tasks,
    };
  });
}

export function getDaySummaryMeta(day = {}, primaryTask = null) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const primary = primaryTask || tasks[0] || null;
  const plannedMinutes = tasks.reduce(
    (total, task) => total + Number(task?.estimated_time || task?.estimated_minutes || 0),
    0
  );
  const primaryMinutes = Number(primary?.estimated_time || primary?.estimated_minutes || 0);
  const totalMinutes = plannedMinutes || primaryMinutes;
  const capacity = Number(day.capacity || 0);

  if (!primary) {
    return {
      titleText: 'Rest day',
      durationText: capacity ? `${formatMinutes(capacity)} available` : 'Recovery time',
      overflow: false,
      additionalTasks: 0,
    };
  }

  return {
    titleText: getFriendlyTaskTitle(primary),
    durationText: `${formatMinutes(totalMinutes)} planned`,
    overflow: capacity > 0 && totalMinutes > capacity,
    additionalTasks: Math.max(0, tasks.length - 1),
  };
}

function isPhaseInProgress(index, actual, isLegacyPlan) {
  if (actual?.status === 'in_progress') return true;
  if (isLegacyPlan) return index === 0;
  return Boolean(actual?.current);
}

function isPhaseCondensed(index, actual, isLegacyPlan, firstIncludedIndex) {
  if (actual?.status === 'condensed') return true;
  return isLegacyPlan && index < firstIncludedIndex;
}

export function getPhaseStatus({
  index,
  actual,
  isLegacyPlan,
  firstIncludedIndex = 0,
  displayCurrentIndex = 0,
  dateState = null,
}) {
  if (dateState === 'completed') return 'Completed';
  if (dateState === 'current') return 'In Progress';
  if (dateState === 'upcoming') return 'Locked';
  if (isPhaseInProgress(index, actual, isLegacyPlan)) return 'In Progress';
  if (isPhaseCondensed(index, actual, isLegacyPlan, firstIncludedIndex)) return 'Condensed';
  if (index < displayCurrentIndex) return 'Completed';
  return 'Locked';
}

const parseRoadmapDate = (value) => {
  if (!value) return null;
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBeforeToday = (date, today) => Boolean(date && date < today);
const isAfterToday = (date, today) => Boolean(date && date > today);

export function getPhaseDateState(actual = {}, referenceDate = new Date()) {
  const start = parseRoadmapDate(actual.start_date);
  const end = parseRoadmapDate(actual.end_date);
  const hasDates = Boolean(start || end);
  if (!hasDates) return null;

  const today = new Date(referenceDate);
  today.setHours(12, 0, 0, 0);

  if (isBeforeToday(end, today)) return 'completed';
  if (isAfterToday(start, today)) return 'upcoming';
  return 'current';
}

export function findRoadmapIndices(roadmapItems, referenceDate = new Date()) {
  const actualByKey = new Map(
    roadmapItems
      .filter((phase) => ROADMAP_PRESENTATION.some((item) => item.key === phase.key))
      .map((phase) => [phase.key, phase])
  );

  const actualIndexes = ROADMAP_PRESENTATION.map((item, index) =>
    actualByKey.has(item.key) ? index : null
  ).filter((index) => index !== null);

  const firstIncludedIndex = actualIndexes.length ? Math.min(...actualIndexes) : 0;
  const datedCurrentIndex = ROADMAP_PRESENTATION.findIndex(
    (item) => getPhaseDateState(actualByKey.get(item.key), referenceDate) === 'current'
  );
  const savedCurrentIndex = ROADMAP_PRESENTATION.findIndex(
    (item) => actualByKey.get(item.key)?.current
  );
  const currentIndex = datedCurrentIndex >= 0 ? datedCurrentIndex : savedCurrentIndex;
  const displayCurrentIndex = currentIndex >= 0 ? currentIndex : firstIncludedIndex;

  return { actualByKey, firstIncludedIndex, displayCurrentIndex };
}

export function computePhases(roadmap, isLegacyPlan, referenceDate = new Date()) {
  const roadmapItems = Array.isArray(roadmap) ? roadmap : [];
  const { actualByKey, firstIncludedIndex, displayCurrentIndex } = findRoadmapIndices(
    roadmapItems,
    referenceDate
  );

  return ROADMAP_PRESENTATION.map((presentation, index) => {
    const actual = actualByKey.get(presentation.key);
    const dateState = isLegacyPlan ? null : getPhaseDateState(actual, referenceDate);
    const status = getPhaseStatus({
      index,
      actual,
      isLegacyPlan,
      firstIncludedIndex,
      displayCurrentIndex,
      dateState,
    });

    return { ...presentation, ...actual, status };
  });
}

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const hasEnoughModuleEvidence = (item) =>
  Boolean(item?.sufficient ?? Number(item?.sample_count || 0) >= 2);

const formatRoadmapDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const formatRoadmapRange = (phase) => {
  const start = formatRoadmapDate(phase?.start_date);
  const end = formatRoadmapDate(phase?.end_date);
  if (!start && !end) return null;
  return start === end || !end ? start : `${start} – ${end}`;
};

const PHASE_TASK_MATCHERS = {
  foundation: (type, title) => type === 'diagnostic' || title.includes('diagnostic'),
  repair: (type) => ['targeted_drill', 'spaced_review'].includes(type),
  integration: (type, title) => type === 'timed_assessment' || title.includes('timed'),
  readiness: (type, title) => type === 'mock' || title.includes('mock'),
};

const taskMatchesPhase = (task, phaseKey) => {
  const type = String(task?.activity_type || '').toLowerCase();
  const title = String(task?.title || '').toLowerCase();
  const matcher = PHASE_TASK_MATCHERS[phaseKey] || PHASE_TASK_MATCHERS.readiness;
  return matcher(type, title);
};

function findDiagnosticTask(tasks, nextModule) {
  if (!nextModule) return null;
  const target = String(nextModule).toLowerCase();
  return (
    tasks.find((task) => {
      const mod = String(task.module || '').toLowerCase();
      const type = String(task.activity_type || '').toLowerCase();
      const title = String(task.title || '').toLowerCase();
      return mod === target || type === 'diagnostic' || title.includes(target);
    }) || null
  );
}

function buildFoundationPhase(readiness, tasks = []) {
  const modules = Object.values(readiness?.modules || {});
  const sufficientCount = modules.filter(hasEnoughModuleEvidence).length;
  const missing = readiness?.missing_diagnostics || [];
  const actionTask = findDiagnosticTask(tasks, missing[0]);
  const missingText = missing.map((mod) => MODULE_STYLE[mod]?.label || mod).join(', ');

  return {
    progressPercent: clampPercent((sufficientCount / 4) * 100),
    progressLabel: `${sufficientCount} of 4 subjects checked`,
    actionTask,
    checklist: [
      { label: 'Starting scores ready in at least 3 subjects', done: sufficientCount >= 3 },
      {
        label: missing.length
          ? `Starting score still needed: ${missingText}`
          : 'Starting scores ready in all 4 subjects',
        done: sufficientCount === 4,
      },
      { label: 'Only recent scored practice is used', done: true },
    ],
  };
}

function calculateRepairProgress(priorities) {
  if (!priorities.length) return 0;
  const sum = priorities.reduce((total, item) => {
    const masteryProgress = Number(item.mastery || 0) / 0.7;
    const observationProgress = Number(item.observations || 0) / 20;
    return total + Math.min(masteryProgress, observationProgress, 1);
  }, 0);
  return sum / priorities.length;
}

const isSkillTargeted = (item) =>
  Number(item?.mastery || 0) >= 0.7 && Number(item?.observations || 0) >= 20;

const areAllPrioritiesTargeted = (priorities) =>
  Boolean(priorities.length > 0 && priorities.every(isSkillTargeted));

const getFocusSkillsLabel = (count) => {
  if (!count) return 'Waiting for confirmed focus skills';
  const unit = count === 1 ? 'skill' : 'skills';
  return `${count} confirmed focus ${unit}`;
};

const getFocusChecklistLabel = (priorityNames) =>
  priorityNames.length
    ? `Focus skills confirmed: ${priorityNames.join(' and ')}`
    : 'Confirm focus skills with a level check';

const getReviewsChecklistLabel = (reviewsDue) =>
  reviewsDue
    ? `${reviewsDue} scheduled ${reviewsDue === 1 ? 'review' : 'reviews'} still due`
    : 'All scheduled reviews completed';

function buildRepairPhase(evidence = {}) {
  const priorities = evidence.measured_priorities || [];
  const averageProgress = calculateRepairProgress(priorities);
  const priorityNames = priorities.slice(0, 2).map((item) => formatSkill(item.skill_code));
  const reviewsDue = Number(evidence.due_reviews?.length || 0);

  return {
    progressPercent: clampPercent(averageProgress * 100),
    progressLabel: getFocusSkillsLabel(priorities.length),
    checklist: [
      {
        label: getFocusChecklistLabel(priorityNames),
        done: priorities.length > 0,
      },
      {
        label: getReviewsChecklistLabel(reviewsDue),
        done: reviewsDue === 0,
      },
      {
        label: 'Focus skills reach 70% across 20 answers',
        done: areAllPrioritiesTargeted(priorities),
      },
    ],
  };
}

function buildIntegrationPhase(tasks) {
  const timedTasks = tasks.filter((task) => taskMatchesPhase(task, 'integration'));
  const completed = timedTasks.filter((task) => task.is_completed).length;
  return {
    progressPercent: clampPercent((completed / Math.max(2, timedTasks.length || 2)) * 100),
    progressLabel: timedTasks.length
      ? `${completed} of ${timedTasks.length} timed tasks done this week`
      : 'Timed work follows diagnostics',
    checklist: [
      {
        label: timedTasks.length
          ? 'Timed practice is scheduled this week'
          : 'Schedule your first timed practice',
        done: timedTasks.length > 0,
      },
      { label: 'Complete the first timed practice', done: completed >= 1 },
      { label: 'Complete two timed practices', done: completed >= 2 },
    ],
  };
}

const getMockChecklistLabel = (hasMock) =>
  hasMock ? 'Full mock added to your plan' : 'Schedule a full mock';

const getScoreTargetChecklistLabel = (completedMocks, targetScore) =>
  completedMocks
    ? `Recent subject scores reach Band ${targetScore.toFixed(1)}`
    : 'Complete one full mock';

function buildReadinessPhase(readiness = {}, targetBand = 7, tasks = []) {
  const moduleItems = Object.values(readiness.modules || {});
  const measured = moduleItems.filter(hasEnoughModuleEvidence);
  const targetScore = Number(targetBand || 7);
  const atTarget = measured.filter((item) => Number(item?.median || 0) >= targetScore);
  const hasOverallRange = Boolean(readiness.overall?.available && readiness.overall?.range);
  const mockTasks = tasks.filter((task) => taskMatchesPhase(task, 'readiness'));
  const completedMocks = mockTasks.filter((task) => task.is_completed).length;

  const count = hasOverallRange ? atTarget.length : measured.length;
  const labelText = hasOverallRange
    ? `${atTarget.length} of 4 recent subject scores at target`
    : `${measured.length} of 4 subjects ready for comparison`;

  return {
    progressPercent: clampPercent((count / 4) * 100),
    progressLabel: labelText,
    checklist: [
      { label: 'Recent scores ready in all 4 subjects', done: measured.length === 4 },
      { label: getMockChecklistLabel(mockTasks.length > 0), done: mockTasks.length > 0 },
      {
        label: getScoreTargetChecklistLabel(completedMocks, targetScore),
        done: completedMocks > 0,
      },
    ],
  };
}

const PHASE_BUILDERS = {
  foundation: ({ readiness, tasks }) => buildFoundationPhase(readiness, tasks),
  repair: ({ evidence }) => buildRepairPhase(evidence),
  integration: ({ tasks }) => buildIntegrationPhase(tasks),
  readiness: ({ readiness, targetBand, tasks }) =>
    buildReadinessPhase(readiness, targetBand, tasks),
};

export function buildRoadmapData({
  rawRoadmap = [],
  readiness,
  evidence,
  days = [],
  targetBand = 7,
}) {
  const tasks = days.flatMap((day) => day.tasks || []);
  const context = { readiness, evidence, tasks, targetBand };

  return ROADMAP_PRESENTATION.map((presentation) => {
    const rawPhase = rawRoadmap.find((phase) => phase.key === presentation.key) || {};
    const builder = PHASE_BUILDERS[presentation.key];
    const derived = builder ? builder(context) : {};

    return {
      key: presentation.key,
      shortName: presentation.shortName,
      dateRange: formatRoadmapRange(rawPhase),
      progressPercent: derived.progressPercent || 0,
      progressLabel: derived.progressLabel || '',
      actionTask: derived.actionTask || null,
      checklist: derived.checklist || [],
    };
  });
}

export function buildRoadmapViewModel({
  roadmap = [],
  isLegacyPlan = false,
  readiness,
  evidence,
  days = [],
  targetBand = 7,
  referenceDate = new Date(),
}) {
  const computed = computePhases(roadmap, isLegacyPlan, referenceDate);
  const derived = buildRoadmapData({
    rawRoadmap: roadmap,
    readiness,
    evidence,
    days,
    targetBand,
  });

  return computed.map((phase) => {
    const data = derived.find((d) => d.key === phase.key) || {};
    return { ...phase, ...data };
  });
}

export function getSnapshotReadiness(rawReadiness, sessions) {
  if (rawReadiness && typeof rawReadiness === 'object') {
    return rawReadiness;
  }
  return aggregateReadiness(sessions || []);
}

export function getSnapshotRoadmap(rawRoadmap, userTestDate) {
  if (Array.isArray(rawRoadmap) && rawRoadmap.length > 0) {
    return rawRoadmap;
  }
  return buildRoadmap(userTestDate);
}

export function getTargetBandValue(snapshotValue, userValue) {
  return Number(snapshotValue || userValue || 7);
}

export function getExamDateValue(snapshotValue, userValue) {
  return snapshotValue || userValue || null;
}

export function getExamDaysLeft(examDate) {
  if (!examDate) return null;

  const targetDate = new Date(`${String(examDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(targetDate.getTime())) return null;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isExamDatePassed(examDate) {
  if (!examDate) return false;
  return new Date(examDate).getTime() < Date.now();
}

export function computeDashboardSnapshot(path, user = {}, stats = {}) {
  const goal = path?.goal_snapshot;
  const readiness = getSnapshotReadiness(path?.readiness, stats.sessions);
  const roadmap = getSnapshotRoadmap(path?.roadmap, user.test_date);
  const targetBand = getTargetBandValue(goal?.target_band, user.target_band_score);
  const examDate = getExamDateValue(goal?.test_date, user.test_date);
  const daysLeft = getExamDaysLeft(examDate);
  const examDatePassed = isExamDatePassed(examDate);

  return { readiness, roadmap, targetBand, examDate, daysLeft, examDatePassed };
}

const normalizeGoalDate = (value) => (value ? String(value).slice(0, 10) : '');

const hasGoalChanged = (goal = {}, user = {}, currentAvailability = {}) => {
  const targetChanged = Number(goal.target_band || 0) !== Number(user.target_band_score || 0);
  const dateChanged = normalizeGoalDate(goal.test_date) !== normalizeGoalDate(user.test_date);
  const availabilityChanged =
    stableStringify(goal.study_availability || {}) !== stableStringify(currentAvailability);
  return targetChanged || dateChanged || availabilityChanged;
};

const isValidSessionScore = (session) => {
  if (!session || session.is_completed === false) return false;
  return session.score !== null && session.score !== undefined;
};

const getSessionCompletionTimestamp = (session) => {
  const rawDate = session?.completed_at || session?.updated_at || session?.created_at || '';
  return Date.parse(rawDate);
};

const isSessionCompletedAfter = (session, generatedAt) => {
  if (!isValidSessionScore(session)) return false;
  const completedAt = getSessionCompletionTimestamp(session);
  return Number.isFinite(completedAt) && completedAt > generatedAt;
};

const hasNewCompletedTest = (sessions, generatedAt) => {
  if (!Number.isFinite(generatedAt)) return false;
  return (sessions || []).some((session) => isSessionCompletedAfter(session, generatedAt));
};

const isCurrentPlan = (path) => Boolean(path && path.version === 2 && path.input_fingerprint);

/**
 * Returns the meaningful event that justifies rebuilding the current plan.
 * A null result lets the UI stop before calling the Edge Function or AI provider.
 */
export function getPlanRefreshTrigger({ path, user, sessions, currentAvailability }) {
  if (!isCurrentPlan(path)) return 'first_plan';

  const goal = path.goal_snapshot || {};
  if (hasGoalChanged(goal, user, currentAvailability)) return 'goal_changed';

  const generatedAt = Date.parse(path.generated_at || '');
  if (hasNewCompletedTest(sessions, generatedAt)) return 'test_completed';

  return null;
}
