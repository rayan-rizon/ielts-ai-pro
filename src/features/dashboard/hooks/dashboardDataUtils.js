import { formatBand } from '@/lib/format';

const valueOr = (value, fallback) => value ?? fallback;
const numberOrZero = (value) => valueOr(value, 0);

export function normalizeTargetScore(value) {
  const score = Number(value);
  return Number.isFinite(score) && score > 0 && score <= 9 ? score : null;
}

export function isPremiumTier(tier) {
  const normalizedTier = String(tier || '').toLowerCase();
  return normalizedTier === 'pro' || normalizedTier === 'premium';
}

const buildRecentTests = (sessions) =>
  sessions.map((session) => ({
    ...session,
    passage: session.passage_title
      ? { id: session.passage_id, title: session.passage_title }
      : null,
  }));

const buildStats = (serverStats, targetScore) => ({
  totalTests: numberOrZero(serverStats.totalTests),
  measuredTests: valueOr(serverStats.measuredTests, numberOrZero(serverStats.totalTests)),
  abandonedTests: numberOrZero(serverStats.abandonedTests),
  avgScore: formatBand(numberOrZero(serverStats.avgScore)),
  targetScore: normalizeTargetScore(targetScore),
  todayMinutes: numberOrZero(serverStats.todayMinutes),
  todayTests: numberOrZero(serverStats.todayTests),
  streak: numberOrZero(serverStats.streak),
  moduleAverages: valueOr(serverStats.moduleAverages, {}),
  dailyActivity: valueOr(serverStats.dailyActivity, {}),
});

export function createEmptyDashboardData(targetScore) {
  return {
    weeklyProgress: [],
    stats: {
      totalTests: 0,
      measuredTests: 0,
      abandonedTests: 0,
      avgScore: '0.0',
      targetScore: normalizeTargetScore(targetScore),
      todayMinutes: 0,
      todayTests: 0,
      streak: 0,
      moduleAverages: {},
      dailyActivity: {},
    },
    recentTests: [],
    cambridgeTests: [],
    weakestSkill: null,
    skillProficiency: [],
  };
}

export function buildDashboardViewModel(dashboardData, targetScore) {
  if (!dashboardData?.serverStats) return createEmptyDashboardData(targetScore);

  const serverStats = dashboardData.serverStats;
  return {
    weeklyProgress: valueOr(serverStats.weeklyProgress, []),
    stats: buildStats(serverStats, targetScore),
    recentTests: buildRecentTests(valueOr(dashboardData.recentSessions, [])),
    cambridgeTests: valueOr(dashboardData.cambridgeTests, []),
    weakestSkill: valueOr(dashboardData.weakestSkill, null),
    skillProficiency: valueOr(dashboardData.skillProficiency, []),
  };
}
