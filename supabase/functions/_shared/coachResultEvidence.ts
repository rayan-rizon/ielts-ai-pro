import { writingTaskFromSession } from './learningPathV2.ts';

export function coachResult(session: any) {
  const module = String(session.test_type).toLowerCase();
  const mode = String(session.test_mode || 'practice').toLowerCase();
  const content = session.content_data || {};
  const objective = module === 'reading' || module === 'listening';
  const counts = objective ? objectiveCounts(content) : { total: null, correct: null };
  const task = module === 'writing' ? writingTaskFromSession(session) : null;
  const coverage = task ? 'task' : objectiveCoverage(counts.total);
  return {
    module,
    mode,
    score: Number(session.score),
    scoreUnit: objective ? 'practice_band_estimate' : 'ai_estimated_band',
    completedAt: session.completed_at,
    coverage,
    ...counts,
    task,
  };
}

function objectiveCounts(content: any) {
  const total = Number(content.totalQuestions);
  const inRange = total >= 1 && total <= 40;
  if (!Number.isInteger(total) || !inRange) return { total: null, correct: null };
  const correct = Number(content.correctAnswers ?? content.correct ?? NaN);
  return {
    total,
    correct: Number.isInteger(correct) && correct >= 0 && correct <= total ? correct : null,
  };
}

function objectiveCoverage(total: number | null) {
  if (total === 40) return 'full';
  return total ? 'partial' : 'unknown';
}

function hasComparableCoverage(result: ReturnType<typeof coachResult>) {
  const coverageMatches = ['full', 'task'].includes(result.coverage);
  return coverageMatches && Number.isFinite(Date.parse(result.completedAt));
}

export function completedResultEvidence(sessions: any[]) {
  const evidence: any[] = [];
  const results = sessions.map((session: any) => ({
    id: session.id,
    result: coachResult(session),
    format: session.content_data?.exam_type ?? session.content_data?.examType ?? '',
  }));
  results.slice(0, 8).forEach(({ id, result }) =>
    evidence.push({
      id: `session:${id}`,
      category: 'completed_result',
      confidence: 'measured',
      label: `${result.module} ${result.mode} result`,
      value: result,
      observedAt: result.completedAt,
    })
  );
  const comparable = new Map<string, ReturnType<typeof coachResult>[]>();
  results.forEach(({ result, format }) => {
    if (!hasComparableCoverage(result)) return;
    const key = [result.module, result.mode, result.task || 'full', String(format)].join(':');
    const group = comparable.get(key) || [];
    group.push(result);
    comparable.set(key, group);
  });
  comparable.forEach((items, key) => {
    if (items.length < 2) return;
    const [latest, previous] = items.sort(
      (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)
    );
    evidence.push({
      id: `trend:${key}`,
      category: 'comparable_trend',
      confidence: 'measured',
      label: `${latest.module} ${latest.mode}${latest.task ? ` ${latest.task}` : ''} change`,
      value: {
        latest: latest.score,
        previous: previous.score,
        delta: Number((latest.score - previous.score).toFixed(1)),
        scoreUnit: latest.scoreUnit,
        task: latest.task,
        sampleCount: items.length,
        latestAt: latest.completedAt,
        previousAt: previous.completedAt,
      },
      observedAt: latest.completedAt,
    });
  });
  return evidence;
}
