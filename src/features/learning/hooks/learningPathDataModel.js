import { objectiveTypeStats } from '../../../../supabase/functions/_shared/learningPathV2';

const EMPTY_OBJ = Object.freeze({});

export const EMPTY_STATS = Object.freeze({
  moduleAverages: EMPTY_OBJ,
  moduleTrends: EMPTY_OBJ,
  totalTests: 0,
  sessions: Object.freeze([]),
});

export const EMPTY_SKILL_MAP = Object.freeze({
  byModule: EMPTY_OBJ,
  totals: Object.freeze({ skills: 0, due: 0 }),
});

export const EMPTY_PATH_DATA = Object.freeze({
  path: null,
  pathId: null,
  completedActivities: EMPTY_OBJ,
  activityByKey: EMPTY_OBJ,
});

const arrayOrEmpty = (value) => (Array.isArray(value) ? value : []);
const objectOrEmpty = (value) => (value && typeof value === 'object' ? value : {});
const numberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const humanizeLabel = (value) =>
  String(value ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function formatSkillName(skillCode) {
  if (!skillCode) return '';
  const parts = String(skillCode).split('_').filter(Boolean);
  return humanizeLabel(parts.length > 1 ? parts.slice(1).join(' ') : skillCode);
}

const weightedAccuracy = (points) => {
  const total = points.reduce((sum, point) => sum + numberOr(point.total, 0), 0);
  if (total <= 0) return null;
  const correctWeight = points.reduce(
    (sum, point) => sum + numberOr(point.accuracy, 0) * numberOr(point.total, 0),
    0
  );
  return correctWeight / total;
};

const getTrend = (points) => {
  const recent = weightedAccuracy(points.slice(0, 3));
  const previous = weightedAccuracy(points.slice(3, 6));
  if (recent == null || previous == null) return 'stable';
  const difference = recent - previous;
  if (difference > 0.05) return 'up';
  if (difference < -0.05) return 'down';
  return 'stable';
};

const addSessionSkillPoints = (pointsBySkill, session) => {
  const testType = session?.test_type;
  const typeStats = sessionTypeStats(session);
  if (!hasSkillStats(testType, typeStats)) return;

  Object.entries(typeStats).forEach(([typeKey, stats]) => {
    const point = createSkillPoint(stats);
    if (!point) return;
    const skillCode = `${testType}_${String(typeKey).replace(/\s+/g, '_')}`;
    const points = pointsBySkill[skillCode] ?? [];
    points.push(point);
    pointsBySkill[skillCode] = points;
  });
};

// Reading and Listening totals get the same legacy repair the result card uses;
// other modules keep whatever typeStats they stored.
const sessionTypeStats = (session) =>
  ['reading', 'listening'].includes(String(session?.test_type || '').toLowerCase())
    ? objectiveTypeStats(session)
    : session?.content_data?.typeStats;

const hasSkillStats = (testType, typeStats) =>
  Boolean(testType) && Boolean(typeStats) && typeof typeStats === 'object';

const createSkillPoint = (stats) => {
  const total = numberOr(stats?.total, 0);
  if (total <= 0) return null;
  return { accuracy: numberOr(stats?.correct, 0) / total, total };
};

export function buildSkillTrendMap(sessions) {
  const pointsBySkill = {};
  arrayOrEmpty(sessions).forEach((session) => addSessionSkillPoints(pointsBySkill, session));
  return Object.fromEntries(
    Object.entries(pointsBySkill).map(([skillCode, points]) => [skillCode, getTrend(points)])
  );
}

const isCurrentGeneratedCriterion = (proficiency) => {
  const module = proficiency?.module ?? 'reading';
  const skillCode = String(proficiency?.skill_code ?? '');
  const generated =
    module === 'writing' || module === 'speaking' || /_(writing|speaking)$/i.test(skillCode);
  return !generated || proficiency?.evidence_version === '2026-07-29-v5';
};

const buildSkillRecord = (proficiency, trendBySkill, now) => {
  const source = proficiency ?? {};
  const mastery = numberOr(source.mastery_probability, 0.5);
  const practiceCount = numberOr(source.practice_count, 0);
  const isDue = isReviewDue(source.next_review_at, now);
  const trend = trendBySkill[source.skill_code] ?? 'stable';
  const trendLabel = getTrendLabel(trend);

  return {
    skill_code: source.skill_code,
    module: source.module ?? 'reading',
    skill_name: formatSkillName(source.skill_code),
    mastery,
    confidence: numberOr(source.confidence_level, 0),
    practice_count: practiceCount,
    correct_count: numberOr(source.correct_count, 0),
    last_practiced_at: source.last_practiced_at ?? null,
    next_review_at: source.next_review_at ?? null,
    trend,
    is_due: isDue,
    why: `${Math.round(mastery * 100)}% skill progress over ${practiceCount} answers, ${trendLabel}${isDue ? ', due now' : ''}`,
  };
};

const isReviewDue = (nextReviewAt, now) => {
  if (!nextReviewAt) return false;
  const reviewTime = new Date(nextReviewAt).getTime();
  return Number.isFinite(reviewTime) && reviewTime <= now;
};

const getTrendLabel = (trend) => {
  if (trend === 'up') return 'improving';
  if (trend === 'down') return 'declining';
  return 'stable';
};

export function buildSkillMap(proficiencies, sessions, now = Date.now()) {
  const trendBySkill = buildSkillTrendMap(sessions);
  const byModule = {};
  let due = 0;

  arrayOrEmpty(proficiencies)
    .filter(isCurrentGeneratedCriterion)
    .forEach((proficiency) => {
      const record = buildSkillRecord(proficiency, trendBySkill, now);
      const moduleSkills = byModule[record.module] ?? [];
      moduleSkills.push(record);
      byModule[record.module] = moduleSkills;
      if (record.is_due) due += 1;
    });

  Object.values(byModule).forEach((skills) => {
    skills.sort((left, right) =>
      left.mastery === right.mastery
        ? right.practice_count - left.practice_count
        : left.mastery - right.mastery
    );
  });

  return {
    byModule,
    totals: {
      skills: Object.values(byModule).reduce((sum, skills) => sum + skills.length, 0),
      due,
    },
  };
}

const parsePathData = (pathData) => {
  if (typeof pathData !== 'string') return pathData ?? null;
  try {
    return JSON.parse(pathData);
  } catch {
    return null;
  }
};

const buildActivityMap = (activities) =>
  Object.fromEntries(
    arrayOrEmpty(activities)
      .filter((activity) => activity?.activity_key)
      .map((activity) => [activity.activity_key, activity])
  );

export function buildLearningPathData(response) {
  const source = response ?? {};
  const stats = source.stats ?? {};
  const sessions = arrayOrEmpty(stats.sessions);

  return {
    pathData: buildPathData(source.learningPath, source.activities),
    statsData: buildStatsData(stats, sessions),
    skillMap: buildSkillMap(source.skillProficiencies, sessions),
  };
}

const buildPathData = (learningPath, activities) => {
  const path = learningPath ?? {};
  return {
    path: parsePathData(path.path_data),
    pathId: path.id ?? null,
    completedActivities: objectOrEmpty(path.activities_completed),
    activityByKey: buildActivityMap(activities),
  };
};

const buildStatsData = (stats, sessions) => ({
  moduleAverages: objectOrEmpty(stats.moduleAverages),
  moduleTrends: objectOrEmpty(stats.moduleTrends),
  totalTests: numberOr(stats.totalTests, 0),
  sessions,
});

const normalizeTask = (task) =>
  typeof task === 'string' ? { title: task, module: 'general', estimated_time: 30 } : (task ?? {});

export function buildActivityPayload({
  learningPathId,
  userId,
  activityKey,
  dayName,
  taskIdx,
  task,
  isCompleted,
  outcomeScore,
}) {
  const normalizedTask = normalizeTask(task);
  return {
    learning_path_id: learningPathId,
    user_id: userId,
    activity_key: activityKey,
    scheduled_day: dayName,
    scheduled_date: normalizedTask.scheduled_date ?? null,
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    outcome_score: outcomeScore ?? null,
    outcome_band: null,
    outcome_accuracy: null,
    completion_source: isCompleted ? 'manual' : null,
    stage_key: normalizedTask.stage_key ?? null,
    completion_policy: normalizedTask.completion_policy ?? 'self_reported',
    requested_mode: normalizedTask.requested_mode ?? normalizedTask.routing?.mode ?? null,
    evidence_key: normalizedTask.evidence_key ?? null,
    title: normalizedTask.title ?? `Task ${taskIdx + 1}`,
    module: normalizedTask.module ?? 'general',
    estimated_minutes: normalizedTask.estimated_time ?? 30,
    priority: typeof normalizedTask.priority === 'string' ? normalizedTask.priority : 'medium',
    activity_type: normalizedTask.activity_type ?? 'practice',
    skill_targets: arrayOrEmpty(normalizedTask.skill_targets),
  };
}
