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
    bar: 'bg-linear-to-r/srgb from-emerald-500 to-teal-400',
    badge: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
  writing: {
    icon: PenLine,
    label: 'Writing',
    color: 'text-rose-700 dark:text-rose-300',
    surface:
      'bg-rose-50/90 text-rose-700 border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    border: 'border-rose-200/80 dark:border-rose-500/30',
    bar: 'bg-linear-to-r/srgb from-rose-500 to-pink-500',
    badge: 'bg-rose-100/80 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    color: 'text-sky-700 dark:text-sky-300',
    surface:
      'bg-sky-50/90 text-sky-800 border-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    border: 'border-sky-200/80 dark:border-sky-500/30',
    bar: 'bg-linear-to-r/srgb from-sky-500 to-blue-500',
    badge: 'bg-sky-100/80 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  },
  speaking: {
    icon: Mic2,
    label: 'Speaking',
    color: 'text-amber-700 dark:text-amber-300',
    surface:
      'bg-amber-50/90 text-amber-800 border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    border: 'border-amber-200/80 dark:border-amber-500/30',
    bar: 'bg-linear-to-r/srgb from-amber-500 to-orange-500',
    badge: 'bg-amber-100/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  },
  grammar: {
    icon: PenLine,
    label: 'Grammar',
    color: 'text-violet-700 dark:text-violet-300',
    surface:
      'bg-violet-50/90 text-violet-800 border-violet-200/80 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    border: 'border-violet-200/80 dark:border-violet-500/30',
    bar: 'bg-linear-to-r/srgb from-violet-600 to-purple-500',
    badge: 'bg-violet-100/80 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  },
  vocabulary: {
    icon: Sprout,
    label: 'Vocabulary',
    color: 'text-teal-700 dark:text-teal-300',
    surface:
      'bg-teal-50/90 text-teal-800 border-teal-200/80 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
    border: 'border-teal-200/80 dark:border-teal-500/30',
    bar: 'bg-linear-to-r/srgb from-teal-600 to-emerald-500',
    badge: 'bg-teal-100/80 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
  },
  general: {
    icon: Sparkles,
    label: 'General',
    color: 'text-indigo-700 dark:text-indigo-300',
    surface:
      'bg-indigo-50/90 text-indigo-800 border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    border: 'border-indigo-200/80 dark:border-indigo-500/30',
    bar: 'bg-linear-to-r/srgb from-indigo-600 to-violet-600',
    badge: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
  },
};

export const ROADMAP_PRESENTATION = [
  {
    key: 'foundation',
    name: 'Starting point',
    shortName: 'Build foundations',
    icon: Sprout,
    objective: 'Establish trustworthy starting scores and close essential knowledge gaps.',
    checkpoint: 'Starting scores established in at least three subjects using recent practice.',
    checkpointShort: '2 recent scores in every subject',
    surface:
      'bg-[linear-gradient(160deg,#ffffff_35%,#faf8ff_100%)] border-purple-200/50 shadow-[0_4px_20px_-10px_rgba(168,85,247,0.08)] dark:bg-none dark:bg-purple-950/15 dark:border-purple-500/20',
    nodeStyle:
      'bg-purple-50/90 border border-purple-200/80 text-purple-600 dark:bg-purple-950/80 dark:border-purple-800/80 dark:text-purple-300 shadow-2xs',
    bar: 'bg-purple-600',
    phaseBadge:
      'bg-[#f0f2fe] text-[#505bdd] border border-[#dce0fa] dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    bullets: ['Understand test format', 'Build core vocabulary', 'Develop basic strategies'],
  },
  {
    key: 'repair',
    name: 'Targeted repair',
    shortName: 'Repair priority skills',
    icon: BookOpen,
    objective: 'Improve the skills that recent answers confirm need attention.',
    checkpoint: 'Focus skills reach 75%+ across 20 new answers.',
    checkpointShort: '75%+ across 20 new answers',
    surface:
      'bg-[linear-gradient(160deg,#ffffff_35%,#f5f8ff_100%)] border-indigo-200/60 shadow-[0_4px_20px_-10px_rgba(79,70,229,0.08)] dark:bg-none dark:bg-indigo-950/15 dark:border-indigo-500/20',
    nodeStyle:
      'bg-blue-50/90 border border-blue-200/80 text-blue-600 dark:bg-blue-950/80 dark:border-blue-800/80 dark:text-blue-300 shadow-2xs',
    bar: 'bg-[#505bdd]',
    phaseBadge:
      'bg-[#f0f2fe] text-[#505bdd] border border-[#dce0fa] dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
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
    surface:
      'bg-[linear-gradient(160deg,#ffffff_35%,#fffdf5_100%)] border-amber-200/50 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.08)] dark:bg-none dark:bg-amber-950/15 dark:border-amber-500/20',
    nodeStyle:
      'bg-amber-50/90 border border-amber-200/80 text-amber-600 dark:bg-amber-950/80 dark:border-amber-800/80 dark:text-amber-300 shadow-2xs',
    bar: 'bg-amber-500',
    phaseBadge:
      'bg-[#f0f2fe] text-[#505bdd] border border-[#dce0fa] dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    bullets: ['Higher-level strategies', 'Strengthen weak areas', 'Increase speed & accuracy'],
  },
  {
    key: 'readiness',
    name: 'Mock & test readiness',
    shortName: 'Get exam ready',
    icon: Flag,
    objective: 'Use verified Exam Mode attempts to confirm pacing and score stability.',
    checkpoint: 'A recent Exam Mode score reaches your target in all four subjects.',
    checkpointShort: 'Exam Mode scores at target in all subjects',
    surface:
      'bg-[linear-gradient(160deg,#ffffff_35%,#fff5f7_100%)] border-rose-200/50 shadow-[0_4px_20px_-10px_rgba(244,63,94,0.08)] dark:bg-none dark:bg-rose-950/15 dark:border-rose-500/20',
    nodeStyle:
      'bg-rose-50/90 border border-rose-200/80 text-rose-600 dark:bg-rose-950/80 dark:border-rose-800/80 dark:text-rose-300 shadow-2xs',
    bar: 'bg-rose-500',
    phaseBadge:
      'bg-[#f0f2fe] text-[#505bdd] border border-[#dce0fa] dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    bullets: ['Full-length simulations', 'Score consistency', 'Exam-day confidence'],
  },
];

export const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/**
 * @param {Date | string | number} [value]
 * @returns {string}
 */
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

/** Maps a module to one of the shared IconChip/Pill tones (primitives.jsx). */
const MODULE_TONE = {
  reading: 'emerald',
  writing: 'rose',
  listening: 'sky',
  speaking: 'amber',
  grammar: 'accent',
  vocabulary: 'emerald',
  general: 'accent',
};

export function getModuleTone(module = 'general') {
  return MODULE_TONE[String(module).toLowerCase()] || 'accent';
}

export function getPrioritiesList(evidence) {
  if (!evidence) return [];
  const measured = (evidence.measured_priorities || []).map((item) => ({
    ...item,
    kind: 'Confirmed focus',
  }));
  const earlySignals = (evidence.early_signals || evidence.unmeasured_priorities || []).map(
    (item) => ({
      ...item,
      kind: 'Needs more results',
    })
  );
  const reviews = (evidence.due_reviews || []).map((item) => ({
    ...item,
    kind: 'Review due',
  }));

  return [...measured, ...earlySignals, ...reviews].slice(0, 4);
}

export function rankBestNextTask(days = [], context = {}) {
  const rankingContext = buildTaskRankingContext(context);
  const ranked = days
    .flatMap((day, dayIndex) =>
      (day.tasks || []).map((task, taskIndex) => ({ ...task, day, dayIndex, taskIndex }))
    )
    .filter((task) => !task.is_completed)
    .map((task) => ({ task, score: scoreNextTask(task, rankingContext) }))
    .sort(compareRankedTasks);
  return ranked[0]?.task ?? null;
}

function buildTaskRankingContext(context) {
  const evidence = context.evidence || {};
  return {
    targetBand: Number(context.targetBand || 0),
    daysLeft: Number(context.daysLeft),
    readiness: context.readiness?.modules || context.readiness || {},
    confirmed: buildConfirmedPrioritySet(evidence.measured_priorities),
    due: buildDueReviewSet(evidence.due_reviews),
    nowKey: new Date().toISOString().slice(0, 10),
  };
}

const normalizeEvidenceKey = (value) => String(value || '').toLowerCase();

const buildConfirmedPrioritySet = (priorities = []) =>
  new Set(
    priorities.flatMap((item) => [
      normalizeEvidenceKey(item.module),
      normalizeEvidenceKey(item.skill_code),
    ])
  );

const buildDueReviewSet = (reviews = []) =>
  new Set(reviews.map((item) => normalizeEvidenceKey(item.skill_code)));

const priorityScore = (priority) => (priority === 'high' ? 50 : priority === 'medium' ? 25 : 5);

const aiRankScore = (rank) => {
  const value = Number(rank);
  return Number.isFinite(value) ? Math.max(0, 45 - value * 3) : 0;
};

const targetGapScore = (task, context) => {
  const module = String(task.module || '').toLowerCase();
  const moduleReadiness = context.readiness?.[module] || {};
  const moduleBand = Number(moduleReadiness.latest ?? moduleReadiness.band);
  if (context.targetBand <= 0 || !Number.isFinite(moduleBand)) return 0;
  return Math.max(0, context.targetBand - moduleBand) * 10;
};

function scoreNextTask(task, context) {
  const module = String(task.module || '').toLowerCase();
  const skills = (task.skill_targets || []).map((skill) => String(skill).toLowerCase());
  const estimated = Number(task.estimated_time || task.estimated_minutes || 30);
  const capacity = Number(task.day?.capacity || 0);
  return (
    aiRankScore(task.ai_rank) +
    priorityScore(task.priority) +
    targetGapScore(task, context) +
    evidencePriorityScore(module, skills, context) +
    schedulePriorityScore(task, estimated, capacity, context)
  );
}

const evidencePriorityScore = (module, skills, context) => {
  const dueScore = skills.some((skill) => context.due.has(skill)) ? 35 : 0;
  const confirmed =
    context.confirmed.has(module) || skills.some((skill) => context.confirmed.has(skill));
  return dueScore + (confirmed ? 20 : 0);
};

const schedulePriorityScore = (task, estimated, capacity, context) => {
  const overdue = Boolean(task.scheduled_date && task.scheduled_date < context.nowKey);
  const fitsCapacity = capacity > 0 && estimated <= capacity;
  const nearDeadline = Number.isFinite(context.daysLeft) && context.daysLeft <= 30;
  const examTask = /timed|mock|exam/i.test(task.activity_type || task.title);
  return (overdue ? 30 : 0) + (fitsCapacity ? 10 : 0) + (nearDeadline && examTask ? 15 : 0);
};

const compareRankedTasks = (left, right) =>
  right.score - left.score ||
  String(left.task.scheduled_date || '').localeCompare(String(right.task.scheduled_date || '')) ||
  String(left.task.activity_key || '').localeCompare(String(right.task.activity_key || ''));

/**
 * What "do this next" means when the seven-day schedule has nothing left to
 * offer — every task finished, or a plan that has not been generated yet.
 *
 * The hero used to render an empty tile here: a headline, one line of copy, a
 * disabled button, and two hundred pixels of nothing. But "no scheduled task"
 * is never the same as "nothing worth doing": a learner in that state always
 * has a missing starting score, a weak measured skill, or a timed attempt they
 * have not sat yet. This returns that work as a real, startable task so the
 * primary call to action on the page is never dead.
 *
 * Returned tasks are synthetic — they carry no `activity_key` and are never
 * persisted or ticked off. They only route the learner to the right practice.
 *
 * @param {{
 *   readiness?: { missing_diagnostics?: string[]; modules?: Record<string, unknown> };
 *   evidence?: { measured_priorities?: Array<{ skill_code?: string; module?: string; mastery?: number; observations?: number }> };
 *   targetBand?: number;
 * }} [options]
 */
export function buildFallbackTask({ readiness, evidence, targetBand = 7 } = {}) {
  return (
    buildMissingScoreTask(readiness) ||
    buildFocusSkillTask(evidence) ||
    buildTimedAttemptTask(readiness) ||
    buildExamModeTask(readiness, targetBand) ||
    null
  );
}

const synthesizeTask = ({ module, activityType, mode, minutes, reason, criterion, skill }) => ({
  module,
  activity_type: activityType,
  title: `${MODULE_STYLE[module]?.label || 'IELTS'} ${activityType}`,
  estimated_time: minutes,
  priority: 'high',
  is_synthetic: true,
  skill_targets: skill ? [skill] : [],
  routing: { route: module, mode },
  requested_mode: mode,
  reason,
  success_criterion: criterion,
});

const buildMissingScoreTask = (readiness) => {
  const module = (readiness?.missing_diagnostics || [])[0];
  if (!module) return null;
  return synthesizeTask({
    module,
    activityType: 'diagnostic',
    mode: 'diagnostic',
    minutes: 30,
    reason: `${MODULE_STYLE[module]?.label || module} has no reliable starting score yet, so your plan cannot rank it against your other subjects.`,
    criterion: 'Finish one scored attempt so this subject joins your evidence.',
  });
};

const buildFocusSkillTask = (evidence) => {
  const skill = (evidence?.measured_priorities || [])[0];
  const module = String(skill?.module || '').toLowerCase();
  if (!skill || !MODULE_STYLE[module]) return null;
  return synthesizeTask({
    module,
    activityType: 'targeted_drill',
    mode: 'practice',
    minutes: 25,
    skill: skill.skill_code,
    reason: `${formatSkill(skill.skill_code)} is your weakest measured skill at ${Math.round(Number(skill.mastery || 0) * 100)}% across ${Number(skill.observations || 0).toLocaleString()} answers.`,
    criterion: `Raise ${formatSkill(skill.skill_code)} toward ${Math.round(PROGRESS_RULES.FOCUS_MASTERY_TARGET * 100)}%.`,
  });
};

const buildTimedAttemptTask = (readiness) => {
  if (timedAttemptCount(readiness) >= PROGRESS_RULES.TIMED_ATTEMPT_TARGET) return null;
  const module = weakestScoredModule(readiness) || 'reading';
  return synthesizeTask({
    module,
    activityType: 'timed_assessment',
    mode: 'timed',
    minutes: 60,
    reason:
      'You have scores, but not yet under official section timing — that is the gap the next stage measures.',
    criterion: 'Complete one full section inside the official time limit.',
  });
};

const buildExamModeTask = (readiness, targetBand) => {
  const module = IELTS_MODULE_KEYS.find(
    (key) => examCredit(readiness?.modules?.[key] || {}, Number(targetBand) || 7) < 1
  );
  if (!module) return null;
  return synthesizeTask({
    module,
    activityType: 'exam_assessment',
    mode: 'mock',
    minutes: 60,
    reason: `${MODULE_STYLE[module]?.label || module} has no Exam Mode score at band ${Number(targetBand || 7).toFixed(1)} yet.`,
    criterion: `Sit one Exam Mode attempt and score band ${Number(targetBand || 7).toFixed(1)} or above.`,
  });
};

const weakestScoredModule = (readiness) =>
  IELTS_MODULE_KEYS.map((module) => ({
    module,
    median: Number(readiness?.modules?.[module]?.median ?? NaN),
  }))
    .filter((item) => Number.isFinite(item.median))
    .sort((left, right) => left.median - right.median)[0]?.module || null;

export function getFriendlyPlanText(text = '') {
  if (!text) return '';

  return String(text)
    .replace(/\bevidence quality is an early signal\b/gi, 'How sure we are: needs more results')
    .replace(/\bmeasured priorit(?:y|ies)\b/gi, (match) =>
      /ies$/i.test(match) ? 'confirmed focus areas' : 'confirmed focus'
    )
    .replace(/\ban early signal\b/gi, 'needs more results')
    .replace(/\bearly signals?\b/gi, 'needs more results')
    .replace(/\bevidence quality\b/gi, 'how sure we are')
    .replace(/\bcriteria breakdown\b/gi, 'Writing/Speaking score areas')
    .replace(/\blearning path signals\b/gi, 'your next study focus')
    .replace(/\bwords learned\b/gi, 'saved vocabulary')
    .replace(/\bmastery\b/gi, 'skill progress')
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
  if (savedEvidence && typeof savedEvidence === 'object')
    return normalizeSavedEvidence(savedEvidence);

  const skills = Object.values(skillMap?.byModule || {})
    .flat()
    .map(normalizeSkillEvidence);

  return summarizeEvidence(skills);
}

const normalizeSavedEvidence = (evidence) => ({
  ...evidence,
  measured_priorities: evidence.measured_priorities || [],
  early_signals: evidence.early_signals || evidence.unmeasured_priorities || [],
  diagnostics: evidence.diagnostics || [],
  due_reviews: evidence.due_reviews || [],
  maintenance: evidence.maintenance || [],
});

const normalizeSkillEvidence = (skill) => ({
  ...skill,
  mastery_probability: skill?.mastery_probability ?? skill?.mastery,
  confidence_level: skill?.confidence_level ?? skill?.confidence,
});

export function computeSevenDays(path, activityByKey = {}, availability = {}) {
  const schedule = path?.weekly_schedule || path?.schedule || path?.daily_schedule || {};
  const tasksBySchedule = groupTasksBySchedule(schedule, activityByKey);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, offset) =>
    buildUpcomingDay({ today, offset, tasksBySchedule, availability })
  );
}

