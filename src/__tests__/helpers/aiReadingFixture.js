export const fixturePassage =
  'The garden opened in 1999. Ada planted roses in spring. Ben recorded two visitors. The seeds were stored in glass jars. The first stage is washing. The final stage is drying.';
const item = (number, answer, source = fixturePassage, extra = {}) => ({
  number,
  text: `Question ${number} from the source`,
  answer,
  explanation: {
    why_correct: `The passage provides the decisive information for question ${number}.`,
    passage_highlight: source,
    synonym_map: [],
    why_wrong: {},
  },
  ...extra,
});
export function aiReadingFixture() {
  const groups = [
    {
      type: 'true_false_not_given',
      instructions: 'TRUE, FALSE or NOT GIVEN',
      items: [item(1, 'TRUE')],
    },
    { type: 'yes_no_not_given', instructions: 'YES, NO or NOT GIVEN', items: [item(2, 'NO')] },
    {
      type: 'multiple_choice',
      instructions: 'Choose one letter.',
      items: [item(3, 'B', fixturePassage, { options: ['Ada', 'Ben'] })],
    },
    {
      type: 'matching_headings',
      instructions: 'Match headings.',
      options: ['Early history', 'Seed storage'],
      style: 'ROMAN',
      items: [item(4, 'i'), item(5, 'ii')],
    },
    {
      type: 'multiple_choice',
      instructions: 'Choose TWO letters.',
      select_count: 2,
      options: ['Roses', 'Rocks', 'Seeds'],
      items: [item(6, 'A'), item(7, 'C')],
    },
    {
      type: 'notes_completion',
      instructions: 'ONE WORD ONLY.',
      text: 'Seeds were stored in [8].',
      items: [item(8, 'glass')],
    },
    {
      type: 'table_completion',
      instructions: 'ONE WORD ONLY.',
      headers: ['Item', 'Container'],
      rows: [['Seeds', '[9]']],
      items: [item(9, 'jars')],
    },
    {
      type: 'flowchart',
      instructions: 'ONE WORD ONLY.',
      steps: ['Start with [10]', 'Finish with [11]'],
      items: [item(10, 'washing'), item(11, 'drying')],
    },
    { type: 'short_answer', instructions: 'A NUMBER.', items: [item(12, '1999')] },
    {
      type: 'sentence_completion',
      instructions: 'ONE WORD ONLY.',
      items: [item(13, 'spring', fixturePassage, { text: 'Ada planted roses in [13].' })],
    },
  ];
  return {
    version: 1,
    title: 'Garden Reading',
    issues: [],
    sections: [{ title: 'The garden', content: fixturePassage, groups }],
  };
}
export function aiReadingInput() {
  return {
    expectedQuestions: 13,
    passageText: fixturePassage,
    questionText: 'Questions 1–13 from the source.',
    answerText: aiReadingFixture()
      .sections[0].groups.flatMap((group) => group.items)
      .map((value) => `${value.number}. ${value.answer}`)
      .join('\n'),
    images: [],
  };
}
