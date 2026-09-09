import { describe, expect, it } from 'vitest';

import {
  buildHighlightedTranscript,
  buildSourceTranscriptHighlights,
  buildTranscriptAnswerHighlights,
} from '@/features/testing/listening/components/ListeningTest/utils/transcriptPresentation';

describe('Listening transcript answer presentation', () => {
  it('highlights the spoken answer once and attaches its question number', () => {
    const segments = [
      { id: 1, text: 'I read about you in the newspaper.' },
      { id: 2, text: 'The newspaper is delivered every morning.' },
    ];
    const answersMap = {
      q2: { questionNumber: 2, correctAnswer: 'newspaper', isCorrect: true },
    };

    const highlighted = buildHighlightedTranscript(segments, answersMap);

    expect(highlighted[0].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'newspaper',
        questionNumber: 2,
        showBadge: true,
      })
    );
    expect(highlighted[1].displayParts.every((part) => part.questionNumber === null)).toBe(true);
  });

  it('supports official answer alternatives but ignores non-text placeholders', () => {
    const highlights = buildTranscriptAnswerHighlights({
      q5: { questionNumber: 5, correctAnswer: 'castle / Hearst Castle' },
      missing: { questionNumber: 6, correctAnswer: '—' },
    });

    expect(highlights).toHaveLength(1);
    expect(highlights[0].questionNumber).toBe(5);
    expect(highlights[0].variations).toEqual(expect.arrayContaining(['castle', 'hearst castle']));
  });

  it('uses every source-image evidence phrase, including repeated question numbers', () => {
    const sourceHighlights = [
      { question_number: 22, phrase: 'housing for different generations living together' },
      { question_number: 22, phrase: "Let's go with that" },
    ];
    const highlights = buildSourceTranscriptHighlights(sourceHighlights);
    const segments = [
      { id: 1, text: 'How about housing for different generations living together?' },
      { id: 2, text: "Let's go with that." },
    ];

    const highlighted = buildHighlightedTranscript(segments, {}, sourceHighlights);

    expect(highlights).toHaveLength(2);
    expect(highlighted[0].displayParts.some((part) => part.questionNumber === 22)).toBe(true);
    expect(highlighted[1].displayParts.some((part) => part.questionNumber === 22)).toBe(true);
  });

  it('matches source evidence when transcript punctuation differs', () => {
    const highlighted = buildHighlightedTranscript(
      [{ start: 0, end: 4, text: 'The internal walls are movable, so the space can change.' }],
      {},
      [{ question_number: 26, phrase: 'The internal walls are movable.' }]
    );

    expect(highlighted[0].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'The internal walls are movable',
        questionNumber: 26,
        showBadge: true,
      })
    );
  });

  it('matches repeated short source phrases in transcript order', () => {
    const highlighted = buildHighlightedTranscript(
      [
        { id: 1, text: "Well, actually, I don't have loads of time, so." },
        { id: 2, text: 'There are too many of them.' },
        { id: 3, text: 'Well,' },
        {
          id: 4,
          text: "I think we have enough clothing shops, but there's only one place that sells books at the moment.",
        },
      ],
      {},
      [
        { question_number: 7, phrase: 'There are too many of them.' },
        { question_number: 8, phrase: 'Well,', show_badge: false },
        {
          question_number: 8,
          phrase:
            "I think we have enough clothing shops, but there's only one place that sells books at the moment.",
        },
      ]
    );

    expect(highlighted[0].displayParts.every((part) => part.questionNumber === null)).toBe(true);
    expect(highlighted[2].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'Well',
        questionNumber: 8,
        showBadge: false,
      })
    );
    expect(highlighted[3].displayParts).toContainEqual(
      expect.objectContaining({
        text: "I think we have enough clothing shops, but there's only one place that sells books at the moment",
        questionNumber: 8,
        showBadge: true,
      })
    );
  });

  it('uses the manually selected transcript segment when evidence text repeats', () => {
    const highlighted = buildHighlightedTranscript(
      [
        { id: 1, sourceIndex: 0, text: 'That is the answer.' },
        { id: 2, sourceIndex: 1, text: 'That is the answer.' },
      ],
      {},
      [{ question_number: 8, phrase: 'That is the answer.', source_index: 1 }]
    );

    expect(highlighted[0].displayParts.every((part) => part.questionNumber === null)).toBe(true);
    expect(highlighted[1].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'That is the answer',
        questionNumber: 8,
        showBadge: true,
      })
    );
  });

  it('renders grouped source-image question badges as one evidence mark', () => {
    const sourceHighlights = [
      {
        question_numbers: [21, 22],
        phrase: 'the lecture focused on more long-term issues',
      },
    ];

    const highlighted = buildHighlightedTranscript(
      [{ id: 1, text: 'The lecture focused on more long-term issues.' }],
      {},
      sourceHighlights
    );

    expect(highlighted[0].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'The lecture focused on more long-term issues',
        questionNumber: 21,
        questionNumbers: [21, 22],
        showBadge: true,
      })
    );
  });

  it('fills question numbers missing from source-image metadata with scored answers', () => {
    const highlighted = buildHighlightedTranscript(
      [
        { id: 1, text: 'The wider evidence phrase mentions a newspaper.' },
        { id: 2, text: 'The next answer is Monday.' },
      ],
      {
        q1: { questionNumber: 1, correctAnswer: 'newspaper' },
        q2: { questionNumber: 2, correctAnswer: 'Monday' },
      },
      [{ question_number: 1, phrase: 'wider evidence phrase mentions a newspaper' }]
    );

    expect(highlighted[0].displayParts.some((part) => part.questionNumber === 1)).toBe(true);
    expect(highlighted[1].displayParts).toContainEqual(
      expect.objectContaining({
        text: 'Monday',
        questionNumber: 2,
        showBadge: true,
      })
    );
  });
});