function buildUpcomingDay({ today, offset, tasksBySchedule, availability }) {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  const scheduledDate = dateKey(date);
  const dayName = STUDY_DAYS[(date.getDay() + 6) % 7];
  return {
    dateKey: scheduledDate,
    date,
    dayName,
    capacity: Number(availability?.days?.[dayName] || 0),
    tasks: getTasksForDay(tasksBySchedule, scheduledDate, dayName),
  };
}

const getTasksForDay = (groups, scheduledDate, dayName) =>
  [...(groups.get(`date:${scheduledDate}`) || []), ...(groups.get(`day:${dayName}`) || [])].map(
    (task) => ({
      ...task,
      scheduled_day: task.scheduled_day || dayName,
      scheduled_date: task.scheduled_date || scheduledDate,
    })
  );

const getScheduledTasks = (schedule) =>
  Array.isArray(schedule)
    ? schedule
    : Object.values(schedule || {}).flatMap((tasks) => (Array.isArray(tasks) ? tasks : []));

function mergeActivity(task, activityByKey) {
  const source = task || {};
  const activity = activityByKey?.[source.activity_key] || {};
  return {
    ...source,
    ...activity,
    activity_key: source.activity_key || activity.activity_key,
    scheduled_day: activity.scheduled_day || source.scheduled_day,
    scheduled_date: activity.scheduled_date || source.scheduled_date,
    estimated_time: getMergedEstimate(activity, source),
    is_completed: Boolean(activity.is_completed ?? source.is_completed),
  };
}

