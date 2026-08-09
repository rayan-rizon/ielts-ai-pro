import { describe, expect, it } from 'vitest';

import {
  buildAverageSpeakingEvaluation,
  buildConversationHistory,
  buildCueCardTopic,
  buildInitialSpeakingConversation,
  buildLegacySpeakingEvaluation,
  buildLocalDevSpeakingResponse,
  buildPartContexts,
  buildSpeakingResumeState,
  formatIeltsQuestion,
  getQuestionLines,
  isSilentSpeechMetadata,
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

  it('seeds a new session with the opening prompt before audio playback finishes', () => {
    expect(
      buildInitialSpeakingConversation({
        greeting: 'Welcome to the test.',
        currentPart: { questions: 'Do you work or study? [Why / Why not?]' },
      })
    ).toEqual([
      { speaker: 'ai', text: 'Welcome to the test.' },
      { speaker: 'ai', text: 'Do you work or study? (Why or why not?)' },
    ]);
  });

  it('repairs an empty saved session with its current question', () => {
    expect(
      buildSpeakingResumeState({
        conversation: [],
        currentQuestionIndex: -1,
        currentPart: { questions: 'Do you work or study?\nWhat do you enjoy about it?' },
      })
    ).toEqual({
      conversation: [{ speaker: 'ai', text: 'Do you work or study?' }],
      currentQuestionIndex: 0,
      resumePrompt: 'Do you work or study?',
      repaired: true,
    });
  });

  it('restores the first question when navigation interrupted the opening greeting', () => {
    expect(
      buildSpeakingResumeState({
        conversation: [{ speaker: 'ai', text: 'Welcome to the test.' }],
        currentQuestionIndex: 0,
        currentPart: { questions: 'Do you work or study?' },
      })
    ).toEqual({
      conversation: [
        { speaker: 'ai', text: 'Welcome to the test.' },
        { speaker: 'ai', text: 'Do you work or study?' },
      ],
      currentQuestionIndex: 0,
      resumePrompt: 'Do you work or study?',
      repaired: true,
    });
  });

  it('removes stale loading messages and preserves a valid resumed turn', () => {
    expect(
      buildSpeakingResumeState({
        conversation: [
          { speaker: 'ai', text: 'What do you enjoy about it?' },
          { speaker: 'user', text: '...', isLoading: true },
        ],
        currentQuestionIndex: 1,
        currentPart: { questions: 'Do you work or study?\nWhat do you enjoy about it?' },
      })
    ).toEqual({
      conversation: [{ speaker: 'ai', text: 'What do you enjoy about it?' }],
      currentQuestionIndex: 1,
      repaired: true,
    });
  });

  it('restores the next question when a resumed conversation ends with the learner answer', () => {
    expect(
      buildSpeakingResumeState({
        conversation: [
          { speaker: 'ai', text: 'Do you work or study?' },
          { speaker: 'user', text: 'I am currently studying engineering.' },
        ],
        currentQuestionIndex: 0,
        currentPart: { questions: 'Do you work or study?\nWhat do you enjoy about it?' },
      })
    ).toEqual({
      conversation: [
        { speaker: 'ai', text: 'Do you work or study?' },
        { speaker: 'user', text: 'I am currently studying engineering.' },
        { speaker: 'ai', text: 'What do you enjoy about it?' },
      ],
      currentQuestionIndex: 1,
      resumePrompt: 'What do you enjoy about it?',
      repaired: true,
    });
  });

  it('does not repeat the answered question when the saved index already points forward', () => {
    const state = buildSpeakingResumeState({
      conversation: [
        { speaker: 'ai', text: 'Do you work or study?' },
        { speaker: 'user', text: 'I work as a designer.' },
      ],
      currentQuestionIndex: 1,
      currentPart: { questions: 'Do you work or study?\nWhat do you enjoy about it?' },
    });

    expect(state.currentQuestionIndex).toBe(1);
    expect(state.conversation.at(-1)).toEqual({
      speaker: 'ai',
      text: 'What do you enjoy about it?',
    });
  });

  it('recovers a completed part when the final saved entry answered its last question', () => {
    const state = buildSpeakingResumeState({
      conversation: [
        { speaker: 'ai', text: 'What do you enjoy about your work?' },
        { speaker: 'user', text: 'I enjoy solving difficult problems.' },
      ],
      currentQuestionIndex: 0,
      currentPart: { questions: 'What do you enjoy about your work?' },
    });

    expect(state).toMatchObject({
      currentQuestionIndex: 0,
      isPartComplete: true,
      repaired: true,
    });
    expect(state.conversation).toHaveLength(2);
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

  it('preserves per-part scores when restoring historical per-part evaluations', () => {
    const restored = buildAverageSpeakingEvaluation({
      part1: { overallBand: 4, feedback: 'Very brief answer.' },
      part2: { overallBand: 5, feedback: 'Some relevant development.' },
      part3: { overallBand: 4.5, feedback: 'Ideas needed more depth.' },
    });

    expect(restored.partScores).toEqual({
      part1: { band: 4, keyObservation: 'Very brief answer.' },
      part2: { band: 5, keyObservation: 'Some relevant development.' },
      part3: { band: 4.5, keyObservation: 'Ideas needed more depth.' },
    });
  });

  it('detects transcript failures shown to learners', () => {
    expect(isTranscriptError('')).toBe(true);
    expect(isTranscriptError('(Unable to transcribe - please try again)')).toBe(true);
    expect(isTranscriptError('(Inaudible)')).toBe(true);
    expect(isTranscriptError('I usually study in the evening.')).toBe(false);
  });

  it('recognizes silent recording metadata before uploading audio', () => {
    expect(isSilentSpeechMetadata({ speechDetected: false })).toBe(true);
    expect(isSilentSpeechMetadata({ speechDetected: false, liveTranscript: 'hello there' })).toBe(
      false
    );
    expect(isSilentSpeechMetadata({ speechDetected: true })).toBe(false);
    expect(isSilentSpeechMetadata({ speechDetected: null })).toBe(false);
  });
});
