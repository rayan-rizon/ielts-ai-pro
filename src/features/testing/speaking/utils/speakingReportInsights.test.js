import { describe, expect, it } from 'vitest';

import { describeSound } from './speakingDrillLibrary';
import { normalizePdfText } from './speakingReportPdf';

import {
  attachFeedback,
  buildCriteriaList,
  buildDelivery,
  checkRehearsal,
  deriveTopFix,
  extractAnswers,
  findHoldingBack,
  findRepeatedWord,
  lengthBasis,
  lengthStatus,
  markAnswer,
  selectPracticeDrills,
} from './speakingReportInsights';

const conversation = {
  1: [
    { speaker: 'ai', text: "Hello! Welcome to the IELTS Speaking test. Let's begin." },
    { speaker: 'ai', text: 'Where do you go to get a haircut?' },
    { speaker: 'user', text: 'I go to the salon nearest salon for my hair cut.', durationMs: 5000 },
    { speaker: 'ai', text: 'Thank you. Have you changed your hairstyle recently?' },
    { speaker: 'user', text: "No, I haven't changed my hair style recently.", durationMs: 4000 },
    { speaker: 'ai', text: 'I see. Do you enjoy going to the barber?' },
    {
      speaker: 'user',
      text: 'Yes I do because it is relaxing, for example last month I went with my brother and we talked for an hour about football and our plans.',
      durationMs: 24000,
    },
    { speaker: 'user', text: '(Failed to transcribe)', error: true },
  ],
  2: [
    { speaker: 'ai', text: "Now it's time for Part 2, the Individual Long Turn." },
    { speaker: 'user', text: 'I want to talk about a time I changed my look.', durationMs: 30000 },
    { speaker: 'user', text: 'It was before my cousin wedding.', durationMs: 15000 },
  ],
};

