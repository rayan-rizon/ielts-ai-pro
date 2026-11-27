/*
 * Practice a learner added to their study plan from a Writing report. It is kept
 * in `users.settings.plan_practice`, apart from the generated plan: a rebuild
 * replaces the plan's tasks, so anything written into them would disappear.
 *
 * Pure, so the web app and the mobile app share it.
 */
export const PLAN_SETTINGS_KEY = 'plan_practice';
export const MAX_PLAN_ITEMS = 12;

/** Rough time for each kind of practice, shown as "About N min". */
export const DRILL_MINUTES = { rewrite: 15, grammar: 10, vocabulary: 5, words: 5, criterion: 10 };

/** @type {Record<string, string>} */
const AREA = { grammar: '/grammar', vocabulary: '/vocabulary', words: '/vocabulary' };
const AREAS = new Set(Object.values(AREA));
const DETAILS = ['count', 'total', 'words', 'criterion', 'score', 'to'];

/** @param {any} drill */
function compactDrill(drill) {
  /** @type {Record<string, any>} */
  const kept = { id: drill.id };
  for (const key of DETAILS) if (drill[key] != null) kept[key] = drill[key];
  const paragraph = drill.paragraph;
  if (paragraph) kept.paragraph = { role: paragraph.role, number: paragraph.number };
  return kept;
}

/**
 * @param {any[]} drills
 * @param {{ sessionId?: string | null, taskType: string, now: string }} report
 * @returns {any[]}
 */
export function planItems(drills, { sessionId, taskType, now }) {
  if (!sessionId) return [];
  return drills.map((drill) => ({
    id: `${sessionId}:${taskType}:${drill.id}`,
    sessionId,
    taskType,
    addedAt: now,
    doneAt: null,
    drill: compactDrill(drill),
  }));
}

/** @param {any} item */
const isItem = (item) =>
  typeof item?.id === 'string' &&
  typeof item.sessionId === 'string' &&
  Object.prototype.hasOwnProperty.call(DRILL_MINUTES, item.drill?.id);

/** @param {any} settings @returns {any[]} */
export function readPlanItems(settings) {
  const stored = settings?.[PLAN_SETTINGS_KEY];
  return Array.isArray(stored) ? stored.filter(isItem) : [];
}

// "Word choice" and "stronger words" are the same practice.
/** @param {any} item */
const kindOf = (item) => (item.drill.id === 'words' ? 'vocabulary' : item.drill.id);

/** @param {any[]} items */
function withinLimit(items) {
  const list = [...items];
  while (list.length > MAX_PLAN_ITEMS) {
    const finished = list.findIndex((item) => item.doneAt);
    list.splice(Math.max(finished, 0), 1);
  }
  return list;
}

/**
 * Adds a report's drills. One already listed keeps its tick; a newer drill
 * replaces an unfinished one of the same kind, so the list does not pile up.
 *
 * @param {any[]} stored
 * @param {any[]} incoming
 */
export function addPlanItems(stored, incoming) {
  const known = new Set(stored.map((item) => item.id));
  const fresh = incoming.filter((item) => !known.has(item.id));
  if (!fresh.length) return stored;
  const replaced = new Set(fresh.map(kindOf));
  const kept = stored.filter((item) => item.doneAt || !replaced.has(kindOf(item)));
  return withinLimit([...kept, ...fresh]);
}

/** @param {any[]} stored @param {any[]} incoming */
export const allPlanned = (stored, incoming) =>
  incoming.length > 0 && incoming.every((item) => stored.some((other) => other.id === item.id));

/** @param {any[]} stored @param {string} id @param {string | null} doneAt */
export const setPlanItemDone = (stored, id, doneAt) =>
  stored.map((item) => (item.id === id ? { ...item, doneAt } : item));

/** @param {any[]} stored @param {string} id */
export const removePlanItem = (stored, id) => stored.filter((item) => item.id !== id);

/** The practice area, or the report itself. Stored addresses are not trusted. */
/** @param {any} item */
export function planItemLink(item) {
  const area = AREA[item.drill.id] || (AREAS.has(item.drill.to) ? item.drill.to : null);
  return area || `/writing-task?sessionId=${encodeURIComponent(item.sessionId)}&view=true`;
}
