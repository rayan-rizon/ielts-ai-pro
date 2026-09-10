import { CalendarClock, Flag, Flame, Target, Zap } from 'lucide-react';
import { calculateDaysUntilExam } from '@/services/adaptiveLearningService';
import { normalizeTargetScore } from '../hooks/dashboardDataUtils';

const numberOrZero = (value) => Number(value) || 0;

const countWeekTests = (weeklyProgress) =>
  (Array.isArray(weeklyProgress) ? weeklyProgress : []).reduce(
    (total, day) => total + numberOrZero(day?.tests),
    0
  );

const buildExamSub = (daysToExam, weekTests) => {
  if (daysToExam == null) return 'no date set';
  if (daysToExam < 0) return 'test date passed';
  if (daysToExam === 0) return 'test is today';
  const weeks = Math.floor(daysToExam / 7);
  const pace = weekTests > 0 ? `${weekTests}/wk now` : 'no tests this week';
  return weeks >= 1 ? `${weeks} wk left · ${pace}` : pace;
};

const buildBandTile = ({ average, measuredTests, abandonedTests }) => ({
  key: 'average',
  icon: Target,
  label: 'Band average',
  value: measuredTests > 0 ? average.toFixed(1) : '—',
  sub: measuredTests > 0 ? `across ${measuredTests} tests` : 'no measured tests yet',
  tip:
    abandonedTests > 0
      ? `Your mean band across every scored test. ${abandonedTests} left early and are excluded.`
      : 'Your mean band across every scored test.',
});

const buildTargetTile = ({ gap, target }) => ({
  key: 'target',
  icon: Flag,
  label: 'To target',
  value: gap == null ? '—' : gap.toFixed(1),
  unit: gap == null ? null : 'bands',
  sub: target == null ? 'set a target band' : `target ${target.toFixed(1)}`,
  href: target == null ? '/onboarding' : null,
  tip:
    target == null
      ? 'Set a target band in onboarding to track the remaining gap.'
      : 'Gap between your average and target band.',
});

const buildStreakTile = ({ streak, todayMinutes }) => ({
  key: 'streak',
  icon: Flame,
  tone: 'amber',
  label: 'Streak',
  value: streak,
  unit: streak === 1 ? 'day' : 'days',
  sub: todayMinutes > 0 ? `${todayMinutes} min today` : 'nothing today',
  tip: 'Consecutive days with a practice session.',
});

const buildWeekTile = (weekTests) => ({
  key: 'week',
  icon: Zap,
  tone: 'emerald',
  label: 'This week',
  value: weekTests,
  unit: weekTests === 1 ? 'test' : 'tests',
  sub: 'last 7 days',
  tip: 'Tests completed in the last 7 days.',
});

const buildExamTile = (daysToExam, weekTests) => {
  const hasUpcomingExam = daysToExam != null && daysToExam >= 0;
  return {
    key: 'exam',
    icon: CalendarClock,
    label: 'Exam',
    value: hasUpcomingExam ? daysToExam : '—',
    unit: hasUpcomingExam ? 'days' : null,
    sub: buildExamSub(daysToExam, weekTests),
    href: !hasUpcomingExam ? '/onboarding' : null,
    tip: "Days until the test date on your profile, with the rate you're practising at now.",
  };
};

const calculateGap = ({ measuredTests, target, average }) => {
  if (measuredTests <= 0 || target == null) return null;
  return Math.max(0, target - average);
};

const getExamDate = (user) => user?.test_date ?? null;

const buildStatContext = (stats) => {
  const context = {
    average: numberOrZero(stats?.avgScore),
    measuredTests: numberOrZero(stats?.measuredTests),
    target: normalizeTargetScore(stats?.targetScore),
    abandonedTests: numberOrZero(stats?.abandonedTests),
    streak: numberOrZero(stats?.streak),
    todayMinutes: numberOrZero(stats?.todayMinutes),
  };
  return { ...context, gap: calculateGap(context) };
};

export const buildStatBandModel = (stats, weeklyProgress, user) => {
  const weekTests = countWeekTests(weeklyProgress);
  const context = buildStatContext(stats);
  const examDate = getExamDate(user);
  const daysToExam = examDate == null ? null : calculateDaysUntilExam(examDate);

  return [
    buildBandTile(context),
    buildTargetTile(context),
    buildStreakTile(context),
    buildWeekTile(weekTests),
    buildExamTile(daysToExam, weekTests),
  ];
};
