import { describe, expect, it } from 'vitest';
import {
  buildAzurePronunciationUrl,
  buildDeterministicExaminerResponse,
  cleanSpeakingQuestion,
  mapAzureScoreToProvisionalIeltsBand,
  resolveAzurePronunciationAssessment,
} from '../../../supabase/functions/_shared/speakingProviders';

describe('speaking provider helpers', () => {
  it('builds the documented regional Azure Speech recognition URL', () => {
    expect(buildAzurePronunciationUrl('https://southeastasia.stt.speech.microsoft.com/')).toBe(
      'https://southeastasia.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1'
    );
  });

  it('supports Azure multi-service Cognitive endpoints', () => {
    expect(buildAzurePronunciationUrl('https://southeastasia.api.cognitive.microsoft.com')).toBe(
      'https://southeastasia.api.cognitive.microsoft.com/stt/speech/recognition/conversation/cognitiveservices/v1'
    );
  });

  it('reads pronunciation scores from the top-level Azure detailed result', () => {
    expect(
      resolveAzurePronunciationAssessment({
        AccuracyScore: 91,
        FluencyScore: 84,
        PronScore: 88,
      })
    ).toMatchObject({ AccuracyScore: 91, FluencyScore: 84, PronScore: 88 });
  });

  it('supports Azure responses that nest pronunciation scores', () => {
    expect(
      resolveAzurePronunciationAssessment({
        PronunciationAssessment: {
          AccuracyScore: 82,
          FluencyScore: 79,
          PronunciationScore: 80,
        },
      })
    ).toMatchObject({ AccuracyScore: 82, FluencyScore: 79, PronunciationScore: 80 });
  });

  it('uses only the supplied next question', () => {
    expect(
      buildDeterministicExaminerResponse({
        partNumber: 1,
        currentQuestionIndex: 0,
        nextQuestion: 'Where do you usually study?',
        isLastQuestion: false,
      })
    ).toBe('Thank you. Where do you usually study?');
  });

  it('ends Part 2 without generating a redundant follow-up question', () => {
    expect(
      buildDeterministicExaminerResponse({
        partNumber: 2,
        currentQuestionIndex: 0,
        nextQuestion: null,
        isLastQuestion: true,
      })
    ).toBe('Thank you for your response. That brings us to the end of Part 2.');
  });

  it('does not read Part 2 cue-card bullets aloud', () => {
    expect(
      cleanSpeakingQuestion('Describe a useful object. You should say: where you got it', 2)
    ).toBe('Describe a useful object.');
  });

  it('maps provider scores to bounded half-band provisional estimates', () => {
    expect(mapAzureScoreToProvisionalIeltsBand(75)).toBe(7);
    expect(mapAzureScoreToProvisionalIeltsBand(100)).toBe(9);
    expect(mapAzureScoreToProvisionalIeltsBand(-20)).toBe(1);
  });
});