const getMergedEstimate = (activity, task) =>
  activity.estimated_minutes || task.estimated_time || task.estimated_minutes || 0;

const getScheduleGroupKey = (task) => {
  const scheduledDate = String(task.scheduled_date || '').slice(0, 10);
  if (scheduledDate) return `date:${scheduledDate}`;
  const scheduledDay = String(task.scheduled_day || '').toLowerCase();
  return scheduledDay ? `day:${scheduledDay}` : null;
};

const addTaskToGroup = (groups, task) => {
  const groupKey = getScheduleGroupKey(task);
  if (!groupKey) return;
  const tasks = groups.get(groupKey) || [];
  tasks.push(task);
  tasks.sort((first, second) => Number(first.is_optional) - Number(second.is_optional));
  groups.set(groupKey, tasks);
};

function groupTasksBySchedule(schedule, activityByKey) {
  const planTasks = getScheduledTasks(schedule);
  const knownKeys = new Set(planTasks.map((task) => task?.activity_key).filter(Boolean));
  const persistedOnly = Object.values(activityByKey || {}).filter(
    (activity) => activity?.activity_key && !knownKeys.has(activity.activity_key)
  );
  const groups = new Map();
  [...planTasks, ...persistedOnly]
    .map((task) => mergeActivity(task, activityByKey))
    .forEach((task) => addTaskToGroup(groups, task));
  return groups;
}

