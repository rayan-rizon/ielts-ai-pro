import { STUDY_DAYS, studyDateKey } from '../../../../../supabase/functions/_shared/learningPathV2';

/**
 * What the Study plan page knows about a learner's real practice.
 *
 * The saved plan only keeps the days still ahead of the learner, so a "missed
 * session" cannot be read back from it. Everything here is derived from what the
 * learner actually did instead: completed scored sessions and finished plan
 * activities, each placed on their own calendar day in their own timezone.
 */

const DAY_MS = 86_400_000;
const MISSED_DAYS_THRESHOLD = 3;
const QUIET_DAYS_WARNING = 3;
const QUIET_DAYS_FAULT = 7;

const toUtcNoon = (dateKey) => new Date(`${dateKey}T12:00:00Z`);
const toKey = (date) => date.toISOString().slice(0, 10);
export const shiftDateKey = (dateKey, days) =>
  toKey(new Date(toUtcNoon(dateKey).getTime() + days * DAY_MS));
const daysBetween = (fromKey, toKeyValue) =>
  Math.round((toUtcNoon(toKeyValue) - toUtcNoon(fromKey)) / DAY_MS);

const emptyDay = () => ({ count: 0, minutes: 0, modules: [], sessions: [] });

const addToLog = (log, dateKey, { module, minutes = 0, session = null }) => {
  const day = log[dateKey] || emptyDay();
  day.count += 1;
  day.minutes += minutes;
  if (module && !day.modules.includes(module)) day.modules.push(module);
  if (session) day.sessions.push(session);
  log[dateKey] = day;
};

const localDateKey = (timestamp, timezone) => {
  const time = Date.parse(timestamp || '');
  return Number.isFinite(time) ? studyDateKey(new Date(time), timezone || 'UTC') : null;
};

/**
 * Practice by calendar day: `{ 'YYYY-MM-DD': { count, minutes, modules, sessions } }`.
 * Minutes come only from scored sessions' recorded duration; a finished plan
 * activity marks the day as practised but never adds minutes it cannot prove.
 */
export function buildPracticeLog({ sessions = [], activityByKey = {}, timezone = 'UTC' } = {}) {
  const log = {};
  sessions.forEach((session) => {
    const dateKey = session?.is_completed ? localDateKey(session.completed_at, timezone) : null;
    if (!dateKey) return;
    const module = String(session.test_type || '').toLowerCase();
    const minutes = Math.round(Number(session.actual_duration_seconds || 0) / 60);
    addToLog(log, dateKey, {
      module,
      minutes,
      session: { module, minutes, score: session.score ?? null, mode: session.test_mode ?? null },
    });
  });
  Object.values(activityByKey || {}).forEach((activity) => {
    const dateKey = activity?.is_completed ? localDateKey(activity.completed_at, timezone) : null;
    if (!dateKey) return;
    addToLog(log, dateKey, { module: String(activity.module || '').toLowerCase() || null });
  });
  return log;
}

