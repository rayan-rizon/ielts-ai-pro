import { buildPronunciationBreakdown } from '../hooks/usePronunciationBreakdown';
import { normalizeSpeakingDeepDive } from './speakingDeepDive';
import { buildSpeakingReportSummary } from './speakingReportSummary';
import {
  attachFeedback,
  buildCriteriaList,
  buildDelivery,
  deriveTopFix,
  extractAnswers,
  findHoldingBack,
  flaggedWordsByPart,
  lengthBasis,
  selectPracticeDrills,
} from './speakingReportInsights';

/**
 * Everything the speaking report shows, built once from the saved session.
 * The page and the PDF both render this object, so they can't disagree.
 */
export function buildSpeakingReport({
  finalEvaluation,
  allPartsConversation,
  allPartsPronunciation,
  detailedFeedback,
  partTwoTopic,
}) {
  if (!finalEvaluation) return null;
  const summary = buildSpeakingReportSummary(finalEvaluation);
  const pronunciationBreakdown = buildPronunciationBreakdown(allPartsPronunciation);
  const answers = attachFeedback(
    extractAnswers(allPartsConversation, { partTwoTopic }),
    normalizeSpeakingDeepDive(detailedFeedback)
  );
  const basis = lengthBasis(answers);
  const delivery = buildDelivery(answers, allPartsPronunciation);
  const criteria = buildCriteriaList(finalEvaluation);
  const sounds = pronunciationBreakdown?.problematicSounds || [];
  const topFix = deriveTopFix({
    answers,
    basis,
    criteria,
    sounds,
    improvements: summary.improvements,
  });

  return {
    summary,
    answers,
    basis,
    delivery,
    criteria,
    pronunciationBreakdown,
    holdingBack: findHoldingBack(criteria),
    topFix,
    drills: selectPracticeDrills({ answers, basis, criteria, delivery, sounds, topFix }),
    flaggedWords: flaggedWordsByPart(allPartsPronunciation),
  };
}
