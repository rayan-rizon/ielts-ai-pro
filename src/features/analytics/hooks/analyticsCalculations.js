import { formatBand, calculateImprovement } from '../utils';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

export const MODULES = ['reading', 'writing', 'listening', 'speaking'];
export const MAX_REASONABLE_TEST_SECONDS = 4 * 60 * 60;
export const PACING_BENCHMARK_MINUTES = {
  reading: 60,
  writing: 60,
  listening: 40,
  speaking: 15,
};

export function isValidBandScore(score) {
  if (score === null || score === undefined || score === '') return false;
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

/**
 * A test the learner opened and walked away from, not a test they sat and failed.
 *
 * Roughly a third of "completed" reading sessions in production are band 0 with
 * zero correct answers and under five minutes on the clock — a learner clicking
 * submit to get out of the test, not a measurement of their reading. Averaging
 * them in drags the practice average down by whole bands and makes Reading look
 * like the weakest module for people whose Reading is fine.
 *
 * The predicate is deliberately conservative: a zero band alone is never enough,
 * because a genuine zero is a real result. It needs a known duration under the
 * threshold AND no correct answer on record. Sessions with no timing at all are
 * left alone rather than guessed at.
 */
export const ABANDON_MAX_SECONDS = 5 * 60;

export function isAbandonedSession(session) {
  if (!session) return false;
  const score = Number(session.score);
  if (!Number.isFinite(score) || score > 0) return false;

  const content = session.content_data || {};
  const correct = Number(content.correctAnswers ?? content.correct);
  if (Number.isFinite(correct) && correct > 0) return false;

  const seconds = getKnownDurationSeconds(session);
  return seconds !== null && seconds < ABANDON_MAX_SECONDS;
}

/** Sessions that actually measure something — the basis for every average. */
export function getMeasuredSessions(sessions) {
  return (sessions || []).filter((session) => !isAbandonedSession(session));
}

function extractDurationFromMetrics(session) {
  const content = session.content_data || {};
  const tm = content.timeMetrics || {};
  const es = Number(tm.totalTimeSpent);
  return isValidDuration(es) ? es : null;
}

export function getKnownDurationSeconds(session) {
  if (!session) return null;
  const actual = Number(session.actual_duration_seconds);
  if (isValidDuration(actual)) return actual;
  const metDur = extractDurationFromMetrics(session);
  if (metDur !== null) return metDur;
  return getRecordedDurationSeconds(session);
}

export function getRecordedDurationSeconds(session) {
  if (!session) return null;
  const actual = Number(session.actual_duration_seconds);
  if (isValidDuration(actual)) return actual;
  const metricDuration = extractDurationFromMetrics(session);
  if (metricDuration !== null) return metricDuration;

  const type = String(session.test_type || '').toLowerCase();
  const benchmarkMinutes = PACING_BENCHMARK_MINUTES[type];
  const remaining = Number(session.content_data?.time_remaining);
  if (benchmarkMinutes && Number.isFinite(remaining) && remaining >= 0) {
    const elapsed = benchmarkMinutes * 60 - remaining;
    if (isValidDuration(elapsed)) return elapsed;
  }

  // duration_minutes is also set when a session starts, so it may be the time
  // allowance rather than time the learner actually used.
  return null;
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

function calculateStudyTime(sessions) {
  const totalSeconds = (sessions || []).reduce((sum, s) => {
    const duration = getKnownDurationSeconds(s);
    return duration === null ? sum : sum + duration;
  }, 0);
  return {
    minutes: Math.round(totalSeconds / 60),
    hours: Math.round((totalSeconds / 3600) * 10) / 10,
  };
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
  const abandonedSessions = scoredSessions.filter(isAbandonedSession);
  // Averages come from tests that were actually sat. `scoredTests` still counts
  // every scored session so the two numbers can be reconciled on screen.
  const measuredScored = scoredSessions.filter((s) => !isAbandonedSession(s));

  const avgScoreNum =
    measuredScored.length > 0
      ? measuredScored.reduce((sum, s) => sum + Number(s.score), 0) / measuredScored.length
      : 0;

  const studyTime = calculateStudyTime(filteredSessions);
  const previousStudyTime = calculateStudyTime(previousSessions);
  const studyHours = studyTime.hours;
  const prevStudyHours = previousStudyTime.hours;

  let studyHoursTrend = 0;
  if (prevStudyHours > 0) {
    studyHoursTrend = Math.round(((studyHours - prevStudyHours) / prevStudyHours) * 100);
  } else if (studyHours > 0) {
    studyHoursTrend = 100;
  }

  const improvement = calculateImprovement(measuredScored);
  const moduleLatestScores = getLatestModuleScores(measuredScored);

  const overallEstimate =
    moduleLatestScores.length === MODULES.length
      ? Math.round(
          (moduleLatestScores.reduce((sum, s) => sum + s, 0) / moduleLatestScores.length) * 2
        ) / 2
      : null;

  return {
    avgScore: formatBand(avgScoreNum),
    targetScore: authUser?.target_band_score || 7.0,
    totalTests,
    scoredTests: scoredSessions.length,
    measuredTests: measuredScored.length,
    abandonedTests: abandonedSessions.length,
    studyHours,
    studyMinutes: studyTime.minutes,
    studyHoursTrend,
    vocabCount,
    improvement: improvement > 0 ? `+${formatBand(improvement)}` : formatBand(improvement),
    overallEstimate,
    modulesWithData: moduleLatestScores.length,
    practiceRhythm: computePracticeRhythm(filteredSessions),
  };
}

/**
 * How regularly the learner practises, and how recently.
 *
 * IELTS candidates plateau from irregular practice far more often than from
 * practising the wrong thing, and neither the session count nor the study-hours
 * total shows that — twelve tests in one weekend and twelve spread over a month
 * produce the same headline number and very different exam results.
 */
export function computePracticeRhythm(sessions, now = Date.now()) {
  const days = new Set();
  let latest = null;

  (sessions || []).forEach((session) => {
    const raw = session?.completed_at || session?.created_at;
    const time = new Date(raw).getTime();
    if (!Number.isFinite(time)) return;
    days.add(new Date(time).toISOString().slice(0, 10));
    if (latest === null || time > latest) latest = time;
  });

  const activeDays = days.size;
  const daysSinceLast = latest === null ? null : Math.floor((now - latest) / (24 * 60 * 60 * 1000));

  // Spread over the observed window rather than the timeframe length, so a
  // learner who joined last week is not marked down for the weeks before that.
  const sorted = [...days].sort();
  const spanDays =
    sorted.length < 2
      ? sorted.length
      : Math.max(
          1,
          Math.round(
            (new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()) /
              (24 * 60 * 60 * 1000)
          ) + 1
        );

  return {
    activeDays,
    spanDays,
    daysSinceLast,
    // Share of days in the practised window that actually had a session.
    consistency: spanDays > 0 ? Math.round((activeDays / spanDays) * 100) : 0,
  };
}

export function computeModuleStats(filteredSessions) {
  return MODULES.map((type) => {
    const scored = filteredSessions.filter(
      (s) => String(s.test_type || '').toLowerCase() === type && isValidBandScore(s.score)
    );
    // Abandoned attempts are reported, never averaged — see isAbandonedSession.
    const sessions = scored.filter((s) => !isAbandonedSession(s));
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
      abandoned: scored.length - sessions.length,
      lastScore: sessions[0]?.score ?? 0,
      highest,
      sessions,
      recentScores,
      // Spread of the scored attempts — a band 7 that swings between 5.5 and 8
      // is a different problem from a steady band 7.
      volatility:
        sessions.length >= 3
          ? Math.round(
              (Math.max(...sessions.map((s) => Number(s.score))) -
                Math.min(...sessions.map((s) => Number(s.score)))) *
                10
            ) / 10
          : null,
    };
  });
}

function processTypeStats(content, aggState, module) {
  if (!content.typeStats) return;
  Object.entries(content.typeStats).forEach(([qType, qStats]) => {
    const key = `${module || 'unknown'}:${qType}`;
    if (!aggState.allTypeStats[key]) {
      aggState.allTypeStats[key] = {
        module: module || 'unknown',
        questionType: qType,
        correct: 0,
        total: 0,
      };
    }
    aggState.allTypeStats[key].correct += qStats.correct || 0;
    aggState.allTypeStats[key].total += qStats.total || 0;
  });
}

export function sectionUnitLabel(module) {
  if (module === 'reading') return 'Passage';
  if (module === 'listening') return 'Part';
  return 'Section';
}

function processSectionStats(content, aggState, module) {
  if (!Array.isArray(content.sectionStats)) return;
  const passageTimes = content.passageTimes || {};

  content.sectionStats.forEach((secStats, idx) => {
    const moduleLabel = String(module || 'Test').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const secKey = `${moduleLabel} ${sectionUnitLabel(module)} ${idx + 1}`;
    if (!aggState.allSectionStats[secKey]) {
      aggState.allSectionStats[secKey] = {
        correct: 0,
        total: 0,
        module: module || 'unknown',
        position: idx + 1,
        attempts: 0,
        seconds: 0,
        timedAttempts: 0,
      };
    }
    const bucket = aggState.allSectionStats[secKey];
    bucket.correct += secStats.correct || 0;
    bucket.total += secStats.total || 0;
    bucket.attempts += 1;

    // Passage/part timing lets the panel say *where* the clock ran out, not just
    // that it did — reading candidates almost always lose it on the last passage.
    const seconds = Number(passageTimes[idx] ?? passageTimes[String(idx)]);
    if (Number.isFinite(seconds) && seconds > 0) {
      bucket.seconds += seconds;
      bucket.timedAttempts += 1;
    }
  });
}

/**
 * Per-question pacing, joined against whether the answer was right.
 *
 * `errorPatterns` already counts near-misses and blanks, but the two mistakes
 * that actually respond to coaching — snap answers and questions the learner
 * sank minutes into — are only visible by crossing `timePerQuestionSeconds`
 * with `correctAnswersMap`. Both have been written to every graded session for
 * months and neither was read.
 */
export const RUSHED_MAX_SECONDS = 20;
export const OVERANALYSED_MIN_SECONDS = 150;

function processQuestionTiming(content, aggState, sessionBrief) {
  const times = content.timePerQuestionSeconds;
  const answers = content.correctAnswersMap;
  if (!times || !answers) return;

  let rushedHere = 0;
  let overanalysedHere = 0;

  Object.entries(times).forEach(([questionId, rawSeconds]) => {
    const seconds = Number(rawSeconds);
    const record = answers[questionId];
    if (!record || !Number.isFinite(seconds) || seconds <= 0) return;
    // isCorrect === null means never answered; blanks are counted separately.
    if (record.isCorrect !== false) return;

    if (seconds <= RUSHED_MAX_SECONDS) {
      rushedHere += 1;
    } else if (seconds >= OVERANALYSED_MIN_SECONDS) {
      overanalysedHere += 1;
    }
  });

  aggState.behaviourAgg.rushed += rushedHere;
  aggState.behaviourAgg.overanalysed += overanalysedHere;

  // Mirrors processErrorPatterns below — the drilldown modal needs a session
  // list per category, not just the aggregate count.
  if (rushedHere > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.rushed.push({
      ...sessionBrief,
      count: rushedHere,
    });
  }
  if (overanalysedHere > 0) {
    aggState.enhancedMetricsAgg.sessionReferences.overanalyzed.push({
      ...sessionBrief,
      count: overanalysedHere,
    });
  }
}

/**
 * Does changing an answer help this learner or hurt them?
 *
 * "Trust your first instinct" is the most repeated piece of IELTS advice and
 * almost nobody can check it against their own record. `answerChangeCounts`
 * plus `correctAnswersMap` answers it directly: accuracy on questions the
 * learner revised, against accuracy on questions they left alone.
 */
function processAnswerChanges(content, aggState) {
  const changes = content.answerChangeCounts;
  const answers = content.correctAnswersMap;
  if (!changes || !answers) return;

  Object.entries(answers).forEach(([questionId, record]) => {
    if (!record || record.isCorrect === null || record.isCorrect === undefined) return;
    const changed = Number(changes[questionId]) > 0;
    const bucket = changed ? aggState.behaviourAgg.revised : aggState.behaviourAgg.firstAnswer;
    bucket.total += 1;
    if (record.isCorrect === true) bucket.correct += 1;
  });
}

/*
 * NOTE: `content_data.skillGaps` (scanningEfficiency, globalComprehension, …)
 * is deliberately NOT aggregated here. Those are the grader's inferred
 * cognitive-skill labels rather than anything the learner measurably did, and
 * evidence-grounded-analytics.test.js guards against surfacing them. Everything
 * this module reports is countable: answers, seconds, revisions.
 */

function processTimeMetrics(content, aggState) {
  if (!content.timeMetrics) return;
  const trackedSeconds = Number(content.timeMetrics.totalTimeSpent);

  if (isValidDuration(trackedSeconds)) {
    aggState.enhancedMetricsAgg.totalTimeSpent += trackedSeconds;
  }
  aggState.enhancedMetricsAgg.sessionCount += 1;
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

  processTypeStats(content, aggState, type);
  processSectionStats(content, aggState, type);
  processModuleEfficiency(s, type, aggState);
  processTimeMetrics(content, aggState);
  processErrorPatterns(content, aggState, sessionBrief);
  processQuestionTiming(content, aggState, sessionBrief);
  processAnswerChanges(content, aggState);
}

function getFeedbackScores(fbs, taskName) {
  const task = fbs[taskName] || {};
  return task.criteriaScores || task.criteria_scores || {};
}

function firstPresentScore(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const score = Number(value);
    if (Number.isFinite(score) && score >= 0 && score <= 9) return score;
  }
  return null;
}

