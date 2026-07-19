import { formatBand, calculateImprovement, calculateScoreForecast } from '../utils';

export const MODULES = ['reading', 'writing', 'listening', 'speaking'];
export const MAX_REASONABLE_TEST_SECONDS = 4 * 60 * 60;
export const PACING_BENCHMARK_MINUTES = {
  reading: 60,
  writing: 60,
  listening: 40,
  speaking: 15,
};

export function isValidBandScore(score) {
  const value = Number(score);
  return Number.isFinite(value) && value >= 0 && value <= 9;
}

export function toValidBandScore(score) {
  return isValidBandScore(score) ? Number(score) : null;
}

export function nonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function isValidDuration(seconds) {
  return Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_REASONABLE_TEST_SECONDS;
}

function extractDurationFromMinutes(session) {
  const m = Number(session.duration_minutes) * 60;
  return isValidDuration(m) ? m : null;
}

function extractDurationFromMetrics(session) {
  const content = session.content_data || {};
  const tm = content.timeMetrics || {};
  const es = Number(tm.totalTimeSpent);
  return isValidDuration(es) ? es : null;
}

function extractDurationFromDates(session) {
  if (!session.created_at || !session.completed_at) return null;
  const diff =
    (new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 1000;
  return isValidDuration(diff) ? diff : null;
}

export function getKnownDurationSeconds(session) {
  if (!session) return null;
  const minDur = extractDurationFromMinutes(session);
  if (minDur !== null) return minDur;
  const metDur = extractDurationFromMetrics(session);
  if (metDur !== null) return metDur;
  return extractDurationFromDates(session);
}

export function getRecordedDurationSeconds(session) {
  if (!session) return null;
  const metricDuration = extractDurationFromMetrics(session);
  if (metricDuration !== null) return metricDuration;

  const type = String(session.test_type || '').toLowerCase();
  const benchmarkMinutes = PACING_BENCHMARK_MINUTES[type];
  const remaining = Number(session.content_data?.time_remaining);
  if (benchmarkMinutes && Number.isFinite(remaining) && remaining >= 0) {
    const elapsed = benchmarkMinutes * 60 - remaining;
    if (isValidDuration(elapsed)) return elapsed;
  }

  // Pace needs an explicit test duration. A created-to-completed timestamp span can
  // include pauses or background time, so it is suitable for study totals but not
  // for comparing a learner with the test clock.
  return extractDurationFromMinutes(session);
}

export function filterSessionsByTimeframe(rawSessions, selectedTimeframe) {
  const now = new Date();
  let startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (selectedTimeframe === '7d') {
    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (selectedTimeframe === '90d') {
    startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (selectedTimeframe === 'all') {
    startTime = new Date(0);
  }

  return rawSessions.filter(
    (s) => s.is_completed && new Date(s.completed_at || s.created_at) >= startTime
  );
}

export function getPreviousSessions(rawSessions, selectedTimeframe) {
  if (selectedTimeframe === 'all') return [];

  const now = new Date();
  let startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let previousStartTime = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  if (selectedTimeframe === '7d') {
    startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    previousStartTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  } else if (selectedTimeframe === '90d') {
    startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    previousStartTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  }

  return rawSessions.filter((s) => {
    const d = new Date(s.completed_at || s.created_at);
    return s.is_completed && d >= previousStartTime && d < startTime;
  });
}

function calculateHoursFromSessions(sessions) {
  const totalSeconds = (sessions || []).reduce((sum, s) => {
    const duration = getKnownDurationSeconds(s);
    return duration === null ? sum : sum + duration;
  }, 0);
  return Math.round(totalSeconds / 3600);
}

function getLatestModuleScores(scoredSessions) {
  return MODULES.map((type) => {
    const typeSessions = scoredSessions.filter(
      (s) => String(s.test_type || '').toLowerCase() === type
    );
    return typeSessions.length > 0 ? Number(typeSessions[0].score) : null;
  }).filter((s) => s !== null);
}

export function computeStats(filteredSessions, previousSessions, authUser, vocabCount) {
  const totalTests = filteredSessions.length;
  const scoredSessions = filteredSessions.filter((s) => isValidBandScore(s.score));

  const avgScoreNum =
    scoredSessions.length > 0
      ? scoredSessions.reduce((sum, s) => sum + Number(s.score), 0) / scoredSessions.length
      : 0;

  const studyHours = calculateHoursFromSessions(filteredSessions);
  const prevStudyHours = calculateHoursFromSessions(previousSessions);

  let studyHoursTrend = 0;
  if (prevStudyHours > 0) {
    studyHoursTrend = Math.round(((studyHours - prevStudyHours) / prevStudyHours) * 100);
  } else if (studyHours > 0) {
    studyHoursTrend = 100;
  }

  const improvement = calculateImprovement(scoredSessions);
  const moduleLatestScores = getLatestModuleScores(scoredSessions);

  const predictedOverallBand =
    moduleLatestScores.length > 0
      ? Math.round(
          (moduleLatestScores.reduce((sum, s) => sum + s, 0) / moduleLatestScores.length) * 2
        ) / 2
      : null;

  return {
    avgScore: formatBand(avgScoreNum),
    targetScore: authUser?.target_band_score || 7.0,
    totalTests,
    scoredTests: scoredSessions.length,
    studyHours,
    studyHoursTrend,
    vocabCount,
    improvement: improvement > 0 ? `+${formatBand(improvement)}` : formatBand(improvement),
    predictedOverallBand,
    modulesWithData: moduleLatestScores.length,
  };
}

export function computeModuleStats(filteredSessions) {
  return MODULES.map((type) => {
    const sessions = filteredSessions.filter(
      (s) => String(s.test_type || '').toLowerCase() === type && isValidBandScore(s.score)
    );
    const currentAvg =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + Number(s.score), 0) / sessions.length
        : 0;

    const recentScores = sessions.slice(0, 5).map((s) => Number(s.score));
    const highest = sessions.length > 0 ? Math.max(...sessions.map((s) => Number(s.score))) : 0;

    return {
      type,
      avg: currentAvg,
      count: sessions.length,
      lastScore: sessions[0]?.score ?? 0,
      highest,
      sessions,
      recentScores,
    };
  });
}

function processTypeStats(content, aggState) {
  if (!content.typeStats) return;
  Object.entries(content.typeStats).forEach(([qType, qStats]) => {
    if (!aggState.allTypeStats[qType]) aggState.allTypeStats[qType] = { correct: 0, total: 0 };
    aggState.allTypeStats[qType].correct += qStats.correct || 0;
    aggState.allTypeStats[qType].total += qStats.total || 0;
  });
}

function processSectionStats(content, aggState) {
  if (!content.sectionStats) return;
  content.sectionStats.forEach((secStats, idx) => {
    const secKey = `Passage/Part ${idx + 1}`;
    if (!aggState.allSectionStats[secKey])
      aggState.allSectionStats[secKey] = { correct: 0, total: 0 };
    aggState.allSectionStats[secKey].correct += secStats.correct || 0;
    aggState.allSectionStats[secKey].total += secStats.total || 0;
  });
}

function processTimeMetrics(content, aggState, sessionBrief) {
  if (!content.timeMetrics) return;
  const rushed = nonNegativeCount(content.timeMetrics.rushedQuestions);
  const overanalyzed = nonNegativeCount(content.timeMetrics.overanalyzedQuestions);
  const trackedSeconds = Number(content.timeMetrics.totalTimeSpent);

  aggState.enhancedMetricsAgg.totalRushedQuestions += rushed;
  aggState.enhancedMetricsAgg.totalOveranalyzedQuestions += overanalyzed;
  if (isValidDuration(trackedSeconds)) {
    aggState.enhancedMetricsAgg.totalTimeSpent += trackedSeconds;
  }
  aggState.enhancedMetricsAgg.sessionCount += 1;

  if (rushed > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.rushed.push({ ...sessionBrief, count: rushed });
  }
  if (overanalyzed > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.overanalyzed.push({
      ...sessionBrief,
      count: overanalyzed,
    });
  }
}

function processErrorPatterns(content, aggState, sessionBrief) {
  if (!content.errorPatterns) return;
  const nearMisses = nonNegativeCount(content.errorPatterns.nearMissCount);
  const unanswered = nonNegativeCount(content.errorPatterns.unansweredCount);

  aggState.enhancedMetricsAgg.totalNearMisses += nearMisses;
  aggState.enhancedMetricsAgg.totalUnanswered += unanswered;

  if (nearMisses > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.nearMisses.push({
      ...sessionBrief,
      count: nearMisses,
    });
  }
  if (unanswered > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.unanswered.push({
      ...sessionBrief,
      count: unanswered,
    });
  }

  (content.errorPatterns.troubleTypes || []).forEach((tt) => {
    aggState.enhancedMetricsAgg.troubleTypesFrequency[tt] =
      (aggState.enhancedMetricsAgg.troubleTypesFrequency[tt] || 0) + 1;
  });
}

function processSkillGaps(content, aggState) {
  if (!content.skillGaps) return;
  Object.entries(content.skillGaps).forEach(([skill, score]) => {
    const skillMap = {
      detailRetention: 'Remembering Details',
      paraphrasingRecognition: 'Finding Similar Words',
      logicalReasoning: 'Smart Thinking',
      scanningEfficiency: 'Reading Speed',
      globalComprehension: 'Main Idea',
    };
    const friendlyName = skillMap[skill] || skill;
    if (score >= 0 && aggState.enhancedMetricsAgg.skillGapsTotals[friendlyName]) {
      aggState.enhancedMetricsAgg.skillGapsTotals[friendlyName].sum += score;
      aggState.enhancedMetricsAgg.skillGapsTotals[friendlyName].count += 1;
    }
  });
}

function processModuleEfficiency(s, type, aggState) {
  const durationSeconds = getRecordedDurationSeconds(s);
  const isValidModule = Boolean(type) && aggState.moduleEfficiency[type] !== undefined;

  if (isValidModule && durationSeconds !== null) {
    aggState.moduleEfficiency[type] += durationSeconds / 60;
    aggState.moduleEfficiencyCount[type] += 1;
  }
}

function processSessionContent(s, aggState) {
  if (!s) return;
  const content = s.content_data || {};
  const type = String(s.test_type || '').toLowerCase();
  const ep = content.errorPatterns || {};

  const sessionBrief = {
    id: s.id,
    date: s.completed_at || s.created_at,
    type: s.test_type,
    score: s.score,
    troubleTypes: ep.troubleTypes || [],
  };

  processTypeStats(content, aggState);
  processSectionStats(content, aggState);
  processModuleEfficiency(s, type, aggState);
  processTimeMetrics(content, aggState, sessionBrief);
  processErrorPatterns(content, aggState, sessionBrief);
  processSkillGaps(content, aggState);
}

function getFeedbackScores(fbs, taskName) {
  const task = fbs[taskName] || {};
  return task.criteriaScores || task.criteria_scores || {};
}

function extractTaskScore(t1, t2, key1, key2) {
  const val2 = t2[key1] || t2[key2];
  if (val2) return val2;
  return t1[key1] || t1[key2] || 0;
}

function hasAnyKeys(obj1, obj2, obj3) {
  return (
    Object.keys(obj1).length > 0 || Object.keys(obj2).length > 0 || Object.keys(obj3).length > 0
  );
}

function extractFinalWritingScore(ctx, directKey, fbKey1, fbKey2) {
  const v1 = ctx.cs[directKey];
  if (v1) return Number(v1);
  const fbScore = extractTaskScore(ctx.t1, ctx.t2, fbKey1, fbKey2);
  return fbScore ? Number(fbScore) : 0;
}

function processWritingCriteria(content, aggState) {
  const cs = content.criteriaScores || {};
  const fbs = content.ai_feedbacks || {};
  const t1 = getFeedbackScores(fbs, 'Task 1');
  const t2 = getFeedbackScores(fbs, 'Task 2');

  if (!hasAnyKeys(cs, t1, t2)) return;

  const ctx = { cs, t1, t2 };

  const updateAgg = (key, val) => {
    if (val > 0) {
      aggState.writingCriteriaAgg[key].sum += val;
      aggState.writingCriteriaAgg[key].count += 1;
    }
  };

  updateAgg(
    'taskAchievement',
    extractFinalWritingScore(ctx, 'taskAchievement', 'TaskAchievement', 'task_achievement')
  );
  updateAgg(
    'coherence',
    extractFinalWritingScore(ctx, 'coherence', 'Coherence & Cohesion', 'CoherenceAndCohesion')
  );
  updateAgg(
    'lexicalResource',
    extractFinalWritingScore(ctx, 'lexicalResource', 'Lexical Resource', 'LexicalResource')
  );
  updateAgg(
    'grammar',
    extractFinalWritingScore(
      ctx,
      'grammar',
      'GrammaticalRangeAndAccuracy',
      'Grammatical Range & Accuracy'
    )
  );
}

function processSpeakingCriteria(content, aggState) {
  const cs = content.criteriaScores || {};
  const evalCs = content.finalEvaluation || {};

  const hasData = Object.keys(cs).length > 0 || Object.keys(evalCs).length > 0;
  if (!hasData) return;

  const getScore = (key1, key2) => Number(cs[key1] || evalCs[key2]) || 0;

  const updateAgg = (key, val) => {
    if (val > 0) {
      aggState.speakingCriteriaAgg[key].sum += val;
      aggState.speakingCriteriaAgg[key].count++;
    }
  };

  updateAgg('fluency', getScore('fluency', 'fluency'));
  updateAgg('lexicalResource', getScore('lexicalResource', 'lexical'));
  updateAgg('grammar', getScore('grammar', 'grammar'));
  updateAgg('pronunciation', getScore('pronunciation', 'pronunciation'));
}

function processCriteriaScores(s, aggState) {
  if (!s) return;
  const content = s.content_data || {};
  const type = String(s.test_type || '').toLowerCase();

  if (type === 'writing') {
    processWritingCriteria(content, aggState);
  } else if (type === 'speaking') {
    processSpeakingCriteria(content, aggState);
  }
}

function buildInitialAggState() {
  return {
    allTypeStats: {},
    allSectionStats: {},
    moduleEfficiency: { reading: 0, writing: 0, listening: 0, speaking: 0 },
    moduleEfficiencyCount: { reading: 0, writing: 0, listening: 0, speaking: 0 },
    enhancedMetricsAgg: {
      totalRushedQuestions: 0,
      totalOveranalyzedQuestions: 0,
      totalTimeSpent: 0,
      sessionCount: 0,
      troubleTypesFrequency: {},
      totalNearMisses: 0,
      totalUnanswered: 0,
      sessionReferences: { rushed: [], overanalyzed: [], nearMisses: [], unanswered: [] },
      skillGapsTotals: {
        'Remembering Details': { sum: 0, count: 0 },
        'Finding Similar Words': { sum: 0, count: 0 },
        'Smart Thinking': { sum: 0, count: 0 },
        'Reading Speed': { sum: 0, count: 0 },
        'Main Idea': { sum: 0, count: 0 },
      },
    },
    writingCriteriaAgg: {
      taskAchievement: { sum: 0, count: 0 },
      coherence: { sum: 0, count: 0 },
      lexicalResource: { sum: 0, count: 0 },
      grammar: { sum: 0, count: 0 },
    },
    speakingCriteriaAgg: {
      fluency: { sum: 0, count: 0 },
      lexicalResource: { sum: 0, count: 0 },
      grammar: { sum: 0, count: 0 },
      pronunciation: { sum: 0, count: 0 },
    },
  };
}

function computeTypeAccuracy(aggState) {
  return Object.entries(aggState.allTypeStats)
    .map(([type, stats]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
}

function computeSectionPerformance(aggState) {
  return Object.entries(aggState.allSectionStats)
    .map(([section, stats]) => ({
      section,
      accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
    }))
    .sort((a, b) => a.section.localeCompare(b.section));
}

function computeEfficiency(aggState) {
  const efficiency = {};
  MODULES.forEach((m) => {
    efficiency[m] =
      aggState.moduleEfficiencyCount[m] > 0
        ? Math.round(aggState.moduleEfficiency[m] / aggState.moduleEfficiencyCount[m])
        : 0;
  });
  return efficiency;
}

export function getSessionAccuracy(content) {
  const c = content || {};
  const correct = Number(c.correct ?? c.correctAnswers);
  const total = Number(c.total ?? c.totalQuestions);
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct < 0) {
    return null;
  }
  return Math.round((Math.min(correct, total) / total) * 100);
}

function extractPaceData(s) {
  const content = s.content_data || {};
  return {
    id: s.id,
    date: s.completed_at || s.created_at,
    type: s.test_type,
    rushed: nonNegativeCount(content.timeMetrics?.rushedQuestions),
    overanalyzed: nonNegativeCount(content.timeMetrics?.overanalyzedQuestions),
    accuracy: getSessionAccuracy(content),
    score: toValidBandScore(s.score) || 0,
  };
}

function computePaceData(filteredSessions) {
  return filteredSessions
    .map(extractPaceData)
    .filter((d) => d.accuracy !== null && (d.rushed > 0 || d.overanalyzed > 0));
}

export function buildPacingSummary(efficiency = {}) {
  return MODULES.map((type) => {
    const rawAverage = Number(efficiency[type]);
    const averageMinutes =
      Number.isFinite(rawAverage) && rawAverage > 0 ? Math.round(rawAverage) : null;
    const benchmarkMinutes = PACING_BENCHMARK_MINUTES[type];
    return {
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      averageMinutes,
      benchmarkMinutes,
      deltaMinutes: averageMinutes === null ? null : averageMinutes - benchmarkMinutes,
    };
  });
}

function computeEnhancedMetricsResult(aggState, paceData) {
  const tNearMisses = aggState.enhancedMetricsAgg.totalNearMisses;
  const tRushed = aggState.enhancedMetricsAgg.totalRushedQuestions;
  const tOveranalyzed = aggState.enhancedMetricsAgg.totalOveranalyzedQuestions;
  const tUnanswered = aggState.enhancedMetricsAgg.totalUnanswered;

  return {
    hasData: aggState.enhancedMetricsAgg.sessionCount > 0,
    paceData,
    avgTimePerSession:
      aggState.enhancedMetricsAgg.sessionCount > 0
        ? Math.round(
            aggState.enhancedMetricsAgg.totalTimeSpent /
              aggState.enhancedMetricsAgg.sessionCount /
              60
          )
        : 0,
    totalRushed: tRushed,
    totalOveranalyzed: tOveranalyzed,
    totalNearMisses: tNearMisses,
    totalUnanswered: tUnanswered,
    sessionReferences: aggState.enhancedMetricsAgg.sessionReferences,
    errorAuditData: [
      { name: 'Almost Correct', value: tNearMisses, color: 'hsl(var(--primary))' },
      { name: 'Rushing', value: tRushed, color: 'hsl(var(--rose-500))' },
      { name: 'Thinking Too Long', value: tOveranalyzed, color: 'hsl(var(--amber-500))' },
      { name: 'Left Blank', value: tUnanswered, color: 'hsl(var(--muted-foreground))' },
    ].filter((d) => d.value > 0),
    topTroubleTypes: Object.entries(aggState.enhancedMetricsAgg.troubleTypesFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type),
    skillGaps: Object.entries(aggState.enhancedMetricsAgg.skillGapsTotals)
      .map(([skill, data]) => ({
        skill,
        avg: data.count > 0 ? Math.round(data.sum / data.count) : -1,
      }))
      .filter((s) => s.avg >= 0)
      .sort((a, b) => a.avg - b.avg),
  };
}

function getCriteriaAverages(aggState) {
  const avgCriteria = (agg) => (agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : null);

  const writingCriteria = {
    taskAchievement: avgCriteria(aggState.writingCriteriaAgg.taskAchievement),
    coherence: avgCriteria(aggState.writingCriteriaAgg.coherence),
    lexicalResource: avgCriteria(aggState.writingCriteriaAgg.lexicalResource),
    grammar: avgCriteria(aggState.writingCriteriaAgg.grammar),
    hasData: Object.values(aggState.writingCriteriaAgg).some((v) => v.count > 0),
  };

  const speakingCriteria = {
    fluency: avgCriteria(aggState.speakingCriteriaAgg.fluency),
    lexicalResource: avgCriteria(aggState.speakingCriteriaAgg.lexicalResource),
    grammar: avgCriteria(aggState.speakingCriteriaAgg.grammar),
    pronunciation: avgCriteria(aggState.speakingCriteriaAgg.pronunciation),
    hasData: Object.values(aggState.speakingCriteriaAgg).some((v) => v.count > 0),
  };

  return { writingCriteria, speakingCriteria };
}

export function computeAdvancedMetrics(filteredSessions) {
  const aggState = buildInitialAggState();

  filteredSessions.forEach((s) => {
    processSessionContent(s, aggState);
    processCriteriaScores(s, aggState);
  });

  const typeAccuracy = computeTypeAccuracy(aggState);
  const sectionPerformance = computeSectionPerformance(aggState);
  const efficiency = computeEfficiency(aggState);
  const paceData = computePaceData(filteredSessions);

  const enhancedMetrics = computeEnhancedMetricsResult(aggState, paceData);
  const { writingCriteria, speakingCriteria } = getCriteriaAverages(aggState);

  return {
    typeAccuracy,
    sectionPerformance,
    efficiency,
    enhancedMetrics,
    writingCriteria,
    speakingCriteria,
  };
}

function addStrengthInsight(insightsObj, m) {
  if (m.avg >= 7.0) {
    insightsObj.strengths.push({
      type: m.type,
      text: `Strong performance in ${m.type} (Avg: ${formatBand(m.avg)})`,
    });
  }
}

function addImprovementInsight(insightsObj, m) {
  if (m.avg <= 5.5) {
    insightsObj.improvements.push({
      type: m.type,
      text: `${m.type} needs attention (Avg: ${formatBand(m.avg)})`,
    });
    insightsObj.recommendations.push({
      type: m.type,
      text: `Try 15 mins of daily ${m.type} practice to boost your score.`,
      gain: 0.3,
    });
  }
}

function addTrendInsight(insightsObj, m) {
  const sessions = m.sessions || [];
  if (sessions.length < 3) return;

  const scores = sessions.slice(0, 3).map((s) => Number(s.score) || 0);
  const isRising = scores[0] > scores[1] && scores[1] >= scores[2];
  const isFalling = scores[0] < scores[1] && scores[1] <= scores[2];

  if (isRising) {
    insightsObj.trends.push({
      type: 'positive',
      text: `Your ${m.type} score is consistently improving.`,
    });
  }
  if (isFalling) {
    insightsObj.trends.push({ type: 'negative', text: `Recent dip in ${m.type} scores detected.` });
  }
}

function generateModuleInsights(moduleStats, insightsObj) {
  moduleStats.forEach((m) => {
    if (m.count === 0) return;
    addStrengthInsight(insightsObj, m);
    addImprovementInsight(insightsObj, m);
    addTrendInsight(insightsObj, m);
  });
}

function generateCorrelations(advancedMetrics, correlations) {
  const { enhancedMetrics } = advancedMetrics;
  const { errorAuditData, topTroubleTypes } = enhancedMetrics;

  const rushedCount = errorAuditData.find((d) => d.name === 'Rushing')?.value || 0;
  if (topTroubleTypes.includes('Vocabulary') && rushedCount > 5) {
    correlations.push({
      id: 'rushed-vocab',
      title: 'Speed Impact',
      text: 'Your rushed pace is causing vocabulary-related slips. Slow down for better precision.',
      impact: 'High',
    });
  }

  const overanalyzedCount = errorAuditData.find((d) => d.name === 'Thinking Too Long')?.value || 0;
  if (overanalyzedCount > 3) {
    correlations.push({
      id: 'overanalysis',
      title: 'Decision Fatigue',
      text: 'Frequent overanalysis is costing you precious time in later sections.',
      impact: 'Medium',
    });
  }
}

function calculatePredictedScore(avgScoreStr, improvementStr) {
  let predictedScore = parseFloat(avgScoreStr);
  if (!isNaN(predictedScore)) {
    const improvementVal = parseFloat(improvementStr.replace('+', ''));
    if (improvementVal > 0) predictedScore += 0.5;
    if (improvementVal < 0) predictedScore -= 0.2;
    return Math.max(0, Math.min(9, predictedScore));
  }
  return 0;
}

export function computeInsights(moduleStats, advancedMetrics, avgScoreStr, improvementStr) {
  const insightsObj = {
    strengths: [],
    improvements: [],
    trends: [],
    recommendations: [],
    correlations: [],
  };

  generateModuleInsights(moduleStats, insightsObj);
  generateCorrelations(advancedMetrics, insightsObj.correlations);

  const predictedScore = calculatePredictedScore(avgScoreStr, improvementStr);

  return {
    ...insightsObj,
    predictedScore: formatBand(predictedScore),
    aiSuggestions: null,
  };
}

function computeAggregatedHistory(scoredSessions) {
  return scoredSessions
    .slice()
    .reverse()
    .reduce((acc, s) => {
      const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const existing = acc.find((item) => item.date === dateStr);
      if (existing) {
        const newCount = existing.count + 1;
        existing.score = Number(
          ((existing.score * existing.count + Number(s.score)) / newCount).toFixed(1)
        );
        existing.count = newCount;
      } else {
        acc.push({ date: dateStr, score: Number(s.score), type: s.test_type, count: 1 });
      }
      return acc;
    }, []);
}

function computeModuleHistory(scoredSessions) {
  const moduleHistory = {};
  MODULES.forEach((mType) => {
    moduleHistory[mType] = scoredSessions
      .filter((s) => String(s.test_type || '').toLowerCase() === mType)
      .slice()
      .reverse()
      .reduce((acc, s) => {
        const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        const existing = acc.find((item) => item.date === dateStr);
        if (existing) {
          const newCount = existing.count + 1;
          existing.score = Number(
            ((existing.score * existing.count + Number(s.score)) / newCount).toFixed(1)
          );
          existing.count = newCount;
        } else {
          acc.push({ date: dateStr, score: Number(s.score), count: 1 });
        }
        return acc;
      }, []);
  });
  return moduleHistory;
}

function getPracticeTitle(session) {
  const relation = session.passage || session.passages;
  const relatedPassage = Array.isArray(relation) ? relation[0] : relation;
  const content = session.content_data || {};
  const title =
    relatedPassage?.title ||
    relatedPassage?.cambridge_title ||
    content.title ||
    content.testTitle ||
    content.topic;
  if (typeof title === 'string' && title.trim()) return title.trim();
  const type = String(session.test_type || 'Practice').toLowerCase();
  return `${type.charAt(0).toUpperCase() + type.slice(1)} practice`;
}

export function computeRecentPractice(filteredSessions) {
  return filteredSessions.map((session) => {
    const durationSeconds = getRecordedDurationSeconds(session);
    const durationMinutes =
      durationSeconds === null ? null : Math.max(1, Math.round(durationSeconds / 60));
    const content = session.content_data || {};
    const score = toValidBandScore(session.score);
    return {
      id: session.id,
      type: String(session.test_type || '').toLowerCase(),
      title: getPracticeTitle(session),
      score,
      accuracy: getSessionAccuracy(content),
      durationMinutes,
      date: session.completed_at || session.created_at,
      passageId: session.passage_id || content.passage_id || content.id || null,
      resultData: {
        ...content,
        bandScore: score,
        score,
        durationMinutes,
      },
    };
  });
}

function computeDistribution(moduleStats) {
  return moduleStats
    .map((m) => ({ name: m.type.charAt(0).toUpperCase() + m.type.slice(1), value: m.count }))
    .filter((d) => d.value > 0);
}

export function computeChartData(filteredSessions, moduleStats, avgScoreStr, targetScore) {
  const scoredSessions = filteredSessions.filter((s) => isValidBandScore(s.score));

  const history = computeAggregatedHistory(scoredSessions);
  const pie = computeDistribution(moduleStats);
  const moduleHistory = computeModuleHistory(scoredSessions);
  const forecast = calculateScoreForecast(scoredSessions, avgScoreStr, targetScore);
  const recentPractice = computeRecentPractice(filteredSessions);

  return { history, pie, moduleHistory, forecast, recentPractice };
}
