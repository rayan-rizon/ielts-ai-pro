import {
  isScoredLearningSession,
  summarizeEvidence,
  summarizeVocabularyEvidence,
} from './learningPathV2.ts';

const numberOrNull = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : null);

export function buildLearnerEvidence({
  profile,
  sessions,
  skills,
  grammarAttempts,
  vocabularyItems,
  vocabularyReviews,
  activities,
  sourceSession,
}: any) {
  const scoredSessions = (Array.isArray(sessions) ? sessions : []).filter(isScoredLearningSession);
  const skillSummary = summarizeEvidence(Array.isArray(skills) ? skills : []);
  const vocabulary = summarizeVocabularyEvidence(vocabularyItems || [], vocabularyReviews || []);
  const evidence: any[] = [];
  const subscriptionActive =
    !profile?.subscription_end_date || new Date(profile.subscription_end_date) > new Date();
  const hasLearningPathAccess =
    subscriptionActive && ['pro', 'premium'].includes(profile?.subscription_tier);

  if (profile?.target_band_score != null)
    evidence.push({
      id: 'goal:target-band',
      category: 'goal',
      confidence: 'confirmed',
      label: 'Target band',
      value: Number(profile.target_band_score),
      observedAt: profile.updated_at || null,
    });
  if (profile?.test_date)
    evidence.push({
      id: 'goal:test-date',
      category: 'goal',
      confidence: 'confirmed',
      label: 'IELTS test date',
      value: profile.test_date,
      observedAt: profile.updated_at || null,
    });
  if (profile?.exam_type)
    evidence.push({
      id: 'goal:exam-type',
      category: 'goal',
      confidence: 'confirmed',
      label: 'IELTS exam type',
      value: String(profile.exam_type),
      observedAt: profile.updated_at || null,
    });
  if (profile?.study_availability || profile?.study_hours_goal != null)
    evidence.push({
      id: 'goal:availability',
      category: 'goal',
      confidence: 'confirmed',
      label: 'Study availability',
      value: {
        weeklyHours: numberOrNull(profile.study_hours_goal),
        schedule: profile.study_availability || null,
      },
      observedAt: profile.updated_at || null,
    });

  scoredSessions.slice(0, 8).forEach((session: any) =>
    evidence.push({
      id: `session:${session.id}`,
      category: 'completed_result',
      confidence: 'measured',
      label: `${String(session.test_type || 'IELTS')} ${String(session.test_mode || 'practice')} result`,
      value: {
        score: numberOrNull(session.score ?? session.band_score),
        completedAt: session.completed_at,
      },
      observedAt: session.completed_at,
    })
  );
  const comparable = new Map<string, any[]>();
  scoredSessions.forEach((session: any) => {
    const key = `${String(session.test_type || '').toLowerCase()}:${String(session.test_mode || 'practice').toLowerCase()}`;
    comparable.set(key, [...(comparable.get(key) || []), session]);
  });
  comparable.forEach((items, key) => {
    if (items.length < 2) return;
    const [latest, previous] = [...items].sort(
      (a, b) => Date.parse(b.completed_at || '') - Date.parse(a.completed_at || '')
    );
    const latestScore = numberOrNull(latest.score ?? latest.band_score);
    const previousScore = numberOrNull(previous.score ?? previous.band_score);
    if (latestScore == null || previousScore == null) return;
    evidence.push({
      id: `trend:${key}`,
      category: 'comparable_trend',
      confidence: 'measured',
      label: `${key.replace(':', ' ')} score change`,
      value: {
        latest: latestScore,
        previous: previousScore,
        delta: Number((latestScore - previousScore).toFixed(1)),
      },
      observedAt: latest.completed_at,
    });
  });
  skillSummary.measured_priorities.slice(0, 6).forEach((skill: any) =>
    evidence.push({
      id: `skill:${skill.skill_code}`,
      category: 'measured_skill',
      confidence: 'measured',
      label: skill.skill_code,
      value: { mastery: skill.mastery, observations: skill.observations, module: skill.module },
      observedAt: skill.next_review_at || null,
    })
  );
  skillSummary.early_signals.slice(0, 4).forEach((skill: any) =>
    evidence.push({
      id: `skill:${skill.skill_code}`,
      category: 'early_skill',
      confidence: 'tentative',
      label: skill.skill_code,
      value: { mastery: skill.mastery, observations: skill.observations, module: skill.module },
      observedAt: null,
    })
  );
  if ((grammarAttempts || []).length) {
    const attempt = grammarAttempts[0];
    evidence.push({
      id: `grammar:${attempt.id}`,
      category: 'grammar_practice',
      confidence: 'measured',
      label: 'Latest completed Grammar Lab practice',
      value: {
        correct: attempt.correct_count,
        total: attempt.total_questions,
        skills: attempt.target_skills || [],
      },
      observedAt: attempt.completed_at || attempt.updated_at,
    });
  }
  if (vocabulary?.due_count || vocabulary?.reviews_30d)
    evidence.push({
      id: 'vocabulary:summary',
      category: 'vocabulary_review',
      confidence: 'measured',
      label: 'Vocabulary review summary',
      value: vocabulary,
      observedAt: vocabularyReviews?.[0]?.reviewed_at || null,
    });
  if (hasLearningPathAccess)
    (activities || [])
      .filter((item: any) => !item.is_completed)
      .slice(0, 5)
      .forEach((item: any) =>
        evidence.push({
          id: `plan:${item.id}`,
          category: 'planned_activity',
          confidence: 'confirmed',
          label: item.title,
          value: {
            module: item.module,
            type: item.activity_type,
            skills: item.skill_targets || [],
            scheduledDate: item.scheduled_date,
          },
          observedAt: item.scheduled_date,
        })
      );

  const eligibleActions: any[] = [
    { type: 'navigate', label: 'Open Reading practice', payload: { route: '/reading' } },
    { type: 'navigate', label: 'Open Writing practice', payload: { route: '/writing' } },
    { type: 'navigate', label: 'Open Listening practice', payload: { route: '/listening' } },
    { type: 'navigate', label: 'Open Speaking practice', payload: { route: '/speaking' } },
    { type: 'navigate', label: 'Open Grammar Lab', payload: { route: '/grammar' } },
    { type: 'navigate', label: 'Open Vocabulary', payload: { route: '/vocabulary' } },
    { type: 'navigate', label: 'Open Practice Lab', payload: { route: '/practice-lab' } },
  ];
  if (hasLearningPathAccess) {
    (activities || [])
      .filter((item: any) => !item.is_completed)
      .slice(0, 5)
      .forEach((item: any) => {
        eligibleActions.push({
          type: 'reschedule_activity',
          label: `Reschedule ${item.title}`,
          payload: { activityId: item.id, currentDate: item.scheduled_date, title: item.title },
        });
      });
  }
  if (hasLearningPathAccess)
    eligibleActions.push({
      type: 'navigate',
      label: 'Open AI Learning Path',
      payload: { route: '/learning-path' },
    });

  let source = null;
  if (sourceSession && isScoredLearningSession(sourceSession)) {
    source = {
      id: sourceSession.id,
      evidenceId: `source:${sourceSession.id}`,
      testType: sourceSession.test_type,
      testMode: sourceSession.test_mode,
      completed: sourceSession.is_completed,
      score: numberOrNull(sourceSession.score ?? sourceSession.band_score),
      excerpt: JSON.stringify(sourceSession.content_data || {}).slice(0, 3000),
    };
  }
  return {
    evidence,
    eligibleActions,
    source,
    evidenceConfidence: skillSummary.confidence_label,
    vocabulary,
  };
}
