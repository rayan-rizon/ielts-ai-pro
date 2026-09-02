const MIN_PART_TWO_AUDIO_DURATION_MS = 30_000;
const MIN_PART_TWO_WORDS = 35;

function wordCount(value: string) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function resolvePartTwoTurn({
  audioDurationMs,
  transcript,
}: {
  audioDurationMs: number | null | undefined;
  transcript: string;
}) {
  const hasEnoughAudio = Number(audioDurationMs) >= MIN_PART_TWO_AUDIO_DURATION_MS;
  const hasEnoughWords = wordCount(transcript) >= MIN_PART_TWO_WORDS;
  if (hasEnoughAudio && hasEnoughWords) return { complete: true, examinerResponse: null };

  return {
    complete: false,
    examinerResponse:
      'Please continue your long turn when you are ready. Aim to speak about the topic card for 1 to 2 minutes.',
  };
}
