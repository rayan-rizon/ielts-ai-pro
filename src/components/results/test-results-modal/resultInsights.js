/**
 * Cross-cutting derivations for the results modal.
 *
 * `resultStats.js` answers "how many did I get right". This answers the two
 * questions that were being asked twice in different shapes, and several that
 * were never asked at all:
 *
 *   - Where did the marks go?  (type × section attribution — `deriveMarkLoss`)
 *   - How did the paper unfold? (pacing / drop-off — `deriveSectionFlow`)
 *   - How did the learner work? (`deriveBehaviour`)
 *
 * The Overview tab and the Analysis tab both read from here, so they cannot
 * drift apart the way "Accuracy by question type" and the analysis tab's
 * type-loss grid did — two panels rendering the same `typeStats` through two
 * independent reductions.
 *
 * Every derivation reports its own coverage. A result that never stored
 * per-question detail returns `available: false` rather than a confident zero,
 * because "0 answers changed" and "we never recorded answer changes" are very
 * different claims to put in front of a learner.
 */

import { labelQuestionType } from './premiumAnalysis';

const safeInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
};

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Reading papers are passages, listening papers are parts. */
export const sectionNoun = (testType) => (testType === 'listening' ? 'Part' : 'Passage');

/**
 * IELTS reading allows 60 minutes for three passages. The per-passage budget is
 * therefore 20 minutes — the same benchmark the in-test pacing indicator uses.
 * Listening is audio-paced, so no benchmark applies and none is invented.
 */
export const PASSAGE_BUDGET_SECONDS = 20 * 60;

function readResponseDetails(testResults) {
  const details = testResults?.responseDetails;
  return Array.isArray(details) ? details : [];
}

/** A question counts as lost whenever it is not explicitly correct. */
const isLost = (detail) => detail?.isCorrect !== true;

const sectionIndexOf = (detail) => {
  const direct = Number(detail?.sectionIndex);
  if (Number.isInteger(direct) && direct >= 0) return direct;
  const oneBased = Number(detail?.sectionOrPart);
  return Number.isInteger(oneBased) && oneBased > 0 ? oneBased - 1 : null;
};

/**
 * Marks lost, attributed to both a question type and a section.
 *
 * The two overview cards used to answer "which type is weak" and "which passage
 * is weak" separately, which cannot answer the question a learner actually has:
 * *is this weakness everywhere, or only in one passage?* Cross-tabulating the
 * per-question records answers it, and costs one extra pass.
 */
