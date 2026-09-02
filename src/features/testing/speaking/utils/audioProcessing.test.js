import { describe, expect, it } from 'vitest';
import { shouldRequestPronunciationSample } from './audioProcessing';

describe('shouldRequestPronunciationSample', () => {
  it('selects one representative sample from Parts 1 and 3 only', () => {
    expect(
      shouldRequestPronunciationSample({ partNumber: 1, durationMs: 10000, existingSamples: {} })
    ).toBe(true);
    expect(
      shouldRequestPronunciationSample({ partNumber: 2, durationMs: 10000, existingSamples: {} })
    ).toBe(false);
    expect(
      shouldRequestPronunciationSample({ partNumber: 3, durationMs: 10000, existingSamples: {} })
    ).toBe(true);
  });

  it('rejects samples outside the six-to-thirty-second assessment window', () => {
    expect(
      shouldRequestPronunciationSample({ partNumber: 1, durationMs: 5999, existingSamples: {} })
    ).toBe(false);
    expect(
      shouldRequestPronunciationSample({ partNumber: 3, durationMs: 30001, existingSamples: {} })
    ).toBe(false);
  });

  it('does not purchase a second Azure sample for the same part', () => {
    expect(
      shouldRequestPronunciationSample({
        partNumber: 1,
        durationMs: 12000,
        existingSamples: { 1: [{ provider: 'azure-speech' }] },
      })
    ).toBe(false);
  });
});
