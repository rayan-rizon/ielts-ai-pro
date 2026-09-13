import { getWeeklyCapacity } from '../../../../../supabase/functions/_shared/learningPathV2';

const FOCUS_LABELS = {
  reading: 'Reading',
  writing: 'Writing',
  listening: 'Listening',
  speaking: 'Speaking',
};

export function buildOnboardingPlanPreview(formData = {}) {
  const weeklyMinutes = getWeeklyCapacity(formData.study_availability);
  const studyDays = Object.values(formData.study_availability?.days || {}).filter(
    (minutes) => Number(minutes) >= 20
  ).length;
  const focusLabel = FOCUS_LABELS[formData.weak_area] || 'IELTS';
  const targetBand = Number(formData.target_band_score || 7);

  return {
    focusLabel,
    targetBand,
    weeklyMinutes,
    studyDays,
    timelineLabel: formData.test_date
      ? 'Confirmed exam date'
      : formData.estimated_weeks
        ? `${formData.estimated_weeks}-week timeline`
        : 'Flexible timeline',
    planItems: [
      {
        label: `${focusLabel} level check`,
        detail: 'Starts by measuring your chosen focus before calling it a weakness.',
      },
      {
        label: 'Balanced four-skill practice',
        detail: 'Keeps Reading, Writing, Listening, and Speaking active around your priority.',
      },
      {
        label: 'Evidence-led skill repair',
        detail: 'Scored results can route you to the right Grammar or Practice Lab activity.',
      },
    ],
  };
}