/** Consecutive practised days. Today being empty does not break it — it is not over yet. */
export function getPracticeStreak(log, todayKey) {
  let cursor = log[todayKey]?.count ? todayKey : shiftDateKey(todayKey, -1);
  let streak = 0;
  while (log[cursor]?.count) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function getDaysSincePractice(log, todayKey) {
  const practised = Object.keys(log).filter((key) => log[key]?.count && key <= todayKey);
  if (!practised.length) return null;
  return daysBetween(practised.sort().at(-1), todayKey);
}

const weekdayCapacity = (availability, dateKey) =>
  Number(availability?.days?.[STUDY_DAYS[(toUtcNoon(dateKey).getUTCDay() + 6) % 7]] || 0);

/**
 * The days before today, oldest first. A day is "missed" only when the learner
 * had study time set aside for that weekday and did no practice; a day with no
 * time set aside is a rest day, never a failure.
 */
export function buildHistoryDays({ log = {}, availability = {}, todayKey, days = 7 }) {
  return Array.from({ length: days }, (_, index) => {
    const dateKey = shiftDateKey(todayKey, index - days);
    const practice = log[dateKey];
    const capacity = weekdayCapacity(availability, dateKey);
    const status = practice?.count ? 'practised' : capacity > 0 ? 'missed' : 'rest';
    return {
      dateKey,
      status,
      capacity,
      count: practice?.count || 0,
      minutes: practice?.minutes || 0,
      modules: practice?.modules || [],
      sessions: practice?.sessions || [],
    };
  });
}

/** Rolling seven-day windows ending today, oldest first. */
export function buildWeeklyMinutes({ log = {}, todayKey, weeks = 6 }) {
  return Array.from({ length: weeks }, (_, index) => {
    const endKey = shiftDateKey(todayKey, -7 * (weeks - 1 - index));
    const startKey = shiftDateKey(endKey, -6);
    const minutes = Object.entries(log)
      .filter(([key]) => key >= startKey && key <= endKey)
      .reduce((total, [, day]) => total + (day.minutes || 0), 0);
    return { startKey, endKey, minutes };
  });
}

/** `weeks` columns of seven days ending today. Level is 0–3 by how much was done. */
export function buildHeatmap({ log = {}, todayKey, weeks = 5 }) {
  const total = weeks * 7;
  return Array.from({ length: weeks }, (_, column) =>
    Array.from({ length: 7 }, (_, row) => {
      const dateKey = shiftDateKey(todayKey, column * 7 + row - (total - 1));
      const count = log[dateKey]?.count || 0;
      return {
        dateKey,
        count,
        minutes: log[dateKey]?.minutes || 0,
        level: Math.min(count, 3),
        isToday: dateKey === todayKey,
      };
    })
  );
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * The one thing worth interrupting the page for. Silence is the default: a
 * learner with no history yet, or one practising on schedule, sees nothing.
 */
export function getPlanAttention({ daysSincePractice, missedDays = 0 }) {
  if (daysSincePractice === null || daysSincePractice === undefined) return null;
  if (daysSincePractice >= QUIET_DAYS_WARNING) {
    return {
      kind: 'inactive',
      tone: daysSincePractice >= QUIET_DAYS_FAULT ? 'fault' : 'warn',
      title: `No practice for ${plural(daysSincePractice, 'day')}`,
    };
  }
  if (missedDays >= MISSED_DAYS_THRESHOLD) {
    return {
      kind: 'missed',
      tone: 'warn',
      title: `You skipped ${plural(missedDays, 'planned study day')} this past week`,
    };
  }
  return null;
}

/** The stable identity of a task across renders: its saved key, else its title. */
export const taskKey = (task) => task?.activity_key || task?.title || '';

const MODULES = ['reading', 'writing', 'listening', 'speaking'];

const scoreGap = (readiness, module, target) => {
  const median = readiness?.modules?.[module]?.median;
  if (median === null || median === undefined) return { module, scored: false, gap: null };
  return { module, scored: true, gap: Number((target - Number(median)).toFixed(1)) };
};

/**
 * How much runway is left before exam day, in units a learner can spend. Plain
 * arithmetic on the study time they saved, never a forecast of their score.
 */
export function computeRunway({ daysLeft, weeklyCapacity, days = [], readiness, targetBand }) {
  const weeksLeft = daysLeft > 0 ? daysLeft / 7 : 0;
  const sessionsPerWeek = days.filter((day) => day.tasks.length > 0).length;
  const target = Number(targetBand) || 7;
  const below = MODULES.map((module) => scoreGap(readiness, module, target)).filter(
    (item) => !item.scored || item.gap > 0
  );
  const largest = below.filter((item) => item.scored).sort((a, b) => b.gap - a.gap)[0] || null;

  return {
    weeks: Math.round(weeksLeft * 10) / 10,
    sessions: Math.round(weeksLeft * sessionsPerWeek),
    minutes: Math.round(weeksLeft * Number(weeklyCapacity || 0)),
    belowCount: below.length,
    below: [...below].sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1)),
    largest,
  };
}

/** Everything the page shows about what the learner has actually done. */
export function buildPracticeHistory({
  sessions,
  activityByKey,
  timezone,
  availability,
  todayKey,
}) {
  const log = buildPracticeLog({ sessions, activityByKey, timezone });
  const heatmap = buildHeatmap({ log, todayKey });
  return {
    heatmap,
    recentDays: heatmap.flat().slice(-7),
    historyDays: buildHistoryDays({ log, availability, todayKey }),
    weeks: buildWeeklyMinutes({ log, todayKey }),
    streak: getPracticeStreak(log, todayKey),
    daysSincePractice: getDaysSincePractice(log, todayKey),
  };
}

const minutesOf = (task) => Number(task?.estimated_time || task?.estimated_minutes || 0);
const totalMinutes = (tasks) => tasks.reduce((total, task) => total + minutesOf(task), 0);

/**
 * The plan week as the page counts it: optional extras never count towards
 * "done", and the selected session falls back to the best next task.
 */
export function summarizeWeek({ days, primaryTask, selectedKey, selectableDays = days }) {
  const allTasks = days.flatMap((day) => day.tasks);
  const mainTasks = allTasks.filter((task) => !task.is_optional);
  const doneTasks = mainTasks.filter((task) => task.is_completed);
  const selectable = selectableDays.flatMap((day) => day.tasks);
  const selectedTask =
    selectable.find((task) => taskKey(task) === selectedKey) || primaryTask || null;
  const selectedDay = selectedTask
    ? selectableDays.find((day) =>
        day.tasks.some((task) => taskKey(task) === taskKey(selectedTask))
      )
    : null;
  return {
    mainTasks,
    doneTasks,
    selectedTask,
    selectedDay,
    plannedMinutes: totalMinutes(mainTasks),
    doneMinutes: totalMinutes(doneTasks),
  };
}

