import useXPRewards from './useXPRewards';
import useDeepDive from './useDeepDive';
import useFinalEvaluation from './useFinalEvaluation';

export default function useSpeakingEvaluation({
  testId,
  session,
  allParts,
  allPartsConversation,
  currentPartNumber,
  conversation,
  acousticMetricsRef,
  saveSessionProgress,
  isMountedRef,
  pendingTimersRef,
  setIsTestComplete,
  setShowUpgradeDialog,
  setProcessingStatus,
}) {
  const xpRewards = useXPRewards(pendingTimersRef);

  const deepDive = useDeepDive({ testId, session, allParts, saveSessionProgress, isMountedRef });

  const evaluation = useFinalEvaluation({
    testId,
    session,
    allParts,
    allPartsConversation,
    currentPartNumber,
    conversation,
    acousticMetricsRef,
    saveSessionProgress,
    awardXP: xpRewards.awardXP,
    setIsTestComplete,
    setShowUpgradeDialog,
    setProcessingStatus,
  });

  return {
    loadingMessage: evaluation.loadingMessage,
    finalEvaluation: evaluation.finalEvaluation,
    setFinalEvaluation: evaluation.setFinalEvaluation,
    isEvaluating: evaluation.isEvaluating,
    evaluationError: evaluation.evaluationError,
    setEvaluationError: evaluation.setEvaluationError,
    detailedFeedback: deepDive.detailedFeedback,
    isGeneratingDetailed: deepDive.isGeneratingDetailed,
    deepDiveError: deepDive.deepDiveError,
    showConfetti: xpRewards.showConfetti,
    setShowConfetti: xpRewards.setShowConfetti,
    showXPNotification: xpRewards.showXPNotification,
    setShowXPNotification: xpRewards.setShowXPNotification,
    earnedXP: xpRewards.earnedXP,
    requestFinalEvaluation: evaluation.requestFinalEvaluation,
    fireDeepDive: deepDive.fireDeepDive,
  };
}
