import React, { useMemo } from 'react';
import { CalendarClock, Flag, Flame, Target, Zap } from 'lucide-react';
import { calculateDaysUntilExam } from '@/services/adaptiveLearningService';
import { Stat } from './primitives';

/**
 * The five numbers worth knowing before anything else on the page.
 *
 * Every value is derived from real practice data — where a number isn't
 * available yet the tile shows an em dash and says why, rather than a zero that
 * looks like a measurement.
 */
const StatBand = React.memo(({ stats, weeklyProgress, user }) => {
  const weekTests = useMemo(
    () =>
      (Array.isArray(weeklyProgress) ? weeklyProgress : []).reduce(
        (sum, day) => sum + (Number(day?.tests) || 0),
        0
      ),
    [weeklyProgress]
  );

  const avg = Number(stats?.avgScore) || 0;
  const target = Number(stats?.targetScore) || 7;
  const totalTests = Number(stats?.totalTests) || 0;
  const streak = Number(stats?.streak) || 0;
  const todayMinutes = Number(stats?.todayMinutes) || 0;
  const gap = avg > 0 ? Math.max(0, target - avg) : null;
  const daysToExam = user?.test_date ? calculateDaysUntilExam(user.test_date) : null;

  // Both halves are measured, not projected: weeks actually left, and the rate
  // this student is actually practising at. The dashboard states the two facts
  // and lets the student draw the conclusion.
  const examSub = useMemo(() => {
    if (daysToExam == null) return 'no date set';
    if (daysToExam < 0) return 'test date passed';
    if (daysToExam === 0) return 'test is today';
    const weeks = Math.floor(daysToExam / 7);
    const pace = weekTests > 0 ? `${weekTests}/wk now` : 'no tests this week';
    return weeks >= 1 ? `${weeks} wk left · ${pace}` : `${pace}`;
  }, [daysToExam, weekTests]);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <Stat
        size="sm"
        icon={Target}
        label="Band average"
        value={avg > 0 ? avg.toFixed(1) : '—'}
        sub={totalTests > 0 ? `across ${totalTests} tests` : 'no tests yet'}
        tip="Your mean band across every scored test."
      />

      <Stat
        size="sm"
        icon={Flag}
        label="To target"
        value={gap != null ? gap.toFixed(1) : '—'}
        unit={gap != null ? 'bands' : null}
        sub={`target ${target.toFixed(1)}`}
        tip="Gap between your average and target band."
      />

      <Stat
        size="sm"
        icon={Flame}
        tone="amber"
        label="Streak"
        value={streak}
        unit={streak === 1 ? 'day' : 'days'}
        sub={todayMinutes > 0 ? `${todayMinutes} min today` : 'nothing today'}
        tip="Consecutive days with a practice session."
      />

      <Stat
        size="sm"
        icon={Zap}
        tone="emerald"
        label="This week"
        value={weekTests}
        unit={weekTests === 1 ? 'test' : 'tests'}
        sub="last 7 days"
        tip="Tests completed in the last 7 days."
      />

      <Stat
        size="sm"
        icon={CalendarClock}
        label="Exam"
        value={daysToExam != null && daysToExam >= 0 ? daysToExam : '—'}
        unit={daysToExam != null && daysToExam >= 0 ? 'days' : null}
        sub={examSub}
        tip="Days until the test date on your profile, with the rate you're practising at now."
      />
    </div>
  );
});

StatBand.displayName = 'StatBand';

export default StatBand;