export function getDaySummaryMeta(day = {}, primaryTask = null) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const primary = primaryTask || tasks[0] || null;
  const totalMinutes = getPlannedMinutes(tasks, primary);
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

const getTaskMinutes = (task) => Number(task?.estimated_time || task?.estimated_minutes || 0);

const getPlannedMinutes = (tasks, primary) => {
  const planned = tasks.reduce((total, task) => total + getTaskMinutes(task), 0);
  return planned || getTaskMinutes(primary);
};

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
  if (dateState === 'upcoming') return 'Upcoming';
  if (isPhaseInProgress(index, actual, isLegacyPlan)) return 'In Progress';
  if (isPhaseCondensed(index, actual, isLegacyPlan, firstIncludedIndex)) return 'Condensed';
  if (index < displayCurrentIndex) return 'Completed';
  return 'Planned';
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

/**
 * The one place that says what "progress" means on this page.
 *
 * Every stage percentage below is a *count against a fixed denominator* that a
 * learner can state out loud — "3 of 8 scored checks", "1 of 2 timed attempts"
 * — never an opaque blend. Two consequences follow, and both are the point:
 *
 * 1. Each stage can answer "what moves this, and by how much" in one sentence
 *    (`progressRule`), which is what the stage cards and the how-it-works
 *    dialog print verbatim.
 * 2. Every denominator is counted from *durable* evidence — the 90-day scored
 *    record in `readiness`, and skill mastery in `evidence` — not from the
 *    seven-day schedule, which is rebuilt on every plan refresh. Deriving a
 *    percentage from this week's task list is what previously let a learner's
 *    progress fall back to zero the moment their plan regenerated.
 */
