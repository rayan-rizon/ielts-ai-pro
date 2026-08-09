export const CLOUDFLARE_WHISPER_MODEL = '@cf/openai/whisper-large-v3-turbo';
export const CLOUDFLARE_COST_PER_AUDIO_MINUTE_USD = 0.00051;
export const AZURE_SPEECH_COST_PER_AUDIO_HOUR_USD = 1;

interface TranscriptionResult {
  transcript: string;
  provider: 'cloudflare' | 'gemini-fallback';
  model: string;
  latencyMs: number;
  tokensUsed: number;
  attempts: number;
  recoveredByVadRetry: boolean;
}

function compactTranscript(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function transcriptTokens(value: string): string[] {
  return compactTranscript(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function transcriptSimilarity(left: string, right: string): number {
  const leftTokens = new Set(transcriptTokens(left));
  const rightTokens = new Set(transcriptTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let shared = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) shared += 1;
  });

  return (2 * shared) / (leftTokens.size + rightTokens.size);
}

export function buildBrowserTranscriptHint(value: unknown): {
  transcript: string;
  confidence: number;
} | null {
  if (!Array.isArray(value)) return null;

  const reliableSegments = value
    .map((entry: any) => ({
      transcript: compactTranscript(entry?.transcript),
      confidence: Number(entry?.confidence),
    }))
    .filter(
      (entry) => entry.transcript && Number.isFinite(entry.confidence) && entry.confidence >= 0.65
    );
  if (reliableSegments.length === 0) return null;

  return {
    transcript: reliableSegments.map((entry) => entry.transcript).join(' '),
    confidence:
      reliableSegments.reduce((total, entry) => total + entry.confidence, 0) /
      reliableSegments.length,
  };
}

export function canRecoverFromBrowserTranscript(
  hint: { transcript: string; confidence: number } | null
): hint is { transcript: string; confidence: number } {
  return Boolean(
    hint && hint.confidence >= 0.82 && hint.transcript.trim().split(/\s+/).length >= 3
  );
}

/**
 * Treat a recorder-confirmed no-speech turn as inaudible unless a high-
 * confidence, multi-word live caption independently corroborates speech.
 */
export function shouldGuardSilentSpeech(
  speechDetected: unknown,
  browserTranscriptHint: { transcript: string; confidence: number } | null
): boolean {
  return speechDetected === false && !canRecoverFromBrowserTranscript(browserTranscriptHint);
}

export function getTranscriptVerificationReason(params: {
  cloudflareTranscript: string;
  browserHint?: { transcript: string; confidence: number } | null;
  audioDurationMs?: number | null;
}): 'unexpectedly-short' | 'high-confidence-disagreement' | null {
  const cloudflareWordCount = transcriptTokens(params.cloudflareTranscript).length;
  const audioDurationMs = Math.max(0, Number(params.audioDurationMs) || 0);

  if (audioDurationMs >= 6500 && cloudflareWordCount <= 2) return 'unexpectedly-short';

  const browserHint = params.browserHint;
  if (
    browserHint &&
    transcriptTokens(browserHint.transcript).length >= 4 &&
    transcriptSimilarity(params.cloudflareTranscript, browserHint.transcript) < 0.22
  ) {
    return 'high-confidence-disagreement';
  }

  return null;
}

// Nobody sustains more than ~4 words per second, and IELTS candidates sit far
// below that. A transcript that outruns its own audio was not heard — it was
// invented, which is how learners ended up reading fluent answers they never
// gave. Sub-second clips are exempt: the ratio is meaningless at that length.
export const MAX_PLAUSIBLE_WORDS_PER_SECOND = 4;

export function isImplausiblyFastTranscript(transcript: string, audioDurationMs?: number | null) {
  const durationSeconds = Math.max(0, Number(audioDurationMs) || 0) / 1000;
  if (durationSeconds < 1) return false;

  const words = transcriptTokens(transcript).length;
  return words / durationSeconds > MAX_PLAUSIBLE_WORDS_PER_SECOND;
}

export function chooseVerifiedTranscript(params: {
  cloudflareTranscript: string;
  geminiTranscript: string;
  browserHint?: { transcript: string; confidence: number } | null;
  reason: 'unexpectedly-short' | 'high-confidence-disagreement';
  audioDurationMs?: number | null;
}): 'cloudflare' | 'gemini-fallback' {
  const cloudflareWords = transcriptTokens(params.cloudflareTranscript).length;
  const geminiWords = transcriptTokens(params.geminiTranscript).length;

  // A verifier that returns more words than the clip can hold is hallucinating,
  // never a better reading of the audio.
  if (isImplausiblyFastTranscript(params.geminiTranscript, params.audioDurationMs)) {
    return 'cloudflare';
  }

  if (params.reason === 'unexpectedly-short') {
    // Whisper reporting near-nothing is usually right. Only overrule it when
    // the live captions independently heard the learner speaking too, so a
    // long answer conjured from silence can never win on word count alone.
    const hintWords = params.browserHint
      ? transcriptTokens(params.browserHint.transcript).length
      : 0;
    const corroborated =
      hintWords >= 3 &&
      transcriptSimilarity(params.geminiTranscript, params.browserHint!.transcript) >= 0.3;
    return corroborated && geminiWords > cloudflareWords ? 'gemini-fallback' : 'cloudflare';
  }

  if (!params.browserHint) return 'cloudflare';
  const cloudflareSimilarity = transcriptSimilarity(
    params.cloudflareTranscript,
    params.browserHint.transcript
  );
  const geminiSimilarity = transcriptSimilarity(
    params.geminiTranscript,
    params.browserHint.transcript
  );

  return geminiSimilarity >= cloudflareSimilarity + 0.08 ? 'gemini-fallback' : 'cloudflare';
}

export async function transcribeWithCloudflare(params: {
  accountId: string;
  apiToken: string;
  audioBase64: string;
  audioDurationMs?: number | null;
}): Promise<TranscriptionResult> {
  const startedAt = Date.now();
  const requestTranscription = async (vadFilter: boolean, noSpeechThreshold?: number) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${params.accountId}/ai/run/${CLOUDFLARE_WHISPER_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${params.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: params.audioBase64,
          language: 'en',
          vad_filter: vadFilter,
          ...(noSpeechThreshold ? { no_speech_threshold: noSpeechThreshold } : {}),
          condition_on_previous_text: false,
          beam_size: 5,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Cloudflare transcription failed (${response.status}): ${body.slice(0, 300)}`
      );
    }

    const payload = await response.json();
    return payload?.success ? compactTranscript(payload?.result?.text) : '';
  };

  let transcript = await requestTranscription(true);
  let attempts = 1;
  let recoveredByVadRetry = false;

  // Whisper's VAD can classify quiet learner speech as silence. Retry only
  // empty successful responses without VAD before paying for another provider.
  if (!transcript) {
    attempts = 2;
    transcript = await requestTranscription(false, 0.8);
    // Whisper invents text when its voice filter is off and the clip is quiet.
    // Discard anything the audio could not physically have contained.
    if (isImplausiblyFastTranscript(transcript, params.audioDurationMs)) transcript = '';
    recoveredByVadRetry = Boolean(transcript);
  }

  if (!transcript) {
    throw new Error('Cloudflare transcription returned no intelligible speech after VAD retry');
  }

  return {
    transcript,
    provider: 'cloudflare',
    model: CLOUDFLARE_WHISPER_MODEL,
    latencyMs: Date.now() - startedAt,
    tokensUsed: 0,
    attempts,
    recoveredByVadRetry,
  };
}

export async function transcribeWithGeminiFallback(params: {
  apiKey: string;
  audioBase64: string;
  audioMimeType: string;
  browserTranscriptHint?: string;
  audioDurationMs?: number | null;
}): Promise<TranscriptionResult> {
  const model = 'gemini-2.5-flash-lite';
  const startedAt = Date.now();
  const prompt = buildGeminiTranscriptionPrompt(params);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': params.apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: params.audioMimeType || 'audio/webm',
                  data: params.audioBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1000,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini transcription fallback failed (${response.status})`);
  const payload = await response.json();
  const transcript = readGeminiTranscript(payload);

  if (isImplausiblyFastTranscript(transcript, params.audioDurationMs)) {
    throw new Error('Gemini transcription fallback returned more speech than the audio contains');
  }

  return {
    transcript,
    provider: 'gemini-fallback',
    model,
    latencyMs: Date.now() - startedAt,
    tokensUsed: Number(payload?.usageMetadata?.totalTokenCount) || 0,
    attempts: 1,
    recoveredByVadRetry: false,
  };
}

function buildGeminiTranscriptionPrompt(params: { browserTranscriptHint?: string }): string {
  // The examiner's question is deliberately NOT supplied. Given the question
  // and a silent or unintelligible clip, the model composes a fluent answer to
  // it and returns that as the "transcript" — learners saw whole paragraphs
  // they never spoke. Only the live-caption preview is passed now, because it
  // is itself derived from the learner's audio rather than from the prompt.
  const browserHint = compactTranscript(params.browserTranscriptHint).slice(0, 1000);
  const instruction =
    "Transcribe this English speaking-test answer verbatim. Return only the words actually spoken, with ordinary punctuation. Preserve the learner's wording and grammatical mistakes. Never guess at, complete, or compose an answer: if the audio is silent, noise-only, or otherwise unintelligible, return exactly (Inaudible).";

  return browserHint
    ? `${instruction}\n\nA fallible live-caption preview of the same audio was: ${browserHint}\nUse it only to resolve unclear sounds; ignore it entirely if it disagrees with what you hear.`
    : instruction;
}

function readGeminiTranscript(payload: any): string {
  const transcript = compactTranscript(payload?.candidates?.[0]?.content?.parts?.[0]?.text);
  const isInaudible = new Set(['', '(Inaudible)']).has(transcript);
  if (isInaudible) {
    throw new Error('Gemini transcription fallback returned no intelligible speech');
  }
  return transcript;
}

function toHalfBand(score: number): number {
  return Math.round(score * 2) / 2;
}

export function mapAzureScoreToProvisionalIeltsBand(score: number): number {
  const bounded = Math.max(0, Math.min(100, score));
  return Math.max(1, Math.min(9, toHalfBand(1 + bounded * 0.08)));
}

export function buildAzurePronunciationUrl(endpoint: string): string {
  const base = endpoint.replace(/\/$/, '');
  const recognitionPath = '/speech/recognition/conversation/cognitiveservices/v1';

  // Regional Speech endpoints already identify the STT service in the host.
  // Multi-service Cognitive endpoints instead require the /stt path prefix.
  return base.includes('.stt.speech.microsoft.com')
    ? `${base}${recognitionPath}`
    : `${base}/stt${recognitionPath}`;
}

export function resolveAzurePronunciationAssessment(node: any): Record<string, any> {
  if (!node || typeof node !== 'object') return {};

  const nested = node.PronunciationAssessment || node.PronAssessment;
  return nested && typeof nested === 'object' ? nested : node;
}

function severityForAccuracy(score: number): 'minor' | 'moderate' | 'major' {
  if (score < 45) return 'major';
  if (score < 65) return 'moderate';
  return 'minor';
}

function buildAzureWordFeedback(words: any[]) {
  return words
    .map((word) => {
      const assessment = resolveAzurePronunciationAssessment(word);
      const accuracy = Number(assessment?.AccuracyScore);
      if (!word?.Word || !Number.isFinite(accuracy) || accuracy >= 75) return null;
      return {
        word: String(word.Word).slice(0, 80),
        issue: `articulation accuracy ${Math.round(accuracy)}/100`,
        severity: severityForAccuracy(accuracy),
      };
    })
    .filter(Boolean)
    .slice(0, 8);
}

function buildAzureSoundFeedback(words: any[]) {
  const sounds = new Map<string, number>();
  for (const word of words) {
    for (const phoneme of word?.Phonemes || []) {
      const symbol = String(phoneme?.Phoneme || '').trim();
      const assessment = resolveAzurePronunciationAssessment(phoneme);
      const accuracy = Number(assessment?.AccuracyScore);
      if (symbol && Number.isFinite(accuracy) && accuracy < 65) {
        const previous = sounds.get(symbol);
        sounds.set(symbol, previous === undefined ? accuracy : Math.min(previous, accuracy));
      }
    }
  }
  return Array.from(sounds.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 6)
    .map(([sound]) => `/${sound}/`);
}

export async function assessPronunciationWithAzure(params: {
  endpoint: string;
  apiKey: string;
  wavBase64: string;
  transcript: string;
  durationMs: number;
}) {
  const startedAt = Date.now();
  const config = {
    ReferenceText: params.transcript.slice(0, 2000),
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: 'False',
  };
  const configBytes = new TextEncoder().encode(JSON.stringify(config));
  const pronunciationHeader = btoa(String.fromCharCode(...configBytes));
  const endpoint = buildAzurePronunciationUrl(params.endpoint);
  const audio = Uint8Array.from(atob(params.wavBase64), (char) => char.charCodeAt(0));
  const response = await fetch(`${endpoint}?language=en-GB&format=detailed`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': params.apiKey,
      'Pronunciation-Assessment': pronunciationHeader,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      Accept: 'application/json',
    },
    body: audio,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Azure pronunciation assessment failed (${response.status}): ${body.slice(0, 300)}`
    );
  }

  const payload = await response.json();
  const best = payload?.NBest?.[0];
  const assessment = resolveAzurePronunciationAssessment(best);
  const accuracyScore = Number(assessment?.AccuracyScore);
  const fluencyScore = Number(assessment?.FluencyScore);
  const pronunciationScore = Number(assessment?.PronScore ?? assessment?.PronunciationScore);
  if (![accuracyScore, fluencyScore, pronunciationScore].every(Number.isFinite)) {
    const status = String(payload?.RecognitionStatus || payload?.recognitionStatus || 'unknown');
    const bestKeys = best && typeof best === 'object' ? Object.keys(best).slice(0, 12) : [];
    const assessmentKeys =
      assessment && typeof assessment === 'object' ? Object.keys(assessment).slice(0, 12) : [];
    throw new Error(
      `Azure pronunciation assessment returned incomplete scores (status=${status}; best=${bestKeys.join('|') || 'none'}; assessment=${assessmentKeys.join('|') || 'none'})`
    );
  }

  const conservativeScore = Math.min(
    pronunciationScore,
    accuracyScore * 0.65 + fluencyScore * 0.35
  );
  const words = Array.isArray(best?.Words) ? best.Words : [];
  const durationMinutes = Math.max(0, params.durationMs) / 60000;

  return {
    provider: 'azure-speech',
    locale: 'en-GB',
    calibrationVersion: 'azure-hundred-v1-provisional',
    pronunciationScore: mapAzureScoreToProvisionalIeltsBand(conservativeScore),
    providerScores: {
      accuracy: Math.round(accuracyScore * 10) / 10,
      fluency: Math.round(fluencyScore * 10) / 10,
      pronunciation: Math.round(pronunciationScore * 10) / 10,
    },
    fluencyNotes: `Acoustic clarity ${Math.round(accuracyScore)}/100 and fluency ${Math.round(fluencyScore)}/100 in this sample.`,
    wordLevelFeedback: buildAzureWordFeedback(words),
    problematicSounds: buildAzureSoundFeedback(words),
    overallClarity: `Provisional acoustic estimate from a ${Math.round(params.durationMs / 1000)}-second sample.`,
    latencyMs: Date.now() - startedAt,
    durationMs: params.durationMs,
    estimatedCostUsd: (durationMinutes / 60) * AZURE_SPEECH_COST_PER_AUDIO_HOUR_USD,
  };
}

const ACKNOWLEDGEMENTS: Record<number, string[]> = {
  1: ['Thank you.', 'I see.', 'All right.', 'Thank you for that.'],
  2: ['Thank you for your response.'],
  3: ['Thank you.', 'That is an interesting point.', 'I see.', 'Thank you for explaining that.'],
};

export function cleanSpeakingQuestion(text: string, partNumber: number): string {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (partNumber !== 2) return clean;
  const marker = clean.toLowerCase().indexOf('you should say');
  return marker > 0 ? clean.slice(0, marker).trim() : clean;
}

export function buildDeterministicExaminerResponse(params: {
  partNumber: number;
  currentQuestionIndex: number;
  nextQuestion?: string | null;
  isLastQuestion: boolean;
}): string {
  if (params.isLastQuestion) {
    const farewells: Record<number, string> = {
      1: 'Thank you. That concludes Part 1 of the speaking test.',
      2: 'Thank you for your response. That brings us to the end of Part 2.',
      3: 'Thank you very much. That concludes the speaking test.',
    };
    return farewells[params.partNumber] || `Thank you. That concludes Part ${params.partNumber}.`;
  }

  const options = ACKNOWLEDGEMENTS[params.partNumber] || ACKNOWLEDGEMENTS[1];
  const acknowledgement = options[Math.abs(params.currentQuestionIndex) % options.length];
  const nextQuestion = cleanSpeakingQuestion(params.nextQuestion || '', params.partNumber);
  return nextQuestion ? `${acknowledgement} ${nextQuestion}` : acknowledgement;
}
