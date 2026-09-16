import { describe, expect, it } from 'vitest';
import { readTranscriptionInvocationError } from '@/components/admin/tests/creation/transcriptionError';
import { transcriptionFailureResponse } from '../../../supabase/functions/_shared/transcriptionFailure';

describe('readTranscriptionInvocationError', () => {
  it('preserves the safe provider-cap explanation returned by a non-2xx Edge Function', async () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: new Response(
        JSON.stringify({
          error:
            'Google Gemini transcription is temporarily unavailable because its project spending cap has been reached.',
          code: 'google_gemini_spend_cap_reached',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ),
    };

    await expect(readTranscriptionInvocationError(error)).resolves.toBe(
      'Google Gemini transcription is temporarily unavailable because its project spending cap has been reached.'
    );
  });

  it('falls back to the invocation message when no safe response body exists', async () => {
    await expect(
      readTranscriptionInvocationError({ message: 'Edge Function returned a non-2xx status code' })
    ).resolves.toBe('Edge Function returned a non-2xx status code');
  });
});

describe('transcriptionFailureResponse', () => {
  it('does not disguise an exhausted Google provider cap as an internal function error', () => {
    expect(transcriptionFailureResponse(new Error('Gemini API error: 429 - exhausted'))).toEqual({
      status: 503,
      body: {
        error:
          'Google Gemini transcription is temporarily unavailable because its project spending cap has been reached.',
        success: false,
        code: 'google_gemini_spend_cap_reached',
      },
    });
  });
});
