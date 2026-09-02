import { describe, expect, it } from 'vitest';
import { parseBulkQuestions } from '@/lib/bulkQuestionParser';

const TFNG_INPUT = `Questions 6-13

Do the following statements agree with the information given in Reading Passage 1?

In boxes 6-13 on your answer sheet, write

TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

6. Dreaming about past experiences helps us to create lasting memories of them.
TRUE
FALSE
NOT GIVEN

7. It is now possible to tell what type of dream a dog is having.
TRUE
FALSE
NOT GIVEN

8. David Scheel's documentary was influential on other research into the sleeping patterns of octopuses.
TRUE
FALSE
NOT GIVEN

9. While it was asleep, the octopus called Costello reacted as if it was hunting.
TRUE
FALSE
NOT GIVEN

10. Scheel believes more research into octopuses' dreams should be carried out.
TRUE
FALSE
NOT GIVEN

11. We may soon be able to share the dreams of other human beings.
TRUE
FALSE
NOT GIVEN

12. Hearing may be an important part of the dreams of some animals.
TRUE
FALSE
NOT GIVEN

13. Interest in the reasons why humans dream has increased greatly in recent times.
TRUE
FALSE
NOT GIVEN`;

describe('reading bulk True/False/Not Given question parsing', () => {
  it('correctly parses TFNG questions without including option labels in question text', () => {
    const questions = parseBulkQuestions(TFNG_INPUT, 'Section 1');

    expect(questions).toHaveLength(8);
    expect(questions[0]).toMatchObject({
      question_number: 6,
      question_text: 'Dreaming about past experiences helps us to create lasting memories of them.',
      type: 'true_false_not_given',
      section: 'Section 1',
    });

    expect(questions[1]).toMatchObject({
      question_number: 7,
      question_text: 'It is now possible to tell what type of dream a dog is having.',
      type: 'true_false_not_given',
    });

    expect(questions[2]).toMatchObject({
      question_number: 8,
      question_text:
        "David Scheel's documentary was influential on other research into the sleeping patterns of octopuses.",
      type: 'true_false_not_given',
    });

    expect(questions[7]).toMatchObject({
      question_number: 13,
      question_text:
        'Interest in the reasons why humans dream has increased greatly in recent times.',
      type: 'true_false_not_given',
    });

    // Ensure none of the questions contain TRUE, FALSE, or NOT GIVEN in their question_text
    questions.forEach((q) => {
      expect(q.question_text).not.toContain('TRUE');
      expect(q.question_text).not.toContain('FALSE');
      expect(q.question_text).not.toContain('NOT GIVEN');
    });
  });

  it('cleans inline or bracketed TFNG labels from question text', () => {
    const sameLineInput = `Questions 1-2

Do the following statements agree with the information?

1. Statement one text. TRUE FALSE NOT GIVEN
2. Statement two text. [TRUE / FALSE / NOT GIVEN]`;

    const questions = parseBulkQuestions(sameLineInput, 'Section 1');

    expect(questions).toHaveLength(2);
    expect(questions[0].question_text).toBe('Statement one text.');
    expect(questions[1].question_text).toBe('Statement two text.');
  });
});
