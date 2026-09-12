/**
 * Single source of copy for the two search-landing pages.
 *
 * These routes are served twice: `scripts/generate-public-seo-pages.mjs` writes a
 * static `#static-prerender-content` article into dist/<path>/index.html for
 * crawlers that do not run JavaScript, and the React route renders the same
 * material for everyone else. When the two drifted apart, the static FAQPage
 * JSON-LD advertised questions the page no longer answered — so both consumers
 * read this file instead of keeping their own copy.
 *
 * No imports here on purpose: Node loads this directly from the build script,
 * with no bundler and no `@/` alias resolution.
 *
 * Test-format facts (part lengths, question counts, task types) are the published
 * IELTS formats. They are why these pages can rank, so keep them accurate.
 */

export const SITE_URL = 'https://www.ieltsai.pro';

export const SEO_LANDING_CONTENT = {
  speaking: {
    key: 'speaking',
    path: '/ielts-speaking-practice-ai',
    title: 'AI IELTS Speaking Practice with Feedback',
    breadcrumb: 'IELTS Speaking practice',
    description:
      'Practise IELTS Speaking Parts 1–3 with an AI simulator, estimated band guidance, and focused feedback on fluency, vocabulary, grammar, and pronunciation.',
    keywords:
      'AI IELTS speaking practice, IELTS speaking simulator, IELTS speaking questions, IELTS speaking feedback, IELTS speaking practice online',
    eyebrow: 'AI speaking practice',
    heading: 'IELTS Speaking practice tests with feedback you can act on',
    headingLead: 'IELTS Speaking practice tests with feedback you can',
    headingScript: 'act on',
    answer:
      'IELTS Ai Pro simulates Speaking Parts 1–3, records your response, and turns the available speech and transcript evidence into estimated criterion-level feedback. You get a clear next step instead of a single unexplained score.',
    primaryCta: 'Start speaking practice',
    primaryHref: '/signup',
    secondaryCta: 'Explore speaking questions and samples',
    secondaryHref: '/blog/ielts-speaking-topics-questions-cue-cards-tips',
    heroAlt: 'Adult IELTS learner practising a speaking response with a laptop',
    iconKey: 'mic',
    chips: ['Parts 1–3 simulation', 'Four assessed criteria', 'Transcript evidence'],
    proof: [
      ['Parts 1–3', 'Realistic question flow'],
      ['4 criteria', 'Focused practice feedback'],
      ['One report', 'Prioritised next steps'],
    ],
    featuresHeading: 'What an IELTS Speaking practice test includes',
    features: [
      {
        iconKey: 'mic',
        title: 'Real speaking flow',
        text: 'Move from short personal questions to a two-minute Part 2 response and deeper Part 3 discussion.',
      },
      {
        iconKey: 'chart',
        title: 'Criterion-level guidance',
        text: 'Review fluency, vocabulary, grammar, and pronunciation evidence with transparent limitations.',
      },
      {
        iconKey: 'sparkles',
        title: 'A useful next drill',
        text: 'Turn the report into one focused action for your next answer instead of repeating the full test blindly.',
      },
    ],
    breakdown: {
      eyebrow: 'Test format',
      heading: 'What the IELTS Speaking test actually asks',
      title: 'What the Speaking test',
      script: 'actually asks',
      description:
        'The full interview runs 11–14 minutes across three parts. Practising each part on its own is usually more productive than repeating the whole test.',
      items: [
        {
          id: 'part-1',
          iconKey: 'messages',
          title: 'Part 1 — Introduction and interview',
          meta: '4–5 minutes',
          points: [
            'Short questions on familiar topics: home, work, study, hobbies',
            'Answers of two or three sentences, not memorised speeches',
            'Assessed on natural fluency more than complex vocabulary',
          ],
        },
        {
          id: 'part-2',
          iconKey: 'timer',
          title: 'Part 2 — Individual long turn',
          meta: '1 minute preparation, 1–2 minutes speaking',
          points: [
            'A cue card with a topic and three or four prompts to cover',
            'One minute to make notes before you begin',
            'A short rounding-off question from the examiner at the end',
          ],
        },
        {
          id: 'part-3',
          iconKey: 'list',
          title: 'Part 3 — Two-way discussion',
          meta: '4–5 minutes',
          points: [
            'Abstract follow-up questions linked to the Part 2 topic',
            'Room to compare, speculate, and justify an opinion',
            'Where range of grammar and vocabulary is most visible',
          ],
        },
      ],
    },
    stepsHeading: 'How to practise IELTS Speaking effectively',
    steps: [
      [
        'Choose a speaking test',
        'Select a realistic Part 1–3 practice set and prepare your microphone.',
      ],
      [
        'Answer naturally',
        'Speak at normal pace without memorising a script or forcing advanced words.',
      ],
      [
        'Review and repeat',
        'Use the strongest evidence in the report to plan one measurable improvement.',
      ],
    ],
    faqs: [
      [
        'Can AI accurately score IELTS Speaking?',
        'AI can provide useful practice estimates and pattern-based feedback, but it cannot issue an official IELTS result. IELTS Ai Pro labels practice estimates and explains when pronunciation evidence is limited.',
      ],
      [
        'How long is the IELTS Speaking test?',
        'The full test runs 11–14 minutes: 4–5 minutes for Part 1, up to 3–4 minutes for Part 2 including one minute of preparation, and 4–5 minutes for the Part 3 discussion.',
      ],
      [
        'Does the practice cover all three IELTS Speaking parts?',
        'Yes. Practice sets can include short Part 1 questions, a Part 2 cue-card response, and more analytical Part 3 follow-up questions.',
      ],
      [
        'Which criteria is IELTS Speaking marked on?',
        'Four equally weighted criteria: fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation. Practice feedback is organised around the same four headings.',
      ],
      [
        'How should I use the feedback?',
        'Choose one priority from the report, practise it in a shorter drill, then record another answer and compare the evidence. Small focused repetitions are more useful than chasing a score after every response.',
      ],
    ],
  },

  practice: {
    key: 'practice',
    path: '/cambridge-ielts-practice-tests',
    title: 'Cambridge IELTS Practice Tests Online',
    breadcrumb: 'Cambridge IELTS practice tests',
    description:
      'Take Cambridge-style IELTS Reading and Listening practice tests online, review answers, estimate band scores, and track the mistakes that affect your result.',
    keywords:
      'Cambridge IELTS practice test, free IELTS practice test, IELTS mock test online, IELTS reading practice test, IELTS listening practice test',
    eyebrow: 'Online IELTS practice tests',
    heading: 'Free online IELTS practice tests with a smarter review loop',
    headingLead: 'Free online IELTS practice tests with a smarter',
    headingScript: 'review loop',
    answer:
      'IELTS Ai Pro gives you timed Reading and Listening practice online in a computer-based workspace, then helps you review question-level mistakes and estimated band progress. Use a full mock test to diagnose; use focused sets to improve.',
    primaryCta: 'Start a free practice test',
    primaryHref: '/signup',
    secondaryCta: 'Calculate your band',
    secondaryHref: '/ielts-band-score-calculator',
    heroAlt: 'Adult IELTS learner reviewing a computer-based practice test',
    iconKey: 'book',
    chips: ['Timed Reading sets', 'Cambridge-style Listening', 'Question-level review'],
    proof: [
      ['Reading', 'Timed question sets'],
      ['Listening', 'Cambridge-style practice'],
      ['Review', 'Answers and progress'],
    ],
    featuresHeading: 'What these online IELTS practice tests cover',
    features: [
      {
        iconKey: 'book',
        title: 'Reading practice',
        text: 'Work through common IELTS question types in a focused, computer-based test workspace.',
      },
      {
        iconKey: 'headphones',
        title: 'Listening practice',
        text: 'Practise following the question sequence, predicting answer forms, and recovering after a missed answer.',
      },
      {
        iconKey: 'pen',
        title: 'Review that changes the next test',
        text: 'Use answer evidence and progress analytics to separate knowledge gaps from timing and question-type errors.',
      },
    ],
    breakdown: {
      eyebrow: 'Test format',
      heading: 'IELTS Reading and Listening question types',
      title: 'Know the paper before you',
      script: 'time yourself',
      description:
        'Most lost marks in Reading and Listening come from question technique, not vocabulary. These are the task types each paper can use.',
      items: [
        {
          id: 'reading',
          iconKey: 'book',
          title: 'IELTS Reading',
          meta: '40 questions · 60 minutes · 3 passages',
          points: [
            'Multiple choice, and matching information, headings, features, or sentence endings',
            'True / False / Not Given, and Yes / No / Not Given for the writer’s views',
            'Sentence, summary, note, table, flow-chart, and diagram-label completion',
            'Short-answer questions, with a strict word limit on every answer',
            'No extra transfer time on the paper test — answers go straight onto the answer sheet',
          ],
        },
        {
          id: 'listening',
          iconKey: 'headphones',
          title: 'IELTS Listening',
          meta: '40 questions · 4 sections · audio played once',
          points: [
            'Multiple choice and matching tasks',
            'Plan, map, and diagram labelling',
            'Form, note, table, flow-chart, and summary completion',
            'Sentence completion and short-answer questions',
            'Paper test adds 10 minutes to transfer answers; the computer test gives 2 minutes to check',
          ],
        },
      ],
    },
    stepsHeading: 'How to use a mock test properly',
    steps: [
      [
        'Take a diagnostic set',
        'Complete one realistic section without pausing or checking answers.',
      ],
      [
        'Classify every error',
        'Label the cause: vocabulary, evidence, spelling, timing, or question technique.',
      ],
      [
        'Repeat a focused drill',
        'Practise the weakest pattern before taking another complete mock test.',
      ],
    ],
    faqs: [
      [
        'Are these official Cambridge IELTS tests?',
        'No. IELTS Ai Pro is an independent preparation platform and is not affiliated with Cambridge, IELTS, IDP, or the British Council. The practice experience is designed around familiar IELTS-style skills and question formats.',
      ],
      [
        'How long are the IELTS Reading and Listening tests?',
        'Reading gives you 60 minutes for 40 questions across three passages. Listening has 40 questions across four sections and the audio is played once; the paper test adds 10 minutes to transfer answers, while the computer-delivered test gives 2 minutes to check them.',
      ],
      [
        'Can I practise IELTS Reading and Listening for free?',
        'A free account provides access to selected practice. Availability and limits can vary by plan, and the app shows the current allowance before you begin.',
      ],
      [
        'What question types should I practise most?',
        'Practise the types your review flags repeatedly. Matching headings and True/False/Not Given tend to cost the most marks in Reading, while completion tasks in Listening are most often lost to spelling and word-limit slips rather than comprehension.',
      ],
      [
        'Should I take a full mock test every day?',
        'Usually not. Use full tests to measure readiness, then spend more time on short drills that target the exact question types and error causes found in your review.',
      ],
    ],
  },
};