/** A score more than two bands under target is the one thing worth flagging red. */
export const isFarBelow = (score, target) =>
  score !== null && score !== undefined && target - score > 2;

const GOAL_PATTERNS = [
  {
    pattern: /(\d{1,3})\s*%\+?\s*(?:accuracy|correct)/i,
    build: ([, percent]) => ({
      kind: 'accuracy',
      target: Number(percent),
      label: `Get ${percent}% or more correct`,
    }),
  },
  {
    pattern: /(\d{1,3})\s*\/\s*(\d{1,3})/,
    build: ([, right, total]) => ({
      kind: 'accuracy',
      target: Math.round((Number(right) / Number(total)) * 100),
      label: `Get ${right} of ${total} correct`,
    }),
  },
  {
    pattern: /at least (\d{1,3}) of (\d{1,3})/i,
    build: ([, right, total]) => ({
      kind: 'accuracy',
      target: Math.round((Number(right) / Number(total)) * 100),
      label: `Get ${right} of ${total} correct`,
    }),
  },
  {
    pattern: /band\s*(\d(?:\.\d)?)/i,
    build: ([, band]) => ({ kind: 'band', target: Number(band), label: `Reach band ${band}` }),
  },
];

/** The one numeric goal in a task's success criterion, if it states one. */
const parseGoal = (text) => {
  for (const { pattern, build } of GOAL_PATTERNS) {
    const match = String(text || '').match(pattern);
    if (match) return build(match);
  }
  return null;
};

const recordedResult = (task, kind) => {
  const value = kind === 'band' ? task.outcome_band : task.outcome_accuracy;
  return value === null || value === undefined ? null : Number(value);
};

const goalStep = (task, goal) => {
  const base = { id: 'goal', label: goal.label, auto: true };
  if (!task.is_completed) return { ...base, state: 'pending', detail: null };
  const value = recordedResult(task, goal.kind);
  if (value === null) return { ...base, state: 'unknown', detail: 'Result not recorded' };
  const shown = goal.kind === 'band' ? `Band ${value.toFixed(1)}` : `${Math.round(value)}%`;
  const target = goal.kind === 'band' ? goal.target.toFixed(1) : `${goal.target}%`;
  return value >= goal.target
    ? { ...base, state: 'done', detail: shown }
    : { ...base, state: 'missed', detail: `${shown} · goal ${target}` };
};

/**
 * What finishing a session means, read from what the learner actually did. Steps
 * are never tapped: the attempt ticks when the activity is completed, and the
 * goal ticks only if the recorded result reaches it — a finished attempt that
 * fell short says so with the real number.
 */
export function buildSessionChecklist(task) {
  if (!task) return [];
  const verified = task.completion_policy === 'verified';
  const steps = [
    {
      id: 'attempt',
      label: verified ? 'Complete the practice set' : 'Finish the session',
      auto: verified,
      state: task.is_completed ? 'done' : 'pending',
      detail: null,
    },
  ];
  const goal = parseGoal(task.success_criterion);
  if (goal) steps.push(goalStep(task, goal));
  return steps;
}

const monthStartOf = (dateKey) => `${dateKey.slice(0, 7)}-01`;

/** Every month the plan touches, first of month each, starting with today's. */
export function getPlanMonths(days, todayKey) {
  const last = days.at(-1)?.dateKey || todayKey;
  const months = [];
  let cursor = monthStartOf(todayKey);
  while (cursor <= last) {
    months.push(cursor);
    const [year, month] = cursor.split('-').map(Number);
    cursor = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-01`;
  }
  return months;
}

/**
 * One month as Monday-first weeks. Each real date carries what the page knows
 * about it: planned tasks, exam day, or — for days already gone — whether the
 * learner practised or skipped a study day.
 */
export function buildMonthGrid({ monthKey, days, historyDays, todayKey }) {
  const planByDate = Object.fromEntries(days.map((day) => [day.dateKey, day]));
  const historyByDate = Object.fromEntries(historyDays.map((day) => [day.dateKey, day]));
  const first = toUtcNoon(monthKey);
  const lead = (first.getUTCDay() + 6) % 7;
  const length = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const cells = [
    ...Array.from({ length: lead }, () => ({ dateKey: null })),
    ...Array.from({ length }, (_, index) => {
      const dateKey = shiftDateKey(monthKey, index);
      const plan = planByDate[dateKey];
      return {
        dateKey,
        day: index + 1,
        tasks: plan?.tasks || [],
        isExamDay: Boolean(plan?.isExamDay),
        isToday: dateKey === todayKey,
        status: historyByDate[dateKey]?.status || null,
      };
    }),
  ];
  while (cells.length % 7) cells.push({ dateKey: null });
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}
