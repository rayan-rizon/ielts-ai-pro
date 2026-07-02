import { describe, expect, it } from 'vitest';

import {
  buildAverageSpeakingEvaluation,
  buildConversationHistory,
  buildCueCardTopic,
  buildLegacySpeakingEvaluation,
  buildLocalDevSpeakingResponse,
  buildPartContexts,
  formatIeltsQuestion,
  getQuestionLines,
  isTranscriptError,
} from './speakingTestUtils';

describe('speakingTestUtils', () => {
  it('formats IELTS why/why not prompts consistently', () => {
    expect(formatIeltsQuestion('Do you like music? [Why / Why not?]')).toBe(
      'Do you like music? (Why or why not?)'
    );
    expect(formatIeltsQuestion('Do you prefer cities (why/why not?)')).toBe(
      'Do you prefer cities (Why or why not?)'
    );
  });

  it('normalizes question lines', () => {
    expect(getQuestionLines(' First question\n\nSecond question  ')).toEqual([
      'First question',
      'Second question',
    ]);
  });

  it('builds conversation history for the edge function', () => {
    expect(
      buildConversationHistory([
        { speaker: 'ai', text: 'Question' },
        { speaker: 'user', text: 'Answer' },
        { speaker: 'user', text: '...', isLoading: true },
      ])
    ).toEqual([
      { speaker: 'model', text: 'Question' },
      { speaker: 'user', text: 'Answer' },
    ]);
  });

  it('parses part 2 cue-card bullet points from JSON or newline text', () => {
    expect(
      buildCueCardTopic({
        title: 'Describe a journey',
        questions: JSON.stringify([{ question: 'Where you went' }, { text: 'Who you went with' }]),
      })
    ).toEqual({
      title: 'Describe a journey',
      bulletPoints: ['Where you went', 'Who you went with'],
    });

    expect(
      buildCueCardTopic({
        title: 'Describe a book',
        questions: 'What it was about\nWhy you liked it',
      })
    ).toEqual({
      title: 'Describe a book',
      bulletPoints: ['What it was about', 'Why you liked it'],
    });
  });

  it('falls back to default cue-card prompts when no bullets exist', () => {
    expect(buildCueCardTopic({ title: 'Describe something', questions: '' })).toEqual({
      title: 'Describe something',
      bulletPoints: [
        'What it is',
        'When it happened',
        'Who was involved',
        'Why it was important to you',
      ],
    });
  });

  it('builds the local development speaking fallback response', () => {
    const response = buildLocalDevSpeakingResponse({
      currentPart: { questions: 'Question 1\nQuestion 2' },
      currentPartNumber: 1,
      currentQuestionIndex: 0,
    });

    expect(response).toMatchObject({
      success: true,
      userTranscript: '(Your response was recorded)',
      examinerResponse: "That's very interesting. Can you tell me more about that? Question 2",
      nextQuestionIndex: 1,
      isPartComplete: false,
      totalQuestions: 2,
    });
  });

  it('marks final local development response complete with fallback evaluation', () => {
    const response = buildLocalDevSpeakingResponse({
      currentPart: { questions: 'Question 1\nQuestion 2' },
      currentPartNumber: 1,
      currentQuestionIndex: 1,
    });

    expect(response.nextQuestionIndex).toBe(-1);
    expect(response.isPartComplete).toBe(true);
    expect(response.evaluation.overallBand).toBe(6.5);
  });

  it('builds part contexts for evaluation requests', () => {
    expect(
      buildPartContexts({
        1: { title: 'Intro', questions: 'Q1' },
        2: { title: 'Cue card' },
      })
    ).toEqual({
      1: { title: 'Intro', questions: 'Q1' },
      2: { title: 'Cue card', questions: '' },
    });
  });

  it('reconstructs average and legacy evaluations', () => {
    expect(
      buildAverageSpeakingEvaluation([
        {
          fluency: 6,
          lexical: 7,
          grammar: 6,
          pronunciation: 7,
          overallBand: 6.5,
          strengths: ['A'],
        },
        {
          fluency: 7,
          lexical: 8,
          grammar: 7,
          pronunciation: 8,
          overallBand: 7.5,
          improvements: ['B'],
          feedback: 'Latest',
        },
      ])
    ).toMatchObject({
      fluency: 6.5,
      lexical: 7.5,
      grammar: 6.5,
      pronunciation: 7.5,
      overallBand: 7,
      feedback: 'Latest',
      strengths: ['A'],
      improvements: ['B'],
    });

    expect(buildLegacySpeakingEvaluation('6.5')).toMatchObject({
      overallBand: 6.5,
      assessmentStatus: 'legacy',
      strengths: [],
      improvements: [],
    });
  });

  it('detects transcript failures shown to learners', () => {
    expect(isTranscriptError('')).toBe(true);
    expect(isTranscriptError('(Unable to transcribe - please try again)')).toBe(true);
    expect(isTranscriptError('(Inaudible)')).toBe(true);
    expect(isTranscriptError('I usually study in the evening.')).toBe(false);
  });
});
