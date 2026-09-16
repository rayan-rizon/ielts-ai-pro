type FunctionInvocationError = {
  context?: unknown;
  message?: unknown;
};

/**
 * Supabase wraps every non-2xx Function response in a FunctionHttpError. Its
 * safe JSON response lives in `context`, not directly on the error object.
 */
export async function readTranscriptionInvocationError(
  error: FunctionInvocationError
): Promise<string> {
  const context = error?.context;

  if (context && typeof (context as Response).clone === 'function') {
    const payload = await (context as Response)
      .clone()
      .json()
      .catch(() => null);
    if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  }

  return typeof error?.message === 'string' && error.message.trim()
    ? error.message
    : 'Transcription could not be started.';
}
