const transcript =
  'Guide: The library opened in 1999. Ada keeps seeds in glass jars. The first stage is washing and the last stage is drying.';
const item = (number, answer, text = `Question ${number}`) => ({
  number,
  answer,
  text,
  explanation: {
    why_correct: 'The audioscript explicitly provides this detail as the requested answer.',
    passage_highlight: transcript,
    synonym_map: [],
    why_wrong: {},
  },
});
export function aiListeningFixture() {
  const groups = [
    {
      type: 'notes_completion',
      instructions: 'NO MORE THAN TWO WORDS.',
      text: 'Opened in [1]. Stores seeds in [2].',
      items: [item(1, '1999'), item(2, 'glass jars')],
    },
    {
      type: 'table_completion',
      instructions: 'ONE WORD ONLY.',
      headers: ['Stage', 'Action'],
      rows: [
        ['First', '[3]'],
        ['Last', '[4]'],
      ],
      items: [item(3, 'washing'), item(4, 'drying')],
    },
    {
      type: 'matching_features',
      instructions: 'Match each person.',
      options: ['Ada', 'Guide'],
      items: [item(5, 'A'), item(6, 'B')],
    },
    {
      type: 'flowchart',
      instructions: 'ONE WORD ONLY.',
      steps: ['[7]', '[8]'],
      items: [item(7, 'washing'), item(8, 'drying')],
    },
  ];
  return {
    version: 1,
    title: 'Library Listening',
    issues: [],
    sections: groups.map((group, index) => ({
      title: `Part ${index + 1}`,
      content: transcript,
      groups: [group],
    })),
  };
}
export function aiListeningInput() {
  const draft = aiListeningFixture();
  return {
    passageText: draft.sections
      .map((section, i) => `Part ${i + 1}\n${section.content}`)
      .join('\n\n'),
    questionText: 'All questions 1–8 in four parts.',
    answerText: draft.sections
      .flatMap((section) =>
        section.groups.flatMap((group) =>
          group.items.map((item) => `${item.number}. ${item.answer}`)
        )
      )
      .join('\n'),
    expectedQuestions: 8,
    images: [],
    audioUrls: ['https://example.com/part1.mp3', '', '', ''],
  };
}
