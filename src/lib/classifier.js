const CLASSIFIER_URL = 'https://classifier.dev';

/**
 * Batch text classification via classifier.dev (keyless HTTP API).
 * Returns `results` in input order, or `[]` on any failure — callers treat
 * this as a best-effort hint, never a blocking dependency.
 */
export async function classifyTexts({ inputs, labels, instructions } = {}) {
  if (!inputs?.length || !labels?.length) return [];
  try {
    const response = await fetch(CLASSIFIER_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ labels, inputs, instructions }),
    });
    if (!response.ok) return [];
    const { results } = await response.json();
    return results ?? [];
  } catch {
    return [];
  }
}
