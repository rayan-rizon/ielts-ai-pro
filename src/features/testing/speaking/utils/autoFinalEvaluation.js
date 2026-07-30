export function shouldAutomaticallyFinalizeSpeaking({
  allParts,
  currentPartNumber,
  isPartComplete,
  isTestComplete,
  isEvaluating,
  evaluationStatus,
  evaluationPending,
  alreadyRequested,
}) {
  const hasParts = Object.keys(allParts || {}).length > 0;
  const isFinalPart = hasParts && !allParts[currentPartNumber + 1];
  const evaluationAlreadyQueued =
    evaluationPending || evaluationStatus === 'processing' || evaluationStatus === 'completed';

  return Boolean(
    isPartComplete &&
    isFinalPart &&
    !isTestComplete &&
    !isEvaluating &&
    !evaluationAlreadyQueued &&
    !alreadyRequested
  );
}