export const PROGRESS_RULES = {
  /** Scored attempts per module before a starting score is trusted. */
  SCORED_CHECKS_PER_MODULE: 2,
  /** Mastery a focus skill has to clear to count as repaired. */
  FOCUS_MASTERY_TARGET: 0.75,
  /** Observations behind a focus skill before its mastery is actionable. */
  FOCUS_OBSERVATION_TARGET: 20,
  /** Timed or exam-mode attempts that complete the timed-integration stage. */
  TIMED_ATTEMPT_TARGET: 2,
  /** Exam-mode credit for attempting a module at all, before hitting target. */
  EXAM_ATTEMPT_CREDIT: 0.5,
};

const IELTS_MODULE_KEYS = ['reading', 'writing', 'listening', 'speaking'];
const FOUNDATION_TARGET = PROGRESS_RULES.SCORED_CHECKS_PER_MODULE * IELTS_MODULE_KEYS.length;

const moduleList = (readiness) =>
  IELTS_MODULE_KEYS.map((module) => readiness?.modules?.[module] || {});

const pluralTests = (count) => `${count} scored ${count === 1 ? 'check' : 'checks'}`;

const PHASE_TASK_MATCHERS = {
  foundation: (type, title) => type === 'diagnostic' || title.includes('diagnostic'),
  repair: (type) => ['targeted_drill', 'spaced_review', 'vocabulary_review'].includes(type),
  integration: (type, title) =>
    type === 'timed_assessment' || (title.includes('timed') && type !== 'exam_assessment'),
  readiness: (type, title) =>
    ['mock', 'exam_assessment'].includes(type) || title.includes('exam mode'),
};

