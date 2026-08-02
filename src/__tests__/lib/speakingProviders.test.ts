import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildBrowserTranscriptHint,
  buildAzurePronunciationUrl,
  buildDeterministicExaminerResponse,
  chooseVerifiedTranscript,
  cleanSpeakingQuestion,
  getTranscriptVerificationReason,
  mapAzureScoreToProvisionalIeltsBand,
  resolveAzurePronunciationAssessment,
  transcribeWithCloudflare,
} from '../../../supabase/functions/_shared/speakingProviders';

afterEach(() => vi.unstubAllGlobals());

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

  it('uses only reliable browser caption segments as a transcription hint', () => {
    expect(
      buildBrowserTranscriptHint([
        { transcript: 'I live in Dhaka', confidence: 0.91 },
        { transcript: 'uncertain words', confidence: 0.32 },
      ])
    ).toMatchObject({
      transcript: 'I live in Dhaka',
      confidence: 0.91,
    });
  });

  it('verifies an unexpectedly short transcript from a longer answer', () => {
    expect(
      getTranscriptVerificationReason({
        cloudflareTranscript: 'Yes.',
        audioDurationMs: 12000,
      })
    ).toBe('unexpectedly-short');
  });

  it('does not pay for verification when the transcript agrees with reliable live captions', () => {
    expect(
      getTranscriptVerificationReason({
        cloudflareTranscript: 'I live in Dhaka with my family.',
        browserHint: { transcript: 'I live in Dhaka with my family', confidence: 0.9 },
        audioDurationMs: 9000,
      })
    ).toBeNull();
  });

  it('selects the verified transcript only when it improves agreement', () => {
    expect(
      chooseVerifiedTranscript({
        cloudflareTranscript: 'The picture of my grandfather is taller.',
        geminiTranscript: 'I know the capital city quite well.',
        browserHint: { transcript: 'I know my capital city quite well', confidence: 0.88 },
        reason: 'high-confidence-disagreement',
      })
    ).toBe('gemini-fallback');
  });

  it('retries a quiet clip without VAD before falling back to Gemini', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, result: { text: '' } }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, result: { text: 'I live in Dhaka.' } }), {
          status: 200,
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      transcribeWithCloudflare({ accountId: 'account', apiToken: 'token', audioBase64: 'audio' })
    ).resolves.toMatchObject({
      transcript: 'I live in Dhaka.',
      attempts: 2,
      recoveredByVadRetry: true,
    });

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(firstBody.vad_filter).toBe(true);
    expect(retryBody).toMatchObject({ vad_filter: false, no_speech_threshold: 0.8 });
  });
});
