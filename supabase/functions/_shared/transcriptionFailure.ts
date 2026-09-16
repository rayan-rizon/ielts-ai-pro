export function transcriptionFailureResponse(error: unknown): {
  status: number;
  body: { error: string; success: false; code: string };
} {
  const message = error instanceof Error ? error.message : String(error || '');

  if (/Gemini API error:\s*429\b/.test(message)) {
    return {
      status: 503,
      body: {
        error:
          'Google Gemini transcription is temporarily unavailable because its project spending cap has been reached.',
        success: false,
        code: 'google_gemini_spend_cap_reached',
      },
    };
  }

  return {
    status: 500,
    body: {
      error: 'We could not transcribe this audio. Please try again.',
      success: false,
      code: 'transcription_failed',
    },
  };
}