const taskMatchesPhase = (task, phaseKey) => {
  const type = String(task?.activity_type || '').toLowerCase();
  const title = String(task?.title || '').toLowerCase();
  const matcher = PHASE_TASK_MATCHERS[phaseKey] || PHASE_TASK_MATCHERS.readiness;
  return matcher(type, title);
};

const findPhaseTask = (tasks = [], phaseKey) =>
  tasks.find((task) => !task.is_completed && taskMatchesPhase(task, phaseKey)) || null;

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

/**
 * Stage 1 — every scored attempt counts, not every finished module.
 *
 * The denominator is 8 (two per subject), so a single completed test is always
 * worth a visible 12–13%. Scoring this per *module* instead meant three tests
 * in a row could leave the bar untouched, which reads as a broken page.
 */
function buildFoundationPhase(readiness, tasks = []) {
  const modules = moduleList(readiness);
  const credited = modules.reduce(
    (total, item) =>
      total + Math.min(Number(item?.sample_count || 0), PROGRESS_RULES.SCORED_CHECKS_PER_MODULE),
    0
  );
  const sufficientCount = modules.filter(hasEnoughModuleEvidence).length;
  const missing = readiness?.missing_diagnostics || [];
  const actionTask = findDiagnosticTask(tasks, missing[0]);
  const missingText = missing.map((mod) => MODULE_STYLE[mod]?.label || mod).join(', ');
  const remaining = Math.max(0, FOUNDATION_TARGET - credited);

  return {
    progressPercent: clampPercent((credited / FOUNDATION_TARGET) * 100),
    progressLabel: `${credited} of ${FOUNDATION_TARGET} scored checks recorded`,
    progressRule: remaining
      ? `Each scored test adds ${Math.round(100 / FOUNDATION_TARGET)}%. ${pluralTests(remaining)} to go.`
      : 'Every subject has two recent scored checks.',
    actionTask,
    checklist: [
      {
        label: `${sufficientCount} of 4 subjects have two recent scores`,
        done: sufficientCount >= 3,
      },
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

const skillStrength = (item) =>
  Math.min(1, Number(item?.mastery || 0) / PROGRESS_RULES.FOCUS_MASTERY_TARGET);

const isSkillRepaired = (item) =>
  Number(item?.mastery || 0) >= PROGRESS_RULES.FOCUS_MASTERY_TARGET &&
  Number(item?.observations || 0) >= PROGRESS_RULES.FOCUS_OBSERVATION_TARGET;

const getReviewsChecklistLabel = (reviewsDue) =>
  reviewsDue
    ? `${reviewsDue} scheduled ${reviewsDue === 1 ? 'review' : 'reviews'} still due`
    : 'All scheduled reviews completed';

/**
 * Stage 2 — share of measured skills that have reached the 75% bar.
 *
 * The denominator is every skill with enough evidence to judge (weak ones plus
 * already-strong ones), so pushing one skill over the bar always moves the
 * number, and a skill leaving the weak list can never *shrink* it. Averaging
 * only the weak list — the previous behaviour — meant repairing your worst
 * skill promoted the next-worst into its place and the bar barely moved.
 */
function buildRepairPhase(evidence = {}) {
  const weak = evidence.measured_priorities || [];
  const strong = evidence.maintenance || [];
  const measured = [...weak, ...strong];
  const repaired = measured.filter(isSkillRepaired).length;
  const reviewsDue = Number(evidence.due_reviews?.length || 0);
  const strength = measured.length
    ? measured.reduce((total, item) => total + skillStrength(item), 0) / measured.length
    : 0;

  return {
    progressPercent: clampPercent(strength * 100),
    progressLabel: measured.length
      ? `${repaired} of ${measured.length} measured skills at ${Math.round(PROGRESS_RULES.FOCUS_MASTERY_TARGET * 100)}%`
      : 'Waiting for confirmed focus skills',
    progressRule: measured.length
      ? `Every answer that lifts a focus skill toward ${Math.round(PROGRESS_RULES.FOCUS_MASTERY_TARGET * 100)}% raises this.`
      : 'Complete a scored level check to confirm your focus skills.',
    actionTask: null,
    checklist: [
      {
        label: weak.length
          ? `${weak.length} focus ${weak.length === 1 ? 'skill' : 'skills'} still below target`
          : 'Confirm focus skills with a level check',
        done: measured.length > 0 && weak.length === 0,
      },
      { label: getReviewsChecklistLabel(reviewsDue), done: reviewsDue === 0 },
      {
        label: `Focus skills reach ${Math.round(PROGRESS_RULES.FOCUS_MASTERY_TARGET * 100)}% across ${PROGRESS_RULES.FOCUS_OBSERVATION_TARGET} answers`,
        done: measured.length > 0 && measured.every(isSkillRepaired),
      },
    ],
  };
}

const timedAttemptCount = (readiness) =>
  moduleList(readiness).reduce(
    (total, item) =>
      total + Number(item?.mode_counts?.timed || 0) + Number(item?.mode_counts?.exam || 0),
    0
  );

/**
 * Stage 3 — timed and exam-mode attempts in the 90-day scored record.
 *
 * Counting the *scheduled* timed tasks instead (what this did before) tied the
 * stage to a task list that is thrown away and rebuilt on every plan refresh,
 * so a learner who finished two timed sections last week could open the page to
 * a 0% stage. The scored record survives the rebuild; the schedule does not.
 */
function buildIntegrationPhase(readiness, tasks = []) {
  const attempts = timedAttemptCount(readiness);
  const target = PROGRESS_RULES.TIMED_ATTEMPT_TARGET;
  const credited = Math.min(attempts, target);
  const remaining = Math.max(0, target - credited);

  return {
    progressPercent: clampPercent((credited / target) * 100),
    progressLabel: `${credited} of ${target} timed attempts completed`,
    progressRule: remaining
      ? `Each timed or Exam Mode attempt adds ${Math.round(100 / target)}%. ${remaining} to go.`
      : 'Timed work is done — Exam Mode attempts carry the next stage.',
    actionTask: findPhaseTask(tasks, 'integration'),
    checklist: [
      { label: 'Complete your first timed attempt', done: credited >= 1 },
      { label: `Complete ${target} timed attempts`, done: credited >= target },
      // A scheduling hint, not a completion criterion — so it is dropped once
      // the stage is finished rather than sitting unticked under "Stage
      // complete" and contradicting it.
      ...(remaining
        ? [
            {
              label: 'Timed practice is scheduled this week',
              done: tasks.some((task) => taskMatchesPhase(task, 'integration')),
            },
          ]
        : []),
    ],
  };
}

const examCredit = (item, targetScore) => {
  const attempts = Number(item?.mode_counts?.exam || 0);
  if (attempts <= 0) return 0;
  const score = Number(item?.latest_exam_score);
  const atTarget = Number.isFinite(score) && score >= targetScore;
  return atTarget ? 1 : PROGRESS_RULES.EXAM_ATTEMPT_CREDIT;
};

const isModuleExamReady = (item, targetScore) => examCredit(item, targetScore) >= 1;

/**
 * Stage 4 — Exam Mode credit per subject, half for attempting, half for target.
 *
 * All-or-nothing credit made the bar sit at 0% through four completed mocks if
 * none of them cleared the target band, which hides real work. Half credit for
 * the attempt keeps the stage honest in both directions: it never claims exam
 * readiness the scores do not support, and it never claims nothing happened.
 */
function buildReadinessPhase(readiness = {}, targetBand = 7, tasks = []) {
  const modules = moduleList(readiness);
  const targetScore = Number(targetBand || 7);
  const measured = modules.filter(hasEnoughModuleEvidence).length;
  const attempted = modules.filter((item) => Number(item?.mode_counts?.exam || 0) > 0).length;
  const atTarget = modules.filter((item) => isModuleExamReady(item, targetScore)).length;
  const credit = modules.reduce((total, item) => total + examCredit(item, targetScore), 0);

  return {
    progressPercent: clampPercent((credit / IELTS_MODULE_KEYS.length) * 100),
    progressLabel: `${atTarget} of 4 Exam Mode scores at band ${targetScore.toFixed(1)}`,
    progressRule: `Each Exam Mode attempt adds ${Math.round(PROGRESS_RULES.EXAM_ATTEMPT_CREDIT * 25)}%, and reaching band ${targetScore.toFixed(1)} adds the rest.`,
    actionTask: findPhaseTask(tasks, 'readiness'),
    checklist: [
      { label: 'Recent scores ready in all 4 subjects', done: measured === 4 },
      {
        label: attempted
          ? `${attempted} of 4 subjects attempted in Exam Mode`
          : 'Complete one Exam Mode attempt',
        done: attempted === IELTS_MODULE_KEYS.length,
      },
      {
        label: `Exam Mode scores reach band ${targetScore.toFixed(1)} in every subject`,
        done: atTarget === IELTS_MODULE_KEYS.length,
      },
    ],
  };
}

const PHASE_BUILDERS = {
  foundation: ({ readiness, tasks }) => buildFoundationPhase(readiness, tasks),
  repair: ({ evidence }) => buildRepairPhase(evidence),
  integration: ({ readiness, tasks }) => buildIntegrationPhase(readiness, tasks),
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
      progressRule: derived.progressRule || '',
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

  const merged = computed.map((phase) => {
    const data = derived.find((d) => d.key === phase.key) || {};
    return { ...phase, ...data };
  });
  const currentIndex = Math.max(
    0,
    merged.findIndex((phase) => Number(phase.progressPercent || 0) < 100)
  );

  // A stage the learner has already put evidence into is never "Planned".
  // Stages are open in any order — someone can sit a mock in week one — so the
  // ladder reports what actually happened rather than forcing a single file.
  return merged.map((phase, index) => ({
    ...phase,
    status: getStageStatus(phase, index, currentIndex),
  }));
}

const getStageStatus = (phase, index, currentIndex) => {
  const percent = Number(phase.progressPercent || 0);
  if (percent >= 100) return 'Completed';
  if (index === currentIndex) return 'In Progress';
  if (percent > 0) return 'Started';
  return index === currentIndex + 1 ? 'Upcoming' : 'Planned';
};

/**
 * The single journey number, shared by the stage rail and the readout beside it.
 *
 * These used to be computed separately — the readout averaged four stages while
 * the rail measured three gaps between nodes — so the same journey was printed
 * as 35% next to a line drawn at 38%. One function, one number, both consumers.
 */
export function getPathProgress(phases = []) {
  if (!phases.length)
    return { overallPercent: 0, stagesDone: 0, currentIndex: 0, currentStage: null };
  const overallPercent = clampPercent(
    phases.reduce((total, phase) => total + Number(phase.progressPercent || 0), 0) / phases.length
  );
  const stagesDone = phases.filter((phase) => Number(phase.progressPercent || 0) >= 100).length;
  const currentIndex = Math.max(
    0,
    phases.findIndex((phase) => Number(phase.progressPercent || 0) < 100)
  );

  return {
    overallPercent,
    stagesDone,
    currentIndex,
    currentStage: phases[currentIndex] || null,
    totalStages: phases.length,
  };
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
  // Account goals are the source of truth. A saved path is only a historical snapshot and can
  // briefly lag after a learner changes their exam date.
  return userValue || snapshotValue || null;
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
  const targetBand = getTargetBandValue(goal?.target_band, user.target_band_score);
  const examDate = getExamDateValue(goal?.test_date, user.test_date);
  const savedExamDate = normalizeGoalDate(goal?.test_date);
  const currentExamDate = normalizeGoalDate(examDate);
  const daysLeft = getExamDaysLeft(examDate);
  const examDatePassed = isExamDatePassed(examDate);
  const roadmap = resolveSnapshotRoadmap({
    path,
    user,
    examDate,
    examDatePassed,
    currentExamDate,
    savedExamDate,
  });

  return { readiness, roadmap, targetBand, examDate, daysLeft, examDatePassed };
}

const resolveSnapshotRoadmap = ({
  path,
  user,
  examDate,
  examDatePassed,
  currentExamDate,
  savedExamDate,
}) =>
  examDatePassed || currentExamDate !== savedExamDate
    ? buildRoadmap(examDate)
    : getSnapshotRoadmap(path?.roadmap, user.test_date);

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
