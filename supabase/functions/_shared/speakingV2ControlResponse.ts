type SpeakingQuestion = { id: string; text: string };

type PublicSpeakingState = {
  part: number;
  questionNumber: number;
  revision: number;
  status: string;
  [key: string]: unknown;
};

export function buildSpeakingV2ControlResponse({
  state,
  questions,
}: {
  state: PublicSpeakingState;
  questions: SpeakingQuestion[];
}) {
  if (state.status === 'part_complete') {
    return {
      success: true,
      action: 'complete_part',
      state,
    };
  }

  if (state.status === 'ready_for_evaluation' || state.status === 'completed') {
    return {
      success: true,
      action: 'complete_test',
      state,
    };
  }

  const index = Math.min(Math.max(Number(state.questionNumber) || 0, 0), questions.length - 1);
  const examinerText = questions[index]?.text;

  return {
    success: true,
    ...(examinerText
      ? {
          examinerText,
          examinerResponse: examinerText,
        }
      : {}),
    state,
  };
}
