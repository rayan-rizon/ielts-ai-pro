import { describe, expect, it } from 'vitest';
import { createTestResultPdf } from '@/components/results/test-results-modal/testResultPdf';
import { createWritingReportPdf } from '@/features/testing/writing/utils/writingReportPdf';

describe('downloadable test result PDFs', () => {
  it('creates a Reading or Listening result PDF from the scored result data', () => {
    const { doc, filename } = createTestResultPdf({
      testType: 'reading',
      testTitle: 'Cambridge 21 Test 1',
      generatedAt: new Date('2026-07-29T00:00:00.000Z'),
      testResults: {
        bandScore: 6.5,
        correctAnswers: 28,
        totalQuestions: 40,
        percentage: 70,
        sectionStats: [{ title: 'Passage 1', correct: 10, total: 13 }],
        typeStats: { matching_headings: { correct: 4, total: 7 } },
      },
    });

    expect(
      new TextDecoder().decode(new Uint8Array(doc.output('arraybuffer')).slice(0, 8))
    ).toContain('%PDF-');
    expect(doc.getNumberOfPages()).toBe(1);
    expect(filename).toBe('reading-test-result.pdf');
  });

  it('uses the stored legacy score fields when an older result is opened', () => {
    const { doc } = createTestResultPdf({
      testType: 'listening',
      testResults: { band_score: 7, correct_answers: 30, total_questions: 40 },
    });

    expect(doc.getNumberOfPages()).toBe(1);
    expect(
      new TextDecoder().decode(new Uint8Array(doc.output('arraybuffer')).slice(0, 8))
    ).toContain('%PDF-');
  });

  it('creates a Writing report from saved AI feedback', () => {
    const { doc, filename } = createWritingReportPdf({
      generatedAt: new Date('2026-07-29T00:00:00.000Z'),
      feedbacks: {
        'Task 2': {
          overallBand: 6.5,
          summary: 'Your position is clear and your examples are relevant.',
          criteriaScores: {
            TaskResponse: 6.5,
            CoherenceAndCohesion: 6,
            LexicalResource: 6.5,
            GrammaticalRangeAndAccuracy: 6,
          },
          strengths: ['Clear position throughout the response.'],
          priorities: [{ action: 'Check subject and verb agreement before submitting.' }],
          corrections: [{ original: 'people is', correction: 'people are' }],
        },
      },
    });

    expect(
      new TextDecoder().decode(new Uint8Array(doc.output('arraybuffer')).slice(0, 8))
    ).toContain('%PDF-');
    expect(filename).toBe('writing-report.pdf');
  });

  it('never invents a score and keeps long advice and the essay inside the page', () => {
    const { doc } = createWritingReportPdf({
      generatedAt: new Date('2026-10-13T00:00:00.000Z'),
      feedbacks: {
        'Task 1': {
          taskType: 'Task 1',
          overallBand: 7,
          summary: 'Clearly sequenced, but a few unsupported details.',
          criteriaScores: { TaskAchievement: 7, CoherenceAndCohesion: 7 },
          annotations: [
            {
              originalText: 'saturating the atmosphere',
              type: 'clarity',
              severity: 'warning',
              suggestion:
                'Describe the rainfall without claiming the atmosphere becomes saturated.',
              replacementText: '',
              explanation: 'The diagram shows rain but not saturation.',
            },
          ],
          taskAnalysis: {
            visualType: 'process diagram',
            responseVisualType: 'process diagram',
            alignment: 'aligned',
            visualReadable: true,
            observedFeatures: ['Seven numbered stages'],
            limitations: '',
          },
          paragraphNotes: [{ opening: 'The diagram illustrates the', note: 'Clear introduction.' }],
          originalSource: `<p>The diagram illustrates the process. ${'Moist air rises and cools. '.repeat(300)}</p><p>Overall, there are seven stages.</p>`,
        },
      },
    });

    const text = doc.internal.pages
      .slice(1)
      .map((page) => (Array.isArray(page) ? page.join('\n') : ''))
      .join('\n');
    // Only the two criteria that were scored appear; nothing is filled in.
    expect(text).toContain('(Task Achievement)');
    expect(text).toContain('(Coherence and Cohesion)');
    expect(text).not.toContain('(Lexical Resource)');
    // Advice is printed as advice, and the paragraph note follows the essay.
    expect(text).toContain('Suggestion: Describe the rainfall');
    expect(text).toContain('Note: Clear introduction.');
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