function extractTaskScore(t1, t2, key1, key2) {
  return firstPresentScore(t2[key1], t2[key2], t1[key1], t1[key2]);
}

function hasAnyKeys(obj1, obj2, obj3) {
  return (
    Object.keys(obj1).length > 0 || Object.keys(obj2).length > 0 || Object.keys(obj3).length > 0
  );
}

function extractFinalWritingScore(ctx, directKey, fbKey1, fbKey2) {
  return firstPresentScore(ctx.cs[directKey], extractTaskScore(ctx.t1, ctx.t2, fbKey1, fbKey2));
}

function processWritingCriteria(content, aggState) {
  const cs = content.criteriaScores || {};
  const fbs = content.ai_feedbacks || {};
  const t1 = getFeedbackScores(fbs, 'Task 1');
  const t2 = getFeedbackScores(fbs, 'Task 2');

  if (!hasAnyKeys(cs, t1, t2)) return;

  const ctx = { cs, t1, t2 };

  const updateAgg = (key, val) => {
    if (val !== null) {
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

  const getScore = (key1, key2) => firstPresentScore(cs[key1], evalCs[key2]);

  const updateAgg = (key, val) => {
    if (val !== null) {
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
  const version = s.evaluation_version || content.evaluationVersion;
  if (version !== CURRENT_EVALUATION_VERSION || s.evaluation_status !== 'complete') return;

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
      totalTimeSpent: 0,
      sessionCount: 0,
      troubleTypesFrequency: {},
      totalNearMisses: 0,
      totalUnanswered: 0,
      sessionReferences: { nearMisses: [], unanswered: [], rushed: [], overanalyzed: [] },
    },
    behaviourAgg: {
      rushed: 0,
      overanalysed: 0,
      revised: { correct: 0, total: 0 },
      firstAnswer: { correct: 0, total: 0 },
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
    .map(([, stats]) => ({
      module: stats.module,
      type: stats.questionType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => a.module.localeCompare(b.module) || b.accuracy - a.accuracy);
}

function computeSectionPerformance(aggState) {
  return Object.entries(aggState.allSectionStats)
    .map(([section, stats]) => ({
      section,
      module: stats.module,
      position: stats.position,
      correct: stats.correct,
      total: stats.total,
      attempts: stats.attempts,
      accuracy: Math.round((stats.correct / (stats.total || 1)) * 100),
      avgMinutes:
        stats.timedAttempts > 0 ? Math.round(stats.seconds / stats.timedAttempts / 60) : null,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => a.module.localeCompare(b.module) || a.position - b.position);
}

function computeAnswerBehaviour(aggState) {
  const { revised, firstAnswer, rushed, overanalysed } = aggState.behaviourAgg;
  const rate = (bucket) =>
    bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : null;

  const revisedRate = rate(revised);
  const firstRate = rate(firstAnswer);

  return {
    rushed,
    overanalysed,
    revised: { ...revised, accuracy: revisedRate },
    firstAnswer: { ...firstAnswer, accuracy: firstRate },
    // Positive means revising helped. Needs both samples to mean anything, and
    // a handful of questions is not evidence — the panel gates on `hasSignal`.
    revisionEdge: revisedRate != null && firstRate != null ? revisedRate - firstRate : null,
    hasSignal: revised.total >= 8 && firstAnswer.total >= 8,
    hasTiming: rushed + overanalysed > 0,
  };
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

export function buildPacingSummary(efficiency = {}) {
  // Reading is the only module where the learner controls the full test pace.
  // Listening is audio-paced, while Writing/Speaking need task-specific timing context.
  return ['reading'].map((type) => {
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

function computeEnhancedMetricsResult(aggState) {
  const tNearMisses = aggState.enhancedMetricsAgg.totalNearMisses;
  const tUnanswered = aggState.enhancedMetricsAgg.totalUnanswered;
  const behaviour = computeAnswerBehaviour(aggState);

  return {
    hasData: aggState.enhancedMetricsAgg.sessionCount > 0,
    avgTimePerSession:
      aggState.enhancedMetricsAgg.sessionCount > 0
        ? Math.round(
            aggState.enhancedMetricsAgg.totalTimeSpent /
              aggState.enhancedMetricsAgg.sessionCount /
              60
          )
        : 0,
    totalRushed: behaviour.rushed,
    totalOveranalyzed: behaviour.overanalysed,
    totalNearMisses: tNearMisses,
    totalUnanswered: tUnanswered,
    behaviour,
    sessionReferences: aggState.enhancedMetricsAgg.sessionReferences,
    // Rushing and over-thinking were hardcoded to zero, so two of the four ring
    // segments — and half of this panel's advice — could never appear.
    errorAuditData: [
      { name: 'Almost Correct', value: tNearMisses },
      { name: 'Left Blank', value: tUnanswered },
      { name: 'Rushing', value: behaviour.rushed },
      { name: 'Thinking Too Long', value: behaviour.overanalysed },
    ].filter((d) => d.value > 0),
    topTroubleTypes: Object.entries(aggState.enhancedMetricsAgg.troubleTypesFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type),
    skillGaps: [],
  };
}

function getCriteriaAverages(aggState) {
  const avgCriteria = (agg) => (agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : null);

  const writingCriteria = {
    taskAchievement: avgCriteria(aggState.writingCriteriaAgg.taskAchievement),
    coherence: avgCriteria(aggState.writingCriteriaAgg.coherence),
    lexicalResource: avgCriteria(aggState.writingCriteriaAgg.lexicalResource),
    grammar: avgCriteria(aggState.writingCriteriaAgg.grammar),
    sampleCounts: Object.fromEntries(
      Object.entries(aggState.writingCriteriaAgg).map(([key, value]) => [key, value.count])
    ),
    hasData: Object.values(aggState.writingCriteriaAgg).some((v) => v.count > 0),
  };

  const speakingCriteria = {
    fluency: avgCriteria(aggState.speakingCriteriaAgg.fluency),
    lexicalResource: avgCriteria(aggState.speakingCriteriaAgg.lexicalResource),
    grammar: avgCriteria(aggState.speakingCriteriaAgg.grammar),
    pronunciation: avgCriteria(aggState.speakingCriteriaAgg.pronunciation),
    sampleCounts: Object.fromEntries(
      Object.entries(aggState.speakingCriteriaAgg).map(([key, value]) => [key, value.count])
    ),
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
  const enhancedMetrics = computeEnhancedMetricsResult(aggState);
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
      text: `Choose a focused ${m.type} task from your learning plan.`,
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

export function computeInsights(moduleStats) {
  const insightsObj = {
    strengths: [],
    improvements: [],
    trends: [],
    recommendations: [],
    correlations: [],
  };

  generateModuleInsights(moduleStats, insightsObj);

  return {
    ...insightsObj,
    aiSuggestions: null,
  };
}

function computeModuleHistory(scoredSessions) {
  const moduleHistory = {};
  MODULES.forEach((mType) => {
    moduleHistory[mType] = scoredSessions
      .filter((s) => String(s.test_type || '').toLowerCase() === mType)
      .slice()
      .reverse()
      .map((s) => {
        const timestamp = new Date(s.completed_at || s.created_at).getTime();
        const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        return { id: s.id, date: dateStr, timestamp, score: Number(s.score), type: mType };
      });
  });
  return moduleHistory;
}

export function roundIeltsOverall(scores) {
  if (!Array.isArray(scores) || scores.length !== MODULES.length) return null;
  if (scores.some((score) => !isValidBandScore(score))) return null;
  const average = scores.reduce((sum, score) => sum + Number(score), 0) / MODULES.length;
  return Math.round(average * 2) / 2;
}

function computeOverallProgress(moduleHistory) {
  const latest = MODULES.map((type) => moduleHistory[type]?.at(-1)?.score ?? null);
  const current = roundIeltsOverall(latest);
  if (current === null) return { qualified: false, current: null, history: [], hasTrend: false };

  const hasTrend = MODULES.every((type) => (moduleHistory[type]?.length || 0) >= 2);
  if (!hasTrend) {
    return {
      qualified: true,
      current,
      history: [{ date: 'Current', score: current }],
      hasTrend: false,
    };
  }

  const previous = roundIeltsOverall(
    MODULES.map((type) => moduleHistory[type][moduleHistory[type].length - 2].score)
  );
  return {
    qualified: true,
    current,
    history: [
      { date: 'Previous set', score: previous },
      { date: 'Current', score: current },
    ],
    hasTrend: true,
  };
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
      // Surfaced so the log can label a walk-away instead of showing "Band 0.0"
      // next to tests the learner genuinely sat.
      abandoned: isAbandonedSession(session),
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

/**
 * Exam readiness — the question every candidate actually has, which no single
 * number on this page answered: "if I sat the test on Saturday, am I ready?"
 *
 * Four factors, equally weighted, each one honest about what it can and cannot
 * know. This is a readiness *check*, not a predicted exam band: the app has no
 * business telling someone they will get a 7.
 */
export const READINESS_FACTORS = [
  {
    key: 'coverage',
    label: 'Module coverage',
    hint: 'All four modules scored at least once. A band you cannot see is a band you cannot plan around.',
  },
  {
    key: 'proximity',
    label: 'Distance to target',
    hint: 'How close your current average sits to the band you are aiming for.',
  },
  {
    key: 'consistency',
    label: 'Practice consistency',
    hint: 'Share of days in your practice window that actually had a session.',
  },
  {
    key: 'stability',
    label: 'Score stability',
    hint: 'How much your scored results swing. Wide swings mean the band is not yet reliable.',
  },
];

export function computeExamReadiness(stats, moduleStats = []) {
  const target = Number(stats?.targetScore) || 7;
  const scored = moduleStats.filter((m) => m.count > 0);
  const measured = Number(stats?.measuredTests) || 0;

  if (measured === 0) return null;

  const coverage = Math.round((scored.length / MODULES.length) * 100);

  const current = Number(stats?.overallEstimate ?? stats?.avgScore);
  const gap = Number.isFinite(current) ? target - current : null;
  // At target or above scores 100; a full band short scores 0. Linear between.
  const proximity = gap === null ? 0 : Math.round(Math.max(0, Math.min(1, 1 - gap / 1.0)) * 100);

  const consistency = Math.min(100, Number(stats?.practiceRhythm?.consistency) || 0);

  const volatilities = scored.map((m) => m.volatility).filter((v) => v != null);
  // A 2-band swing scores 0, a flat result scores 100.
  const stability = volatilities.length
    ? Math.round(
        Math.max(
          0,
          Math.min(1, 1 - volatilities.reduce((a, b) => a + b, 0) / volatilities.length / 2)
        ) * 100
      )
    : null;

  const factors = { coverage, proximity, consistency, stability };
  const known = Object.values(factors).filter((v) => v != null);
  const score = Math.round(known.reduce((a, b) => a + b, 0) / known.length);

  return {
    score,
    factors,
    // Named so the panel never has to invent copy for the state it is in.
    verdict:
      score >= 80
        ? 'Exam ready'
        : score >= 60
          ? 'Nearly there'
          : score >= 35
            ? 'Building up'
            : 'Early days',
    tone: score >= 80 ? 'ok' : score >= 60 ? 'accent' : score >= 35 ? 'warn' : 'fault',
    missingModules: MODULES.filter((type) => !scored.some((m) => m.type === type)),
    measuredTests: measured,
  };
}

export function computeChartData(filteredSessions, moduleStats) {
  // Walk-aways are excluded here too — the per-module trend line otherwise
  // shows a fake band-0 dip for a test the learner never actually sat, the
  // same distortion fixed in computeStats/computeModuleStats.
  const scoredSessions = filteredSessions.filter(
    (s) => isValidBandScore(s.score) && !isAbandonedSession(s)
  );

  const pie = computeDistribution(moduleStats);
  const moduleHistory = computeModuleHistory(scoredSessions);
  const overallProgress = computeOverallProgress(moduleHistory);
  const recentPractice = computeRecentPractice(filteredSessions);
  // Every scored result across all modules, chronological — the "All" trend
  // tab. Distinct from `overallProgress`, which is the IELTS-rounded Overall
  // band and only exists once all four modules are scored.
  const history = MODULES.flatMap((type) => moduleHistory[type] || []).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  return { pie, moduleHistory, overallProgress, recentPractice, history };
}
