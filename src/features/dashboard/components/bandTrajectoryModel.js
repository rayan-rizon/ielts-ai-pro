/**
 * Band progress is read one module at a time. A Reading 8 followed by a
 * Writing 5 is not a fall, so tests from different modules are never joined
 * into one line or compared with each other.
 */
const MODULE_ORDER = ['reading', 'listening', 'writing', 'speaking'];
export const MODULE_LABELS = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

/** Scored tests grouped by module, oldest first, plus the module tested last. */
export function groupScoredTestsByModule(recentTests) {
  const scored = (Array.isArray(recentTests) ? recentTests : [])
    .filter(
      (test) =>
        Number.isFinite(Number(test?.score)) &&
        test?.completed_at &&
        MODULE_ORDER.includes(String(test?.test_type || '').toLowerCase())
    )
    .slice()
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  const byModule = {};
  for (const test of scored) {
    const module = String(test.test_type).toLowerCase();
    (byModule[module] ||= []).push({
      score: Number(test.score),
      module,
      dateLabel: new Date(test.completed_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    });
  }

  return {
    byModule,
    modules: MODULE_ORDER.filter((module) => byModule[module]?.length),
    latestModule: scored.length ? String(scored[scored.length - 1].test_type).toLowerCase() : null,
  };
}

export function moduleChange(points = []) {
  return points.length >= 2 ? points[points.length - 1].score - points[0].score : null;
}
