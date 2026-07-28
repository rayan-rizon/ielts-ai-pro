import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'supabase/functions/evaluateGrammarTransfer/index.ts'),
  'utf8'
);

describe('Grammar transfer evaluator safeguards', () => {
  it('requires paid access and reuses Writing or Speaking quota', () => {
    expect(source).toContain("['pro', 'premium', 'admin']");
    expect(source).toContain("new Set(['writing', 'speaking'])");
    expect(source).toContain('reserveDatabaseQuota');
    expect(source).toContain("'generateDetailedFeedback'");
    expect(source).toContain("'processSpeakingSession_start'");
    expect(source).toContain("sourceEndpoint: 'evaluateGrammarTransfer'");
  });

  it('grounds every observation in an exact learner quote', () => {
    expect(source).toContain('sourceText.includes(quote)');
    expect(source).toContain('Every claimed error must include an exact verbatim quote');
    expect(source).toContain('evidenceQuotes');
    expect(source).toContain('text.replace(example.quote, example.correction)');
  });

  it('forbids IELTS bands and spoken claims unsupported by the transcript', () => {
    expect(source).toContain('Never output an IELTS band');
    expect(source).toContain('Do not judge pronunciation');
    expect(source).toContain(
      'Do not treat punctuation, capitalization, spelling, or a likely transcription error as spoken grammar evidence'
    );
    expect(source).toContain('transcriptCaveat');
  });

  it('stores transfer evidence separately from deterministic mastery', () => {
    expect(source).toContain('transfer_evaluation');
    expect(source).not.toContain("from('skill_proficiency')");
  });
});