/** Cross-links shown on both pages — internal linking the crawler can follow. */
export const RELATED_LINKS = [
  {
    href: '/cambridge-ielts-practice-tests',
    title: 'Cambridge-style practice tests',
    text: 'Timed Reading and Listening sets with question-level review.',
  },
  {
    href: '/ielts-speaking-practice-ai',
    title: 'AI Speaking practice',
    text: 'Parts 1–3 simulation with criterion-level feedback.',
  },
  {
    href: '/ielts-writing-checker',
    title: 'IELTS Writing checker',
    text: 'Task 1 and Task 2 feedback against the public band descriptors.',
  },
  {
    href: '/ielts-band-score-calculator',
    title: 'Band score calculator',
    text: 'Turn section scores into an estimated overall band.',
  },
  {
    href: '/blog',
    title: 'Preparation guides',
    text: 'Strategy articles for each of the four skills.',
  },
  {
    href: '/pricing',
    title: 'Plans and limits',
    text: 'What the free plan includes and what each paid plan adds.',
  },
];

/**
 * Builds the `prerender` block the static generator expects, so the crawler-only
 * HTML lists the same sections and the same FAQs the React route renders.
 */
export function toPrerenderConfig(content) {
  return {
    heading: content.heading,
    intro: content.answer,
    sections: [
      {
        heading: content.featuresHeading,
        items: content.features.map(
          (feature) => `<strong>${feature.title}:</strong> ${lowerFirst(feature.text)}`
        ),
      },
      {
        heading: content.breakdown.heading,
        items: content.breakdown.items.map(
          (item) => `<strong>${item.title} (${item.meta}):</strong> ${item.points.join('; ')}.`
        ),
      },
      {
        heading: content.stepsHeading,
        ordered: true,
        items: content.steps.map(
          ([title, text]) => `<strong>${title}:</strong> ${lowerFirst(text)}`
        ),
      },
      {
        heading: 'Keep preparing',
        items: RELATED_LINKS.filter((link) => link.href !== content.path).map(
          (link) => `<a href="${link.href}">${link.title}</a>: ${link.text}`
        ),
      },
    ],
    faqs: content.faqs,
  };
}

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
