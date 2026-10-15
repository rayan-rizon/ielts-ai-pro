// Reproduces the imported layout in the supplied bats question screenshot.
// Answers are layout fixtures, not an answer key for the source passage.
export const readingLayoutSections = () => [
  {
    title: 'Bats — layout verification',
    content: 'A\nPassage text stays independent of question layout.',
    question_groups: [
      {
        id: 'paragraphs',
        instructions:
          'Questions 1–5\nReading Passage 1 has five paragraphs, A–E. Which paragraph contains the following information? Choose the correct letter, A–E, in boxes 1–5 on your answer sheet. NB You may use any letter more than once.',
        questions: [
          {
            id: 'matching',
            type: 'matching_features',
            question_number: 1,
            matching_features: {
              box_title: 'Questions 1–5',
              style: 'ABC',
              mode: 'list',
              options: ['A', 'B', 'C', 'D', 'E'],
              questions: [
                'examples of wildlife other than bats which do not rely on vision to navigate by',
                'how early mammals avoided dying out',
                'why bats hunt in the dark',
                'how a particular discovery has helped our understanding of bats',
                'early military uses of echolocation',
              ].map((text, i) => ({ id: `m${i}`, questionNumber: i + 1, text, answer: 'A' })),
            },
          },
        ],
      },
      {
        id: 'summary',
        instructions:
          'Questions 6–9\nComplete the summary below. Choose ONE WORD ONLY from the passage for each answer. Write your answers in boxes 6–9 on your answer sheet.',
        questions: [
          {
            id: 'notes',
            type: 'notes_completion',
            question_number: 6,
            gap_fill: {
              title: 'Questions 6–9',
              structured_text:
                "Facial Vision\n\nBlind people report that so-called 'facial vision' is comparable to the sensation of touch on the face. In fact, the sensation is more similar to the way in which pain from a [6] arm or leg might be felt. The ability actually comes from perceiving [7] through the ears. However, even before this was understood, the principle had been applied in the design of instruments which calculated the [8] of the seabed. This was followed by a wartime application in devices for finding [9].",
              answers: { 6: 'fixture', 7: 'fixture', 8: 'fixture', 9: 'fixture' },
            },
          },
        ],
      },
      {
        id: 'headings',
        instructions:
          'Questions 10–13\nChoose the correct heading for each paragraph from the list of headings below. Choose the correct number, i–v, in boxes 10–13 on your answer sheet. (Example: Paragraph B – iii)',
        questions: [
          {
            id: 'headings',
            type: 'matching_features',
            question_number: 10,
            matching_features: {
              box_title: 'Questions 10–13',
              style: 'ROMAN',
              options: [
                'A scientific discovery',
                'Early research',
                'Navigation at night',
                'Military applications',
                'A modern theory',
              ],
              questions: ['Paragraph A', 'Paragraph C', 'Paragraph D', 'Paragraph E'].map(
                (text, i) => ({ id: `h${i}`, text, questionNumber: 10 + i, answer: 'i' })
              ),
            },
          },
        ],
      },
    ],
  },
];