describe('speaking report insights', () => {
  it('pairs answers with their question, strips acknowledgements and merges a split long turn', () => {
    const answers = extractAnswers(conversation, {
      partTwoTopic: 'Describe a time you changed your appearance',
    });

    expect(answers.map((answer) => answer.id)).toEqual(['p1-q1', 'p1-q2', 'p1-q3', 'p2-q1']);
    expect(answers[1].question).toBe('Have you changed your hairstyle recently?');
    expect(answers[2].question).toBe('Do you enjoy going to the barber?');
    expect(answers[3]).toMatchObject({
      isLongTurn: true,
      question: 'Describe a time you changed your appearance',
      durationMs: 45000,
    });
  });

  it('measures length by time only when every answer has a duration', () => {
    const answers = extractAnswers(conversation);
    expect(lengthBasis(answers)).toBe('time');
    expect(lengthStatus(answers[0], 'time')).toBe('very-short');
    expect(lengthStatus(answers[2], 'time')).toBe('ok');
    expect(lengthStatus(answers[3], 'time')).toBe('very-short');

    const untimed = extractAnswers({ 1: [{ speaker: 'user', text: 'Short answer.' }] });
    expect(lengthBasis(untimed)).toBe('words');
  });

  it('never reports pace or clarity it did not measure', () => {
    const delivery = buildDelivery(
      extractAnswers({ 1: [{ speaker: 'user', text: 'Hi there.' }] }),
      {}
    );
    expect(delivery.speakingMs).toBeNull();
    expect(delivery.wordsPerMinute).toBeNull();
    expect(delivery.clarity).toBeNull();

    const measured = buildDelivery(extractAnswers(conversation), {
      1: [{ provider: 'azure-speech', providerScores: { accuracy: 70 } }],
      2: [{ provider: 'azure-speech', providerScores: { accuracy: 80 } }],
    });
    expect(measured.speakingMs).toBe(78000);
    expect(measured.clarity).toBe(75);
    expect(measured.wordsPerMinute).toBeGreaterThan(40);
  });

  it('attaches deep-dive feedback to the answer it quotes, not by position', () => {
    const answers = attachFeedback(extractAnswers(conversation), [
      {
        part: 1,
        question: 'Have you changed your hairstyle recently?',
        candidateAnswer: "No, I haven't changed my hair style recently.",
        grammaticalErrors: [],
        topicDrift: 'null',
        suggestedAnswer: 'No, I have kept the same cut for years because it suits me.',
        feedback: 'Add a reason.',
        issue: 'no_reason',
      },
    ]);
    expect(answers[0].feedback).toBeNull();
    expect(answers[1].feedback.issue).toBe('no_reason');
  });

  it('picks short answers as the next step when most answers are under target', () => {
    const answers = extractAnswers(conversation);
    const criteria = buildCriteriaList({ fluency: 5, lexical: 5, grammar: 5.5, pronunciation: 6 });
    const fix = deriveTopFix({ answers, basis: 'time', criteria });

    expect(fix.issue).toBe('too_short');
    expect(fix.evidence).toBe('3 of your 4 answers were shorter than the target.');
    expect(fix.answer.id).toBe('p1-q2');
  });

  it('names the lowest criterion and recognises level scores', () => {
    expect(
      findHoldingBack(buildCriteriaList({ fluency: 6, lexical: 5.5, grammar: 6 }))
    ).toMatchObject({
      key: 'lexical',
      level: false,
    });
    expect(
      findHoldingBack(buildCriteriaList({ fluency: 6, lexical: 6, grammar: 6 }))
    ).toMatchObject({
      level: true,
    });
  });

  it('builds a three-drill plan led by the drill behind the next step', () => {
    const answers = extractAnswers(conversation);
    const criteria = buildCriteriaList({ fluency: 5, lexical: 5, grammar: 5.5, pronunciation: 6 });
    const topFix = deriveTopFix({ answers, basis: 'time', criteria });
    const drills = selectPracticeDrills({
      answers,
      basis: 'time',
      criteria,
      delivery: buildDelivery(answers, {}),
      sounds: ['/θ/'],
      topFix,
    });

    expect(drills).toHaveLength(3);
    expect(drills[0].id).toBe('answer_reason_example');
    expect(drills.map((drill) => drill.id)).toContain('part2_full_turn');
    expect(new Set(drills.map((drill) => drill.id)).size).toBe(3);
  });

  it('only flags a repeated word when it carries real weight', () => {
    expect(findRepeatedWord([{ text: 'Football football football football is fun' }])).toEqual({
      word: 'football',
      times: 4,
    });
    expect(findRepeatedWord([{ text: 'I really really really really think so' }])).toBeNull();
  });

  it('marks grammar corrections and unclear words without overlapping them', () => {
    const segments = markAnswer('I go to the salon nearest salon for my hair cut.', {
      errors: [{ incorrect: 'the salon nearest salon', correct: 'the nearest salon' }],
      flaggedWords: [
        { word: 'salon', issue: 'unclear vowel' },
        { word: 'hair', issue: 'dropped h' },
      ],
    });
    const kinds = segments.map((segment) => segment.kind);

    expect(kinds).toEqual(['text', 'error', 'text', 'word', 'text']);
    expect(segments[1].text).toBe('the salon nearest salon');
    expect(segments[3].text).toBe('hair');
    expect(segments.map((segment) => segment.text).join('')).toBe(
      'I go to the salon nearest salon for my hair cut.'
    );
  });

  it('self-checks a re-answer for length, reason, example and repeated mistakes', () => {
    const [answer] = attachFeedback(extractAnswers(conversation), [
      {
        part: 1,
        question: 'Where do you go to get a haircut?',
        candidateAnswer: 'I go to the salon nearest salon for my hair cut.',
        grammaticalErrors: [{ incorrect: 'salon nearest salon', correct: 'nearest salon' }],
        topicDrift: 'null',
        suggestedAnswer: '',
        feedback: '',
      },
    ]);
    const result = checkRehearsal({
      answer,
      issues: ['too_short', 'grammar'],
      transcript:
        'I usually go to the nearest salon because it is close, for example last week I walked there in five minutes.',
      seconds: 24,
    });

    expect(result.checks.map((check) => [check.id, check.pass])).toEqual([
      ['length', true],
      ['reason', true],
      ['example', true],
      ['grammar', true],
    ]);

    const timingOnly = checkRehearsal({
      answer,
      issues: ['too_short'],
      transcript: '',
      seconds: 8,
    });
    expect(timingOnly.hasTranscript).toBe(false);
    expect(timingOnly.checks).toHaveLength(1);
    expect(timingOnly.checks[0].pass).toBe(false);
  });

  it('explains phonetic symbols in plain words, and spells them out for the PDF font', () => {
    expect(describeSound('/θ/')).toBe('/θ/ (“th” in “think”)');
    expect(describeSound('/q/')).toBe('/q/');
    expect(normalizePdfText(describeSound('/θ/'))).toBe('/th/ ("th" in "think")');
  });
});