export function deriveMarkLoss(testResults, testType = 'reading') {
  const typeStats = testResults?.typeStats || {};
  const details = readResponseDetails(testResults);
  const sectionCount = Array.isArray(testResults?.sectionStats)
    ? testResults.sectionStats.length
    : 0;

  // sectionIndex is only trustworthy when the per-question records actually
  // cover the paper; a partial set would under-report losses per section.
  const detailTotal = details.length;
  const aggregateTotal = safeInt(testResults?.totalQuestions);
  const hasSectionAttribution =
    sectionCount > 0 &&
    detailTotal > 0 &&
    detailTotal >= aggregateTotal &&
    details.some((detail) => sectionIndexOf(detail) !== null);

  const lossBySectionForType = new Map();
  if (hasSectionAttribution) {
    details.forEach((detail) => {
      if (!isLost(detail)) return;
      const type = detail?.type || detail?.questionType;
      const section = sectionIndexOf(detail);
      if (!type || section === null) return;
      const row = lossBySectionForType.get(type) || new Array(sectionCount).fill(0);
      if (section < sectionCount) row[section] += 1;
      lossBySectionForType.set(type, row);
    });
  }

  const types = Object.entries(typeStats)
    .map(([type, stat]) => {
      const total = safeInt(stat?.total);
      const correct = Math.min(total, safeInt(stat?.correct));
      const lost = Math.max(0, total - correct);
      const bySection = lossBySectionForType.get(type) || null;
      // The section carrying the most of this type's losses, and only when it
      // carries any at all — otherwise the row would point at a section where
      // nothing actually went wrong.
      let worstSection = null;
      if (bySection && lost > 0) {
        const peak = bySection.reduce(
          (best, value, index) => (value > bySection[best] ? index : best),
          0
        );
        if (bySection[peak] > 0) worstSection = peak;
      }

      return {
        type,
        label: labelQuestionType(type),
        total,
        correct,
        lost,
        accuracy: pct(correct, total),
        bySection,
        worstSection,
      };
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.lost - a.lost || a.accuracy - b.accuracy || a.label.localeCompare(b.label));

  const sections = (Array.isArray(testResults?.sectionStats) ? testResults.sectionStats : []).map(
    (stat, index) => {
      const total = safeInt(stat?.total);
      const correct = Math.min(total, safeInt(stat?.correct));
      return {
        index,
        label: stat?.title || `${sectionNoun(testType)} ${index + 1}`,
        shortLabel: `${sectionNoun(testType).charAt(0)}${index + 1}`,
        total,
        correct,
        lost: Math.max(0, total - correct),
        accuracy: pct(correct, total),
      };
    }
  );

  const totalLost = types.reduce((sum, entry) => sum + entry.lost, 0);

  return {
    types,
    sections,
    totalLost,
    hasSectionAttribution,
    biggest: types.find((entry) => entry.lost > 0) || null,
  };
}

/**
 * How the paper unfolded from first section to last.
 *
 * Reading stores real per-passage seconds (`passageTimes`), so pace is a
 * measurement. Listening is audio-paced — the clock is the recording's, not the
 * learner's — so `seconds` stays null there by design and nothing is inferred
 * from answer timestamps.
 */
export function deriveSectionFlow(testResults, testType = 'reading') {
  const passageTimes = testResults?.passageTimes || {};
  const usesZeroBasedKeys = Object.prototype.hasOwnProperty.call(passageTimes, 0);
  const isReading = testType !== 'listening';

  const sections = (Array.isArray(testResults?.sectionStats) ? testResults.sectionStats : []).map(
    (stat, index) => {
      const total = safeInt(stat?.total);
      const correct = Math.min(total, safeInt(stat?.correct));
      const key = usesZeroBasedKeys ? index : index + 1;
      const seconds = isReading ? safeInt(passageTimes[key]) : 0;

      return {
        index,
        label: stat?.title || `${sectionNoun(testType)} ${index + 1}`,
        shortLabel: `${sectionNoun(testType)} ${index + 1}`,
        total,
        correct,
        lost: Math.max(0, total - correct),
        accuracy: pct(correct, total),
        seconds: seconds > 0 ? seconds : null,
        overBudgetSeconds: seconds > 0 ? seconds - PASSAGE_BUDGET_SECONDS : null,
      };
    }
  );

  const withTiming = sections.filter((section) => section.seconds !== null);
  const scored = sections.filter((section) => section.total > 0);

  let dropOff = null;
  if (scored.length >= 2) {
    const best = scored.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));
    const last = scored[scored.length - 1];
    const first = scored[0];
    dropOff = {
      // The persisted `fatigueFactor` is exactly this: best accuracy minus the
      // accuracy of the final section.
      fatigue: Math.max(0, best.accuracy - last.accuracy),
      firstToLast: last.accuracy - first.accuracy,
      best,
      weakest: scored.reduce((a, b) => (b.accuracy < a.accuracy ? b : a)),
      last,
      first,
    };
  }

  return {
    sections,
    scored,
    dropOff,
    totalLost: scored.reduce((sum, section) => sum + section.lost, 0),
    hasTiming: withTiming.length > 0,
    totalSeconds: withTiming.reduce((sum, section) => sum + section.seconds, 0),
    slowest: withTiming.length
      ? withTiming.reduce((a, b) => (b.seconds > a.seconds ? b : a))
      : null,
  };
}

const BEHAVIOUR_UNAVAILABLE = { available: false };

/**
 * How the learner worked, as opposed to what they scored.
 *
 * Every field here was already computed at submit time and written to
 * `content_data`, then never rendered: answer-change counts, the confidence and
 * indecision indices, and the per-question flag markers. They are the only
 * signals in the result that explain *why* marks were lost rather than
 * restating *that* they were.
 */
