import { describe, expect, it } from 'vitest';

import { createSpeakingReportPdf } from './speakingReportPdf';
import { buildSpeakingReportSummary } from './speakingReportSummary';

const completeEvaluation = {
  overallBand: 6.5,
  scoreBasis: 'audio',
  fluency: 6,
  lexical: 7,
  grammar: 6.5,
  pronunciation: 6.5,
  feedback:
    'You communicate clearly on familiar and abstract topics. Your answers would be stronger with more specific supporting examples.',
  targetBandTips:
    'Develop each main idea with one reason and one concrete example before moving on.',
  criterionNotes: {
    fluency: 'Generally fluent, but pauses sometimes interrupt longer explanations.',
    lexical: 'Uses a useful range of topic vocabulary with occasional repetition.',
    grammar: 'Mixes simple and complex forms, although accuracy is inconsistent.',
    pronunciation: 'Usually clear with a few imprecise sounds under pressure.',
  },
  strengths: [
    'Answered questions directly and stayed on topic.',
    'Answered questions directly and stayed on topic.',
    'Used relevant vocabulary for familiar subjects.',
  ],
  improvements: [
    {
      criterion: 'Development',
      suggestion: 'Extend each answer with a reason and a specific example.',
    },
    {
      criterion: 'Fluency',
      suggestion: 'Reduce mid-sentence pauses by rehearsing common topic structures.',
    },
  ],
  partScores: {
    part1: { band: 6.5, keyObservation: 'Direct and relevant short answers.' },
    part2: { band: 6, keyObservation: 'The long turn needed more supporting detail.' },
    part3: { band: 6.5, keyObservation: 'Ideas were relevant but sometimes underdeveloped.' },
  },
};

describe('speaking report summary', () => {
  it('creates one concise source of truth without duplicate strengths', () => {
    const summary = buildSpeakingReportSummary(completeEvaluation);

    expect(summary.overallScore).toBe(6.5);
    expect(summary.criteria).toHaveLength(4);
    expect(summary.strengths).toEqual([
      'Answered questions directly and stayed on topic.',
      'Used relevant vocabulary for familiar subjects.',
    ]);
    expect(summary.improvements).toHaveLength(2);
    expect(summary.parts.map((part) => part.band)).toEqual([6.5, 6, 6.5]);
    expect(summary.showTargetTip).toBe(true);
  });

  it('keeps the three part cards visible when an older report has no saved part scores', () => {
    const summary = buildSpeakingReportSummary({
      overallBand: 5,
      scoreBasis: 'transcript',
      fluency: 5,
      lexical: 5,
      grammar: 5,
      feedback: 'The transcript supports only a limited estimate.',
    });

    expect(summary.isTranscriptEstimate).toBe(true);
    expect(summary.criteria.map((criterion) => criterion.key)).not.toContain('pronunciation');
    expect(summary.parts).toHaveLength(3);
    expect(summary.parts.map((part) => part.band)).toEqual([null, null, null]);
    expect(summary.parts[0].observation).toBe(
      'A part score was not saved for this completed session.'
    );
  });

  it('normalizes scalar and legacy part-score shapes', () => {
    const summary = buildSpeakingReportSummary({
      overallBand: 5,
      part_scores: {
        1: 4,
        part_2: { score: '5', observation: 'A longer response was available.' },
        'Part 3': { overallBand: 4.5, note: 'Relevant but underdeveloped ideas.' },
      },
    });

    expect(summary.parts.map((part) => part.band)).toEqual([4, 5, 4.5]);
    expect(summary.parts[1].observation).toBe('A longer response was available.');
  });

  it('generates a concise PDF and a safe filename without deep-dive data', () => {
    const { doc, filename, summary } = createSpeakingReportPdf({
      finalEvaluation: completeEvaluation,
      testTitle: 'Cambridge 21 / Speaking Test 1',
      generatedAt: new Date('2026-07-23T00:00:00.000Z'),
      detailedFeedback: [{ question: 'This must not be exported.' }],
    });
    const pdfBytes = new Uint8Array(doc.output('arraybuffer'));

    expect(new TextDecoder().decode(pdfBytes.slice(0, 8))).toContain('%PDF-');
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(filename).toBe('speaking-report-6.5.pdf');
    expect(summary).not.toHaveProperty('detailedFeedback');
  });

  it('exports the full report, answers included, across as many pages as it needs', () => {
    const conversation = { 1: [], 2: [], 3: [] };
    const questions = [];
    [1, 2, 3].forEach((part) => {
      for (let index = 1; index <= 5; index += 1) {
        const answer = `Part ${part} answer ${index}: I think it is good because it helps people a lot in their daily lives.`;
        conversation[part].push({ speaker: 'ai', text: `Question ${index} for part ${part}?` });
        conversation[part].push({ speaker: 'user', text: answer, durationMs: 9000 });
        questions.push({
          part,
          question: `Question ${index} for part ${part}?`,
          candidateAnswer: answer,
          grammaticalErrors: [
            { incorrect: 'it is good', correct: "it's useful", explanation: 'More exact word.' },
          ],
          topicDrift: 'null',
          suggestedAnswer: 'A longer, natural answer with a reason and an example from daily life.',
          feedback: 'Add a reason.',
          why: 'It adds a reason and an example.',
        });
      }
    });

    const { doc, filename } = createSpeakingReportPdf({
      finalEvaluation: completeEvaluation,
      testTitle: 'Cambridge 21 – Speaking Test 1',
      allPartsConversation: conversation,
      detailedFeedback: questions,
      generatedAt: new Date('2026-10-11T00:00:00.000Z'),
    });

    expect(doc.getNumberOfPages()).toBeGreaterThan(2);
    expect(filename).toBe('speaking-report-6.5.pdf');
  });

  it('preserves full multi-sentence feedback without mid-sentence truncation', () => {
    const feedbackText =
      'The candidate provided very brief and underdeveloped responses across all parts of the test, significantly limiting the demonstration of fluency and coherence. Vocabulary and grammatical structures were basic, with frequent errors that impacted overall communication.';

    const summary = buildSpeakingReportSummary({
      overallBand: 5.5,
      feedback: feedbackText,
    });

    expect(summary.conciseFeedback).toBe(feedbackText);
    expect(summary.conciseFeedback).not.toContain('...');
  });
});