export function deriveBehaviour(testResults, errorBuckets = null) {
  const errorPatterns = testResults?.errorPatterns;
  const changeCounts = testResults?.answerChangeCounts;
  const details = readResponseDetails(testResults);

  const hasChangeData = changeCounts && typeof changeCounts === 'object';
  const changeValues = hasChangeData ? Object.values(changeCounts).map((v) => safeInt(v)) : [];
  const questionsChanged = changeValues.filter((v) => v > 0).length;
  const totalChanges = changeValues.reduce((sum, v) => sum + v, 0);
  const changedMoreThanOnce = changeValues.filter((v) => v > 1).length;

  // `wasFlagged` is null on results recorded before flag capture existed, so an
  // all-null set means "not recorded", not "nothing flagged".
  const flagAware = details.filter(
    (detail) => detail?.wasFlagged !== null && detail?.wasFlagged !== undefined
  );
  const hasFlagData = flagAware.length > 0;
  const flagged = flagAware.filter((detail) => detail.wasFlagged === true);
  const flaggedLost = flagged.filter(isLost).length;

  const changedQuestionIds = hasChangeData
    ? new Set(
        Object.entries(changeCounts)
          .filter(([, value]) => safeInt(value) > 0)
          .map(([id]) => String(id))
      )
    : null;
  const changedAndLost = changedQuestionIds
    ? details.filter(
        (detail) => isLost(detail) && changedQuestionIds.has(String(detail?.questionId))
      ).length
    : null;

  const confidence = Number(errorPatterns?.confidenceIndex);
  const indecision = Number(errorPatterns?.indecisionScore);

  const available =
    hasChangeData || hasFlagData || Number.isFinite(confidence) || Boolean(errorBuckets);

  if (!available) return BEHAVIOUR_UNAVAILABLE;

  return {
    available: true,
    confidence: Number.isFinite(confidence) ? Math.round(confidence) : null,
    indecision: Number.isFinite(indecision) ? Math.round(indecision) : null,
    hasChangeData,
    questionsChanged,
    totalChanges,
    changedMoreThanOnce,
    changedAndLost,
    hasFlagData,
    flaggedCount: hasFlagData ? flagged.length : null,
    flaggedLost: hasFlagData ? flaggedLost : null,
    // The premium analysis buckets classify near misses only for free-text
    // types, which is the defensible rule; `errorPatterns.nearMissCount` applies
    // it to every type and would print a second, larger number for the same
    // idea. The stricter one wins whenever it is available.
    nearMiss: errorBuckets ? errorBuckets.nearMiss : safeInt(errorPatterns?.nearMissCount),
    nearMissStrict: Boolean(errorBuckets),
    skipped: errorBuckets ? errorBuckets.skipped : safeInt(errorPatterns?.unansweredCount),
  };
}

/**
 * Reading of the confidence index in words. The raw number is a heuristic built
 * from answer changes and blanks, so it is never shown without this.
 */
export function confidenceReading(value) {
  if (!Number.isFinite(value)) return null;
  if (value >= 85) return { tone: 'ok', text: 'Decisive — few changes, few blanks' };
  if (value >= 60) return { tone: 'warn', text: 'Some hesitation on your answers' };
  return { tone: 'fault', text: 'Frequent changes or blanks left behind' };
}

export function indecisionReading(value) {
  if (!Number.isFinite(value)) return null;
  if (value === 0) return { tone: 'ok', text: 'No answer was revisited twice' };
  if (value <= 40) return { tone: 'ok', text: 'Rarely revisited an answer twice' };
  if (value <= 70) return { tone: 'warn', text: 'Several answers went back and forth' };
  return { tone: 'fault', text: 'Most changed answers were changed repeatedly' };
}

/**
 * Signal tone for a per-passage time against the 20-minute budget.
 *
 * Overrunning is only as serious as the time it takes from the passages that
 * follow. Anything up to five minutes over is recoverable inside the hour, so
 * it warns; past that the overrun has eaten more than a quarter of another
 * passage's budget, which is where it starts costing marks elsewhere.
 */
export function paceTone(overBudgetSeconds) {
  if (overBudgetSeconds === null || overBudgetSeconds === undefined) return 'neutral';
  if (overBudgetSeconds > 300) return 'fault';
  if (overBudgetSeconds > 0) return 'warn';
  return 'ok';
}

export function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function formatSignedMinutes(seconds) {
  if (!Number.isFinite(seconds) || seconds === 0) return 'on budget';
  const minutes = Math.round(Math.abs(seconds) / 60);
  if (minutes === 0) return 'on budget';
  return seconds > 0 ? `${minutes}m over` : `${minutes}m spare`;
}
